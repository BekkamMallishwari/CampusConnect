import { Router, Response, NextFunction } from 'express';
import MatchModel from '../models/Match';
import ChatModel from '../models/Chat';
import LostItemModel from '../models/LostItem';
import FoundItemModel from '../models/FoundItem';
import NotificationModel from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/matches — get all matches for the authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const matches = await MatchModel.find({
      $or: [{ lostUserId: userId }, { foundUserId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('lostUserId', 'name email avatar')
      .populate('foundUserId', 'name email avatar')
      .populate('lostItemId')
      .populate('foundItemId');
    res.json({ matches });
  } catch (error) {
    next(error);
  }
});

// GET /api/matches/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id)
      .populate('lostUserId', 'name email avatar phone collegeName')
      .populate('foundUserId', 'name email avatar phone collegeName')
      .populate('lostItemId')
      .populate('foundItemId');
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    const isParticipant =
      match.lostUserId.toString() === userId || match.foundUserId.toString() === userId;
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    res.json({ match });
  } catch (error) {
    next(error);
  }
});

// POST /api/matches/:id/accept
router.post('/:id/accept', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    const isLostUser = match.lostUserId.toString() === userId;
    const isFoundUser = match.foundUserId.toString() === userId;
    if (!isLostUser && !isFoundUser) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    if (isLostUser) match.lostUserAccepted = true;
    if (isFoundUser) match.foundUserAccepted = true;

    // If both accepted, update status and create chat room
    if (match.lostUserAccepted && match.foundUserAccepted) {
      match.matchStatus = 'Accepted';
      const lostItem = await LostItemModel.findById(match.lostItemId);
      const foundItem = await FoundItemModel.findById(match.foundItemId);
      if (lostItem) { lostItem.status = 'Matched'; await lostItem.save(); }
      if (foundItem) { foundItem.status = 'Matched'; await foundItem.save(); }

      // Create chat room if it doesn't exist
      const existingChat = await ChatModel.findOne({ matchId: match._id });
      if (!existingChat) {
        await ChatModel.create({
          matchId: match._id,
          participants: [match.lostUserId, match.foundUserId],
        });
      }

      // Notify both
      await NotificationModel.create([
        {
          userId: match.lostUserId,
          type: 'Match',
          title: 'Match accepted!',
          message: 'Both parties accepted the match. Your chat is now open.',
          relatedId: match._id,
          relatedModel: 'Match',
        },
        {
          userId: match.foundUserId,
          type: 'Match',
          title: 'Match accepted!',
          message: 'Both parties accepted the match. Your chat is now open.',
          relatedId: match._id,
          relatedModel: 'Match',
        },
      ]);
    }
    await match.save();
    res.json({ message: 'Match accepted', match });
  } catch (error) {
    next(error);
  }
});

// POST /api/matches/:id/reject
router.post('/:id/reject', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    const isParticipant = match.lostUserId.toString() === userId || match.foundUserId.toString() === userId;
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    match.matchStatus = 'Rejected';
    await match.save();
    res.json({ message: 'Match rejected', match });
  } catch (error) {
    next(error);
  }
});

export default router;
