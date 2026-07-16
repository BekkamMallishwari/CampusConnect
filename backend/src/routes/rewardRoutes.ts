import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import RewardModel from '../models/Reward';
import MatchModel from '../models/Match';
import NotificationModel from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// POST /api/rewards — found user creates a reward request
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      matchId: z.string(),
      requestedAmount: z.number().positive(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid data' });
      return;
    }
    const match = await MatchModel.findById(parsed.data.matchId);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    if (match.foundUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Only the finder can request a reward' });
      return;
    }
    const existing = await RewardModel.findOne({ matchId: parsed.data.matchId });
    if (existing) {
      res.status(409).json({ message: 'A reward request already exists for this match' });
      return;
    }
    const reward = await RewardModel.create({
      matchId: parsed.data.matchId,
      lostUserId: match.lostUserId,
      foundUserId: req.user!.userId,
      requestedAmount: parsed.data.requestedAmount,
      history: [{ proposedBy: req.user!.userId, amount: parsed.data.requestedAmount, action: 'Proposed' }],
    });
    match.rewardStatus = 'Pending';
    await match.save();
    await NotificationModel.create({
      userId: match.lostUserId,
      type: 'Reward',
      title: 'Reward requested',
      message: `The finder has requested a reward of $${parsed.data.requestedAmount}. You can accept, reject, or negotiate.`,
      relatedId: reward._id as any,
      relatedModel: 'Reward',
    });
    res.status(201).json({ message: 'Reward request created', reward });
  } catch (error) {
    next(error);
  }
});

// GET /api/rewards/:matchId
router.get('/:matchId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reward = await RewardModel.findOne({ matchId: req.params.matchId });
    if (!reward) {
      res.status(404).json({ message: 'No reward request found' });
      return;
    }
    const isParticipant =
      reward.lostUserId.toString() === req.user!.userId ||
      reward.foundUserId.toString() === req.user!.userId;
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    res.json({ reward });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/rewards/:id/accept
router.patch('/:id/accept', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reward = await RewardModel.findById(req.params.id);
    if (!reward) {
      res.status(404).json({ message: 'Reward not found' });
      return;
    }
    if (reward.lostUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Only the owner can accept the reward' });
      return;
    }
    reward.status = 'Accepted';
    reward.finalAmount = reward.requestedAmount;
    await reward.save();
    const match = await MatchModel.findById(reward.matchId);
    if (match) { match.rewardStatus = 'Accepted'; await match.save(); }
    await NotificationModel.create({
      userId: reward.foundUserId,
      type: 'Reward',
      title: 'Reward accepted!',
      message: `The owner accepted your reward request of $${reward.requestedAmount}. They will proceed with payment.`,
      relatedId: reward._id as any,
      relatedModel: 'Reward',
    });
    res.json({ message: 'Reward accepted', reward });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/rewards/:id/reject
router.patch('/:id/reject', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reward = await RewardModel.findById(req.params.id);
    if (!reward) {
      res.status(404).json({ message: 'Reward not found' });
      return;
    }
    if (reward.lostUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Only the owner can reject the reward' });
      return;
    }
    reward.status = 'Rejected';
    await reward.save();
    const match = await MatchModel.findById(reward.matchId);
    if (match) { match.rewardStatus = 'Rejected'; await match.save(); }
    await NotificationModel.create({
      userId: reward.foundUserId,
      type: 'Reward',
      title: 'Reward rejected',
      message: 'The owner declined the reward. Contact sharing will proceed without payment.',
      relatedId: reward._id as any,
      relatedModel: 'Reward',
    });
    res.json({ message: 'Reward rejected', reward });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/rewards/:id/negotiate
router.patch('/:id/negotiate', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({ amount: z.number().positive() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Valid amount is required' });
      return;
    }
    const reward = await RewardModel.findById(req.params.id);
    if (!reward) {
      res.status(404).json({ message: 'Reward not found' });
      return;
    }
    const isParticipant =
      reward.lostUserId.toString() === req.user!.userId ||
      reward.foundUserId.toString() === req.user!.userId;
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    reward.requestedAmount = parsed.data.amount;
    reward.status = 'Negotiating';
    reward.history.push({ proposedBy: req.user!.userId as any, amount: parsed.data.amount, action: 'Negotiated', createdAt: new Date() });
    await reward.save();
    const match = await MatchModel.findById(reward.matchId);
    if (match) { match.rewardStatus = 'Negotiating'; await match.save(); }
    const notifyUserId = reward.lostUserId.toString() === req.user!.userId ? reward.foundUserId : reward.lostUserId;
    await NotificationModel.create({
      userId: notifyUserId,
      type: 'Reward',
      title: 'New reward counter-offer',
      message: `A new reward amount of $${parsed.data.amount} has been proposed.`,
      relatedId: reward._id as any,
      relatedModel: 'Reward',
    });
    res.json({ message: 'Counter-offer sent', reward });
  } catch (error) {
    next(error);
  }
});

export default router;
