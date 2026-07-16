import { Router, Response, NextFunction } from 'express';
import NotificationModel from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await NotificationModel.countDocuments({ userId: req.user!.userId, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { isRead: true },
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await NotificationModel.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
