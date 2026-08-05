import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import RewardModel from '../models/Reward';
import MatchModel from '../models/Match';
import NotificationModel from '../models/Notification';
import UserModel from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { emitToUser } from '../services/socketHub';
import { sendSms } from '../services/smsService';

const router = Router();

// PUT /api/rewards/match/:matchId/update - Owner updates the reward amount
router.put('/match/:matchId/update', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      amount: z.number().positive(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid amount' });
      return;
    }

    const match = await MatchModel.findById(req.params.matchId);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    
    // Only lost item owner can update the reward
    if (match.lostUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Only the item owner can update the reward amount' });
      return;
    }

    // Check if it's already accepted
    if (match.rewardStatus === 'Accepted' || match.rewardStatus === 'Paid') {
      res.status(400).json({ message: 'Reward is already accepted or paid and cannot be edited.' });
      return;
    }

    // Update Match
    match.rewardAmount = parsed.data.amount;
    match.rewardStatus = 'Negotiating';
    await match.save();

    // Update Reward document if exists
    let reward = await RewardModel.findOne({ matchId: match._id });
    if (!reward) {
      reward = await RewardModel.create({
        matchId: match._id,
        lostUserId: match.lostUserId,
        foundUserId: match.foundUserId,
        requestedAmount: parsed.data.amount,
        status: 'Negotiating',
        history: [{ proposedBy: match.lostUserId, amount: parsed.data.amount, action: 'Proposed' }]
      });
    } else {
      reward.requestedAmount = parsed.data.amount;
      reward.status = 'Negotiating';
      reward.history.push({ proposedBy: match.lostUserId as any, amount: parsed.data.amount, action: 'Negotiated', createdAt: new Date() });
      await reward.save();
    }

    // Notify Finder
    await NotificationModel.create({
      userId: match.foundUserId,
      type: 'Reward',
      title: 'Reward Updated',
      message: `The owner has updated the reward offer to ₹${parsed.data.amount}.`,
      relatedId: match._id as any,
      relatedModel: 'Match',
    });

    emitToUser(match.foundUserId.toString(), 'reward:updated', { matchId: match._id, amount: parsed.data.amount, status: 'Negotiating' });
    emitToUser(match.foundUserId.toString(), 'notification:new', {
      title: 'Reward Updated',
      matchId: match._id,
    });
    // Trigger chat update
    emitToUser(match.foundUserId.toString(), 'match:updated', { matchId: match._id.toString() });
    emitToUser(match.lostUserId.toString(), 'match:updated', { matchId: match._id.toString() });

    res.json({ message: 'Reward amount updated successfully', rewardAmount: parsed.data.amount });
  } catch (error) {
    next(error);
  }
});

// POST /api/rewards/match/:matchId/accept - Finder accepts the reward
router.post('/match/:matchId/accept', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const match = await MatchModel.findById(req.params.matchId);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    
    // Only finder can accept
    if (match.foundUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Only the finder can accept the reward' });
      return;
    }

    if (match.rewardStatus === 'Accepted' || match.rewardStatus === 'Paid') {
      res.status(400).json({ message: 'Reward is already accepted or paid.' });
      return;
    }

    match.rewardStatus = 'Accepted';
    match.paymentStatus = 'PENDING'; // Payment is now pending after finder accepts
    await match.save();

    let reward = await RewardModel.findOne({ matchId: match._id });
    if (reward) {
      reward.status = 'Accepted';
      reward.finalAmount = reward.requestedAmount;
      await reward.save();
    }

    // Notify Owner
    const notif = await NotificationModel.create({
      userId: match.lostUserId,
      type: 'Reward',
      title: '🎉 Reward Accepted!',
      message: `The finder has accepted the reward of ₹${match.rewardAmount}. Please complete payment to proceed.`,
      relatedId: match._id as any,
      relatedModel: 'Match',
    });

    // Emit specific reward:accepted event for real-time UI update
    emitToUser(match.lostUserId.toString(), 'reward:accepted', {
      matchId: match._id,
      rewardAmount: match.rewardAmount,
      paymentStatus: 'PENDING',
    });
    emitToUser(match.foundUserId.toString(), 'reward:accepted', {
      matchId: match._id,
      rewardAmount: match.rewardAmount,
      paymentStatus: 'PENDING',
    });
    // Legacy backward-compatible event
    emitToUser(match.lostUserId.toString(), 'reward:updated', { matchId: match._id, status: 'Accepted' });
    emitToUser(match.lostUserId.toString(), 'notification:new', notif);
    // Trigger match re-fetch on both sides
    emitToUser(match.foundUserId.toString(), 'match:updated', { matchId: match._id.toString() });
    emitToUser(match.lostUserId.toString(), 'match:updated', { matchId: match._id.toString() });

    res.json({ message: 'Reward accepted. Payment is now pending.', rewardStatus: 'Accepted', paymentStatus: 'PENDING' });
  } catch (error) {
    next(error);
  }
});

// POST /api/rewards/match/:matchId/decline - Finder declines the reward
router.post('/match/:matchId/decline', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const match = await MatchModel.findById(req.params.matchId);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    
    // Only finder can decline
    if (match.foundUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Only the finder can decline the reward' });
      return;
    }

    match.rewardStatus = 'Rejected';
    await match.save();

    let reward = await RewardModel.findOne({ matchId: match._id });
    if (reward) {
      reward.status = 'Rejected';
      await reward.save();
    }

    // Notify Owner
    const notif = await NotificationModel.create({
      userId: match.lostUserId,
      type: 'Reward',
      title: '❌ Reward Declined',
      message: `The finder declined the reward of ₹${match.rewardAmount}. You can edit and resend a new offer.`,
      relatedId: match._id as any,
      relatedModel: 'Match',
    });

    // Emit specific reward:declined event
    emitToUser(match.lostUserId.toString(), 'reward:declined', {
      matchId: match._id,
      rewardAmount: match.rewardAmount,
    });
    emitToUser(match.foundUserId.toString(), 'reward:declined', {
      matchId: match._id,
      rewardAmount: match.rewardAmount,
    });
    // Legacy backward-compatible event
    emitToUser(match.lostUserId.toString(), 'reward:updated', { matchId: match._id, status: 'Rejected' });
    emitToUser(match.lostUserId.toString(), 'notification:new', notif);
    // Trigger match re-fetch on both sides
    emitToUser(match.foundUserId.toString(), 'match:updated', { matchId: match._id.toString() });
    emitToUser(match.lostUserId.toString(), 'match:updated', { matchId: match._id.toString() });

    res.json({ message: 'Reward declined. The owner can now send an updated offer.', rewardStatus: 'Rejected' });
  } catch (error) {
    next(error);
  }
});

// GET /api/rewards/leaderboard
router.get('/leaderboard', requireAuth, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await UserModel.find({ role: 'user' })
      .sort({ points: -1, createdAt: -1 })
      .limit(20)
      .select('name avatar collegeName points badges');
    res.json({ leaderboard: users });
  } catch (error) {
    next(error);
  }
});

// GET /api/rewards/:matchId - Get reward details
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

export default router;
