import { Router, Response, NextFunction } from 'express';
import UserModel from '../models/User';
import LostItemModel from '../models/LostItem';
import FoundItemModel from '../models/FoundItem';
import MatchModel from '../models/Match';
import PaymentModel from '../models/Payment';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/admin/analytics
router.get('/analytics', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalLostItems, totalFoundItems, totalMatches, totalPayments, acceptedMatches, completedPayments] =
      await Promise.all([
        UserModel.countDocuments(),
        LostItemModel.countDocuments({ isActive: true }),
        FoundItemModel.countDocuments({ isActive: true }),
        MatchModel.countDocuments(),
        PaymentModel.countDocuments(),
        MatchModel.countDocuments({ matchStatus: 'Accepted' }),
        PaymentModel.countDocuments({ status: 'Completed' }),
      ]);
    const revenueAgg = await PaymentModel.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    res.json({
      totalUsers,
      totalLostItems,
      totalFoundItems,
      totalMatches,
      acceptedMatches,
      totalPayments,
      completedPayments,
      totalRevenue,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query: Record<string, unknown> = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    const users = await UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await UserModel.countDocuments(query);
    res.json({ users, total, page: Number(page) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/block
router.patch('/users/:id/block', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserModel.findById(_req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports
router.get('/reports', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type = 'lost', page = 1, limit = 20 } = req.query;
    if (type === 'found') {
      const items = await FoundItemModel.find()
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('postedBy', 'name email');
      const total = await FoundItemModel.countDocuments();
      res.json({ items, total });
    } else {
      const items = await LostItemModel.find()
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('postedBy', 'name email');
      const total = await LostItemModel.countDocuments();
      res.json({ items, total });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/reports/:id
router.delete('/reports/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type = 'lost' } = req.query;
    if (type === 'found') {
      await FoundItemModel.findByIdAndDelete(req.params.id);
    } else {
      await LostItemModel.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Report removed successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/matches
router.get('/matches', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await MatchModel.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('lostUserId', 'name email')
      .populate('foundUserId', 'name email')
      .populate('lostItemId', 'itemName')
      .populate('foundItemId', 'itemName');
    res.json({ matches });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/payments
router.get('/payments', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await PaymentModel.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('lostUserId', 'name email')
      .populate('foundUserId', 'name email');
    res.json({ payments });
  } catch (error) {
    next(error);
  }
});

export default router;
