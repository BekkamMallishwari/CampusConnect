import { Router } from 'express';
import { z } from 'zod';
import LostItem from '../models/LostItem';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const createLostItemSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  category: z.string().trim().min(2, 'Category is required'),
  status: z.enum(['Lost', 'Found']),
  location: z.string().trim().min(2, 'Location is required'),
  date: z.string().or(z.date()),
  contactInfo: z.string().trim().min(2, 'Contact Info is required'),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const updateLostItemSchema = createLostItemSchema.partial();

// GET /api/lost-found
router.get('/', async (req, res, next) => {
  try {
    const { search, category, status, isClaimed, sort } = req.query;
    
    const query: any = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (isClaimed !== undefined) {
      query.isClaimed = isClaimed === 'true';
    }

    let sortObj: any = { createdAt: -1 }; // newest by default
    if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    }

    const items = await LostItem.find(query).sort(sortObj).populate('postedBy', 'name email').populate('claimedBy', 'name email');
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

// GET /api/lost-found/my-posts
router.get('/my-posts', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    const items = await LostItem.find({ postedBy: userId }).sort({ createdAt: -1 }).populate('postedBy', 'name email').populate('claimedBy', 'name email');
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

// GET /api/lost-found/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await LostItem.findById(req.params.id).populate('postedBy', 'name email').populate('claimedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

// POST /api/lost-found
router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const parsed = createLostItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid item details' });
    }

    const userId = req.user?.userId;
    const item = await LostItem.create({
      ...parsed.data,
      postedBy: userId,
    });

    return res.status(201).json({ message: 'Item created successfully', item });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/lost-found/:id
router.put('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const parsed = updateLostItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid item details' });
    }

    const userId = req.user?.userId;
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    Object.assign(item, parsed.data);
    await item.save();

    return res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/lost-found/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await item.deleteOne();

    return res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/lost-found/:id/claim
router.patch('/:id/claim', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only the author can mark this item as claimed' });
    }

    item.isClaimed = true;
    // We can just keep claimedBy empty or we could allow them to pass a user ID, 
    // but the requirements say "Mark as Claimed", so we just set it to true.
    await item.save();

    return res.json({ message: 'Item marked as claimed', item });
  } catch (error) {
    return next(error);
  }
});

export default router;
