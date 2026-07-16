import { Router, Response, NextFunction } from 'express';
import { SortOrder } from 'mongoose';
import { z } from 'zod';
import LostItemModel from '../models/LostItem';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { upload, uploadMultipleImages } from '../services/cloudinaryService';

const router = Router();

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];

const createLostItemSchema = z.object({
  itemName: z.string().trim().min(2, 'Item name is required'),
  category: z.enum(['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other']),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  lostDate: z.string(),
  lostTime: z.string().optional(),
  lostLocation: z.string().trim().min(2, 'Location is required'),
  color: z.string().optional(),
  brand: z.string().optional(),
  additionalNotes: z.string().optional(),
  contactNumber: z.string().trim().min(7, 'Contact number is required'),
});

// GET /api/lost-items
router.get('/', async (req, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, status, sort } = req.query;
    const query: Record<string, unknown> = { isActive: true };
    if (search) query.itemName = { $regex: search, $options: 'i' };
    if (category && category !== 'All' && CATEGORIES.includes(category as string)) query.category = category;
    if (status && ['Pending', 'Matched', 'Returned'].includes(status as string)) query.status = status;
    const sortObj: Record<string, SortOrder> = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const items = await LostItemModel.find(query).sort(sortObj).populate('postedBy', 'name email avatar');
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET /api/lost-items/my-items
router.get('/my-items', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await LostItemModel.find({ postedBy: req.user?.userId }).sort({ createdAt: -1 }).populate('postedBy', 'name email avatar');
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// GET /api/lost-items/:id
router.get('/:id', async (req, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await LostItemModel.findById(req.params.id).populate('postedBy', 'name email avatar phone collegeName');
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// POST /api/lost-items
router.post(
  '/',
  requireAuth,
  upload.array('images', 5),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createLostItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid item details' });
        return;
      }
      const files = req.files as Express.Multer.File[] | undefined;
      const images = files && files.length > 0 ? await uploadMultipleImages(files) : [];
      const item = await LostItemModel.create({
        ...parsed.data,
        images,
        postedBy: req.user?.userId,
        lostDate: new Date(parsed.data.lostDate),
      });
      res.status(201).json({ message: 'Lost item reported successfully', item });
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/lost-items/:id
router.put(
  '/:id',
  requireAuth,
  upload.array('images', 5),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await LostItemModel.findById(req.params.id);
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }
      if (item.postedBy.toString() !== req.user?.userId) {
        res.status(403).json({ message: 'You can only edit your own reports' });
        return;
      }
      const updateSchema = createLostItemSchema.partial();
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
      if (parsed.data.lostDate) item.lostDate = new Date(parsed.data.lostDate);
      await item.save();
      res.json({ message: 'Item updated successfully', item });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/lost-items/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await LostItemModel.findById(req.params.id);
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
