import mongoose from "mongoose";
import { Router, Response, NextFunction } from 'express';
import { SortOrder } from 'mongoose';
import { z } from 'zod';
import FoundItemModel, { IFoundItem } from '../models/FoundItem';
import LostItemModel from '../models/LostItem';
import MatchModel from '../models/Match';
import ChatModel from '../models/Chat';
import NotificationModel from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../services/cloudinaryService';
import { deleteStoredLostFoundImage, storeLostFoundImages } from '../services/lostFoundImageService';
import { triggerMatchingForFoundItem } from '../services/matchingService';
import UserModel from '../models/User';
import { POINTS, awardPoints } from '../services/rewardService';
import { emitToUser } from '../services/socketHub';

const router = Router();
const uploadFoundItemImages = upload.array('images', 5);

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];

const createFoundItemSchema = z
  .object({
    itemName: z.string().trim().min(1, 'Please enter the item name'),
    category: z.enum(['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other']),
    foundDate: z.string(),
    foundTime: z.string().optional(),
    foundLocation: z.string().trim().min(2, 'Location is required'),
    description: z.string().trim().min(5, 'Description must be at least 5 characters'),
    condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
    rewardExpected: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
    rewardAmount: z.preprocess((v) => {
      if (v === '' || v === undefined || v === null || Number.isNaN(Number(v))) return 0;
      return Number(v);
    }, z.number().min(0).default(0)).optional(),
    existingImageUrls: z.string().optional(),
    existingImagePublicIds: z.string().optional(),
  })
  .refine((data) => {
    if (data.category === 'Other') {
      return typeof data.itemName === 'string' && data.itemName.trim().length >= 1;
    }
    return true;
  }, {
    message: 'Please enter the item name.',
    path: ['itemName'],
  });

const parseStringArray = (value?: string): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0) : [];
  } catch {
    return [];
  }
};

// GET /api/found-items
router.get('/', async (req, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, status, sort } = req.query;
    const query: Record<string, unknown> = { isActive: true };

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { itemName: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { condition: searchRegex },
        { foundLocation: searchRegex },
      ];
    }

    if (category && category !== 'All' && CATEGORIES.includes(category as string)) query.category = category;
    if (status && ['Waiting', 'Matched', 'Returned'].includes(status as string)) query.status = status;
    const sortObj: Record<string, SortOrder> = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const items = await FoundItemModel.find(query).sort(sortObj).populate('postedBy', 'name email avatar phone');
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET /api/found-items/my-items
router.get('/my-items', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await FoundItemModel.find({ postedBy: req.user?.userId }).sort({ createdAt: -1 }).populate('postedBy', 'name email avatar phone');
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

// POST /api/found-items
router.post(
  '/',
  requireAuth,
  uploadFoundItemImages,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createFoundItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid item details' });
        return;
      }
      const files = (req.files as Express.Multer.File[] | undefined) || [];
      const uploadedImages = files.length > 0 ? await storeLostFoundImages(req, files) : [];
      const existingImageUrls = parseStringArray(parsed.data.existingImageUrls);
      const existingImagePublicIds = parseStringArray(parsed.data.existingImagePublicIds);
      const images = [...existingImageUrls, ...uploadedImages.map((entry) => entry.imageUrl)];
      const imagePublicIds = [...existingImagePublicIds, ...uploadedImages.map((entry) => entry.imagePublicId)];

      const foundItem = await FoundItemModel.create({
        ...parsed.data,
        imageUrl: images[0] || '',
        imagePublicId: imagePublicIds[0] || '',
        imagePublicIds,
        images,
        postedBy: req.user?.userId,
        foundDate: new Date(parsed.data.foundDate),
      });
      const populatedItem = await foundItem.populate('postedBy', 'name email avatar phone');
      await awardPoints(req.user!.userId, POINTS.foundReport);

      // Trigger matching asynchronously
      triggerMatchingForFoundItem(foundItem, req.user!.userId).catch((err) =>
        console.error('[Matching] Error during auto-match:', err),
      );

      res.status(201).json({ message: 'Found item reported successfully', item: populatedItem });
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/found-items/:id
router.put(
  '/:id',
  requireAuth,
  uploadFoundItemImages,
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

      const files = (req.files as Express.Multer.File[] | undefined) || [];
      const uploadedImages = files.length > 0 ? await storeLostFoundImages(req, files) : [];
      const existingImageUrls = parseStringArray(parsed.data.existingImageUrls);
      const existingImagePublicIds = parseStringArray(parsed.data.existingImagePublicIds);

      const previousImageIds = item.imagePublicIds && item.imagePublicIds.length > 0
        ? item.imagePublicIds
        : item.imagePublicId
          ? [item.imagePublicId]
          : [];
      const previousImageUrls = item.images && item.images.length > 0
        ? item.images
        : item.imageUrl
          ? [item.imageUrl]
          : [];

      const shouldReplaceImages =
        files.length > 0 ||
        parsed.data.existingImageUrls !== undefined ||
        parsed.data.existingImagePublicIds !== undefined;

      const nextImageUrls = shouldReplaceImages
        ? [...existingImageUrls, ...uploadedImages.map((entry) => entry.imageUrl)]
        : previousImageUrls;
      const nextImagePublicIds = shouldReplaceImages
        ? [...existingImagePublicIds, ...uploadedImages.map((entry) => entry.imagePublicId)]
        : previousImageIds;

      if (shouldReplaceImages) {
        const removedPublicIds = previousImageIds.filter((id: string) => !nextImagePublicIds.includes(id));
        await Promise.all(removedPublicIds.map((identifier: string) => deleteStoredLostFoundImage(identifier)));
      }

      Object.assign(item, parsed.data);
      if (parsed.data.foundDate) item.foundDate = new Date(parsed.data.foundDate);
      item.images = nextImageUrls;
      item.imagePublicIds = nextImagePublicIds;
      item.imageUrl = nextImageUrls[0] || '';
      item.imagePublicId = nextImagePublicIds[0] || '';
      await item.save();
      const populatedItem = await item.populate('postedBy', 'name email avatar phone');
      res.json({ message: 'Item updated successfully', item: populatedItem });
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

    const imageIdentifiers = item.imagePublicIds && item.imagePublicIds.length > 0
      ? item.imagePublicIds
      : item.imagePublicId
        ? [item.imagePublicId]
        : [];
    await Promise.all(imageIdentifiers.map((identifier: string) => deleteStoredLostFoundImage(identifier)));
    item.isActive = false;
    await item.save();
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/found-items/:id/mark-returned
router.post('/:id/mark-returned', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await FoundItemModel.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    if (item.postedBy.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'Only the owner can mark this item as returned' });
      return;
    }
    if (item.status === 'Returned') {
      res.json({ message: 'This item has already been returned.', item });
      return;
    }

    item.status = 'Returned';
    item.isActive = false;
    item.returnedAt = new Date();
    await item.save();

    await ChatModel.updateMany(
      { itemId: item._id, kind: 'conversation' },
      { isClosed: true, closedAt: new Date() },
    );

    const chats = await ChatModel.find({ itemId: item._id, kind: 'conversation' }).select('requesterId');
    await Promise.all(
      chats.map(async (chat) => {
        if (!chat.requesterId) return;
        await NotificationModel.create({
          userId: chat.requesterId,
          type: 'Item',
          title: 'Item returned',
          message: `The item "${item.itemName}" has been marked as returned.`,
          relatedId: item._id as any,
          relatedModel: 'FoundItem',
        });
        emitToUser(chat.requesterId.toString(), 'notification:new', {
          title: 'Item returned',
          message: `The item "${item.itemName}" has been marked as returned.`,
          type: 'Item',
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }),
    );

    await awardPoints(req.user!.userId, POINTS.returnedItem);
    res.json({ message: 'Item marked as returned', item });
  } catch (error) {
    next(error);
  }
});

export default router;
