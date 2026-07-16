import { Router, Response, NextFunction } from 'express';
import { SortOrder } from 'mongoose';
import { z } from 'zod';
import FoundItemModel, { IFoundItem } from '../models/FoundItem';
import LostItemModel from '../models/LostItem';
import MatchModel from '../models/Match';
import NotificationModel from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { upload, uploadMultipleImages } from '../services/cloudinaryService';
import { calculateMatchScore, MATCH_THRESHOLD } from '../services/matchingService';
import { sendMatchNotificationEmail } from '../services/emailService';
import UserModel from '../models/User';

const router = Router();

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];

const createFoundItemSchema = z.object({
  itemName: z.string().trim().min(2, 'Item name is required'),
  category: z.enum(['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other']),
  foundDate: z.string(),
  foundTime: z.string().optional(),
  foundLocation: z.string().trim().min(2, 'Location is required'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  rewardExpected: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  rewardAmount: z.preprocess((v) => (v ? Number(v) : undefined), z.number().positive().optional()),
});

// GET /api/found-items
router.get('/', async (req, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, status, sort } = req.query;
    const query: Record<string, unknown> = { isActive: true };
    if (search) query.itemName = { $regex: search, $options: 'i' };
    if (category && category !== 'All' && CATEGORIES.includes(category as string)) query.category = category;
    if (status && ['Waiting', 'Matched', 'Returned'].includes(status as string)) query.status = status;
    const sortObj: Record<string, SortOrder> = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const items = await FoundItemModel.find(query).sort(sortObj).populate('postedBy', 'name email avatar');
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET /api/found-items/my-items
router.get('/my-items', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await FoundItemModel.find({ postedBy: req.user?.userId }).sort({ createdAt: -1 }).populate('postedBy', 'name email avatar');
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET /api/found-items/:id
router.get('/:id', async (req, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await FoundItemModel.findById(req.params.id).populate('postedBy', 'name email avatar phone collegeName');
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// POST /api/found-items — creates item and triggers matching
router.post(
  '/',
  requireAuth,
  upload.array('images', 5),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createFoundItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid item details' });
        return;
      }
      const files = req.files as Express.Multer.File[] | undefined;
      const images = files && files.length > 0 ? await uploadMultipleImages(files) : [];
      const foundItem = await FoundItemModel.create({
        ...parsed.data,
        images,
        postedBy: req.user?.userId,
        foundDate: new Date(parsed.data.foundDate),
      });

      // Trigger matching asynchronously
      triggerMatching(foundItem, req.user!.userId).catch((err) =>
        console.error('[Matching] Error during auto-match:', err),
      );

      res.status(201).json({ message: 'Found item reported successfully', item: foundItem });
    } catch (error) {
      next(error);
    }
  },
);

// Async matching logic
async function triggerMatching(foundItem: IFoundItem, foundUserId: string): Promise<void> {
  const activeLostItems = await LostItemModel.find({ isActive: true, status: 'Pending' });

  for (const lostItem of activeLostItems) {
    // Don't match your own items
    if (lostItem.postedBy.toString() === foundUserId) continue;

    const existing = await MatchModel.findOne({ lostItemId: lostItem._id, foundItemId: foundItem._id });
    if (existing) continue;

    const { total } = calculateMatchScore(lostItem, foundItem);

    if (total >= MATCH_THRESHOLD) {
      const match = await MatchModel.create({
        lostUserId: lostItem.postedBy,
        foundUserId,
        lostItemId: lostItem._id,
        foundItemId: foundItem._id,
        matchPercentage: total,
      });

      // Create notifications for both users
      await NotificationModel.create([
        {
          userId: lostItem.postedBy,
          type: 'Match',
          title: 'Possible match found!',
          message: `We found a possible match for your lost "${lostItem.itemName}" — ${total}% confidence.`,
          relatedId: match._id,
          relatedModel: 'Match',
        },
        {
          userId: foundUserId,
          type: 'Match',
          title: 'Possible owner found!',
          message: `Someone may have lost the "${foundItem.itemName}" you reported — ${total}% confidence.`,
          relatedId: match._id,
          relatedModel: 'Match',
        },
      ]);

      // Send email notifications
      const [lostUser, foundUser] = await Promise.all([
        UserModel.findById(lostItem.postedBy),
        UserModel.findById(foundUserId),
      ]);
      if (lostUser && foundUser) {
        sendMatchNotificationEmail({
          lostUser: { name: lostUser.name, email: lostUser.email },
          foundUser: { name: foundUser.name, email: foundUser.email },
          lostItem: { itemName: lostItem.itemName, description: lostItem.description, images: lostItem.images },
          foundItem: { itemName: foundItem.itemName, description: foundItem.description, images: foundItem.images },
          matchPercentage: total,
          matchId: (match._id as { toString(): string }).toString(),
        }).catch((e) => console.error('[Email] Notification error:', e));
      }
    }
  }
}

// PUT /api/found-items/:id
router.put(
  '/:id',
  requireAuth,
  upload.array('images', 5),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await FoundItemModel.findById(req.params.id);
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }
      if (item.postedBy.toString() !== req.user?.userId) {
        res.status(403).json({ message: 'You can only edit your own reports' });
        return;
      }
      const updateSchema = createFoundItemSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid data' });
        return;
      }
      const files = req.files as Express.Multer.File[] | undefined;
      if (files && files.length > 0) {
        const newImages = await uploadMultipleImages(files);
        item.images = [...item.images, ...newImages];
      }
      Object.assign(item, parsed.data);
      if (parsed.data.foundDate) item.foundDate = new Date(parsed.data.foundDate);
      await item.save();
      res.json({ message: 'Item updated successfully', item });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/found-items/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await FoundItemModel.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    if (item.postedBy.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'You can only delete your own reports' });
      return;
    }
    item.isActive = false;
    await item.save();
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
