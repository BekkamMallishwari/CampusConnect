import { Router, Response, NextFunction } from 'express';
import MatchModel from '../models/Match';
import ChatModel from '../models/Chat';
import LostItemModel from '../models/LostItem';
import FoundItemModel from '../models/FoundItem';
import NotificationModel from '../models/Notification';
import UserModel from '../models/User';
import ReviewModel from '../models/Review';
import type { IMatch } from '../models/Match';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { sendMatchConfirmedEmail } from '../services/emailService';
import { emitToUser } from '../services/socketHub';

const router = Router();

const buildItemPayload = (item: unknown, fallbackName: string) => {
  const typedItem = item as {
    itemName?: string;
    description?: string;
    images?: string[];
    imageUrls?: string[];
  } | null;

  return {
    itemName: typedItem?.itemName || fallbackName,
    description: typedItem?.description || '',
    images: typedItem?.images || typedItem?.imageUrls || [],
  };
};

async function ensureChatAndNotifyConfirmed(match: IMatch) {
  let existingChat = await ChatModel.findOne({ matchId: match._id });
  if (!existingChat) {
    existingChat = await ChatModel.create({
      kind: 'match',
      matchId: match._id,
      participants: [match.lostUserId, match.foundUserId],
      status: 'active',
      isClosed: false,
    });
  }

  match.chatId = existingChat._id;
  match.matchStatus = 'Confirmed';
  match.contactShared = true;
  await match.save();

  const existingNotif = await NotificationModel.findOne({
    relatedId: match._id,
    type: 'Match',
    title: '✅ Match Confirmed!',
  });
  if (!existingNotif) {
    await NotificationModel.create([
      {
        userId: match.lostUserId,
        type: 'Match',
        title: '✅ Match Confirmed!',
        message: 'Both parties accepted the match! Secure chat has been created.',
        relatedId: match._id,
        relatedModel: 'Match',
      },
      {
        userId: match.foundUserId,
        type: 'Match',
        title: '✅ Match Confirmed!',
        message: 'Both parties accepted the match! Secure chat has been created.',
        relatedId: match._id,
        relatedModel: 'Match',
      },
    ]);
  }

  emitToUser(match.lostUserId.toString(), 'match:accepted', {
    matchId: match._id,
    chatId: existingChat._id,
    matchStatus: 'Confirmed',
  });
  emitToUser(match.foundUserId.toString(), 'match:accepted', {
    matchId: match._id,
    chatId: existingChat._id,
    matchStatus: 'Confirmed',
  });

  Promise.all([UserModel.findById(match.lostUserId), UserModel.findById(match.foundUserId)])
    .then(async ([lostUser, foundUser]) => {
      if (!lostUser || !foundUser) return;
      const populatedMatch = (await MatchModel.findById(match._id)
        .populate('lostItemId')
        .populate('foundItemId')) as unknown as {
        lostItemId?: unknown;
        foundItemId?: unknown;
      } | null;
      const lostItem = buildItemPayload(populatedMatch?.lostItemId, 'Lost Item');
      const foundItem = buildItemPayload(populatedMatch?.foundItemId, 'Found Item');
      sendMatchConfirmedEmail({
        lostUser: { name: lostUser.name, email: lostUser.email },
        foundUser: { name: foundUser.name, email: foundUser.email },
        lostItem,
        foundItem,
        matchId: match._id.toString(),
      }).catch((error) => console.error('[Email] Match confirmed email error:', error));
    })
    .catch((error) => console.error('[Email] Failed to fetch users for email:', error));

  return existingChat;
}

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const matches = await MatchModel.find({
      $or: [{ lostUserId: userId }, { foundUserId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('lostUserId', 'name email avatar phone collegeName points badges reputation')
      .populate('foundUserId', 'name email avatar phone collegeName points badges reputation')
      .populate('lostItemId')
      .populate('foundItemId')
      .populate('chatId');
    res.json({ matches });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id)
      .populate('lostUserId', 'name email avatar phone collegeName points badges reputation')
      .populate('foundUserId', 'name email avatar phone collegeName points badges reputation')
      .populate('lostItemId')
      .populate('foundItemId')
      .populate('chatId');

    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const isParticipant = match.lostUserId._id.toString() === userId || match.foundUserId._id.toString() === userId;
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json({ match });
  } catch (error) {
    next(error);
  }
});

async function handleAccept(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const isOwner = match.lostUserId.toString() === userId;
    const isFinder = match.foundUserId.toString() === userId;

    if (!isOwner && !isFinder) {
      res.status(403).json({ message: 'Access denied. You are not a participant of this match.' });
      return;
    }

    if (match.matchStatus === 'Rejected') {
      res.status(400).json({ message: 'This match was previously rejected.' });
      return;
    }

    if (isOwner && match.ownerAccepted) {
      res.status(400).json({ message: 'You have already accepted this match.' });
      return;
    }
    if (isFinder && match.finderAccepted) {
      res.status(400).json({ message: 'You have already accepted this match.' });
      return;
    }

    if (isOwner) {
      match.ownerAccepted = true;
      match.lostUserAccepted = true;
      match.lostUserVerified = true;
    }
    if (isFinder) {
      match.finderAccepted = true;
      match.foundUserAccepted = true;
      match.foundUserVerified = true;
    }

    let chat: Awaited<ReturnType<typeof ensureChatAndNotifyConfirmed>> | null = null;
    if (match.ownerAccepted && match.finderAccepted) {
      chat = await ensureChatAndNotifyConfirmed(match);
    } else {
      match.matchStatus = isOwner ? 'Owner Accepted' : 'Finder Accepted';
      await match.save();

      const recipientId = isOwner ? match.foundUserId : match.lostUserId;
      await NotificationModel.create({
        userId: recipientId,
        type: 'Match',
        title: isOwner ? '🔔 Owner Accepted Match!' : '🔔 Finder Accepted Match!',
        message: 'Please review and accept the match to unlock private chat.',
        relatedId: match._id,
        relatedModel: 'Match',
      });

      emitToUser(recipientId.toString(), 'notification:new', {
        title: isOwner ? 'Owner Accepted Match' : 'Finder Accepted Match',
        matchId: match._id,
      });
    }

    res.json({
      message: match.ownerAccepted && match.finderAccepted ? 'Match confirmed by both users!' : 'Acceptance recorded.',
      match,
      chat,
    });
  } catch (error) {
    next(error);
  }
}

router.post('/:id/accept', requireAuth, handleAccept);
router.post('/:id/confirm', requireAuth, handleAccept);
router.post('/:id/found-confirm', requireAuth, handleAccept);

router.post('/:id/reject', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const isOwner = match.lostUserId.toString() === userId;
    const isFinder = match.foundUserId.toString() === userId;
    if (!isOwner && !isFinder) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    match.matchStatus = 'Rejected';
    match.ownerAccepted = false;
    match.finderAccepted = false;
    match.lostUserAccepted = false;
    match.foundUserAccepted = false;
    await match.save();

    const otherUserId = isOwner ? match.foundUserId : match.lostUserId;
    await NotificationModel.create({
      userId: otherUserId,
      type: 'Match',
      title: '❌ Match Rejected',
      message: isOwner ? 'The owner has rejected this match.' : 'The finder has rejected this match.',
      relatedId: match._id,
      relatedModel: 'Match',
    });

    emitToUser(otherUserId.toString(), 'match:rejected', { matchId: match._id });

    res.json({ message: 'Match rejected', match });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/verify-ownership', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    if (match.lostUserId.toString() !== userId) {
      res.status(403).json({ message: 'Only the item owner can submit ownership verification details.' });
      return;
    }

    if (match.verificationStatus === 'PENDING' || match.verificationStatus === 'VERIFIED') {
      res.status(400).json({ message: 'Ownership verification details have already been submitted.' });
      return;
    }

    const { wallpaper, phoneCase, uniqueStickers, serialNumber, customDetails, answers } = req.body;

    match.verificationQuestions = {
      wallpaper: wallpaper || '',
      phoneCase: phoneCase || '',
      uniqueStickers: uniqueStickers || '',
      serialNumber: serialNumber || '',
      customDetails: customDetails || '',
      submittedAt: new Date(),
    };

    match.verificationAnswers = (answers && typeof answers === 'object' ? answers : {}) as Record<string, string>;
    match.verificationStatus = 'PENDING';

    await match.save();

    await NotificationModel.create({
      userId: match.foundUserId,
      type: 'Match',
      title: '🔍 Ownership Submitted',
      message: 'The item owner has submitted ownership verification details. Please review and confirm.',
      relatedId: match._id,
      relatedModel: 'Match',
    });

    emitToUser(match.foundUserId.toString(), 'notification:new', {
      title: 'Ownership Submitted',
      matchId: match._id,
    });
    emitToUser(match.foundUserId.toString(), 'match:updated', { matchId: match._id });

    res.json({ message: 'Verification details submitted successfully', match });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/finder-verify', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    if (match.foundUserId.toString() !== userId) {
      res.status(403).json({ message: 'Only the finder can verify ownership.' });
      return;
    }

    const { verified, notes } = req.body;
    match.verificationResponse = {
      verifiedByFinder: Boolean(verified),
      notes: notes || '',
      respondedAt: new Date(),
    };

    if (verified) {
      match.verified = true;
      match.verificationStatus = 'VERIFIED';
      match.verifiedBy = userId as any;
      match.verifiedAt = new Date();
      match.matchStatus = 'Verified';
    } else {
      match.verificationStatus = 'VERIFICATION_FAILED';
      match.matchStatus = 'PossibleMatch';
    }

    await match.save();

    const title = verified ? '✨ Ownership Approved' : '⚠️ Ownership Rejected';
    const message = verified
      ? 'The finder verified your ownership details! You can now mark the item as returned.'
      : 'The finder reviewed your verification answers but rejected the ownership claim.';

    await NotificationModel.create({
      userId: match.lostUserId,
      type: 'Match',
      title,
      message,
      relatedId: match._id,
      relatedModel: 'Match',
    });

    emitToUser(match.lostUserId.toString(), 'notification:new', {
      title,
      matchId: match._id,
    });
    emitToUser(match.lostUserId.toString(), 'match:updated', { matchId: match._id });

    res.json({ message: verified ? 'Item ownership verified!' : 'Verification response saved.', match });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/schedule-meeting', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const isOwner = match.lostUserId.toString() === userId;
    const isFinder = match.foundUserId.toString() === userId;
    if (!isOwner && !isFinder) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { meetingLocation, meetingTime, meetingCoordinates } = req.body;
    if (!meetingLocation || !meetingTime) {
      res.status(400).json({ message: 'Meeting location and time are required.' });
      return;
    }

    match.meetingLocation = meetingLocation;
    if (meetingCoordinates && typeof meetingCoordinates.lat === 'number' && typeof meetingCoordinates.lng === 'number') {
      match.meetingCoordinates = {
        lat: meetingCoordinates.lat,
        lng: meetingCoordinates.lng,
      };
    }
    match.meetingTime = new Date(meetingTime);
    match.meetingStatus = 'PENDING';
    match.meetingScheduledBy = userId as any;
    await match.save();

    const otherUserId = isOwner ? match.foundUserId : match.lostUserId;
    await NotificationModel.create({
      userId: otherUserId,
      type: 'Match',
      title: '📅 Meeting Request',
      message: `A meeting has been proposed at ${meetingLocation} on ${new Date(meetingTime).toLocaleString()}. Please review and confirm.`,
      relatedId: match._id,
      relatedModel: 'Match',
    });

    emitToUser(otherUserId.toString(), 'notification:new', {
      title: 'Meeting Request',
      matchId: match._id,
    });
    emitToUser(otherUserId.toString(), 'match:updated', { matchId: match._id });
    emitToUser(userId, 'match:updated', { matchId: match._id });

    res.json({ message: 'Meeting scheduled successfully', match });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/respond-meeting', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { action } = req.body;
    if (!action || !['accept', 'decline'].includes(action)) {
      res.status(400).json({ message: 'Valid action (accept or decline) is required.' });
      return;
    }

    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const isOwner = match.lostUserId.toString() === userId;
    const isFinder = match.foundUserId.toString() === userId;
    if (!isOwner && !isFinder) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    if (action === 'accept') {
      match.meetingStatus = 'CONFIRMED';
      await match.save();

      const formatTime = match.meetingTime ? new Date(match.meetingTime).toLocaleString() : '';
      await NotificationModel.create([
        {
          userId: match.lostUserId,
          type: 'Match',
          title: '✅ Meeting Confirmed!',
          message: `Meeting confirmed at ${match.meetingLocation} on ${formatTime}.`,
          relatedId: match._id,
          relatedModel: 'Match',
        },
        {
          userId: match.foundUserId,
          type: 'Match',
          title: '✅ Meeting Confirmed!',
          message: `Meeting confirmed at ${match.meetingLocation} on ${formatTime}.`,
          relatedId: match._id,
          relatedModel: 'Match',
        },
      ]);

      emitToUser(match.lostUserId.toString(), 'match:updated', { matchId: match._id });
      emitToUser(match.foundUserId.toString(), 'match:updated', { matchId: match._id });

      res.json({ message: 'Meeting confirmed successfully!', match });
    } else {
      match.meetingStatus = 'DECLINED';
      await match.save();

      const schedulerId = match.meetingScheduledBy
        ? match.meetingScheduledBy.toString()
        : isOwner
        ? match.foundUserId.toString()
        : match.lostUserId.toString();

      await NotificationModel.create({
        userId: schedulerId,
        type: 'Match',
        title: '❌ Meeting Declined',
        message: 'The proposed meeting time/location was declined. Please propose a new meeting schedule.',
        relatedId: match._id,
        relatedModel: 'Match',
      });

      emitToUser(schedulerId, 'match:updated', { matchId: match._id });

      res.json({ message: 'Meeting declined.', match });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/:id/mark-returned', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const match = await MatchModel.findById(req.params.id)
      .populate('lostItemId')
      .populate('foundItemId');
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const isOwner = match.lostUserId.toString() === userId;
    const isFinder = match.foundUserId.toString() === userId;
    if (!isOwner && !isFinder) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    if (match.meetingStatus !== 'CONFIRMED') {
      res.status(400).json({ message: 'Meeting must be CONFIRMED before marking item returned.' });
      return;
    }

    if (match.verificationStatus !== 'VERIFIED') {
      res.status(400).json({ message: 'Ownership must be VERIFIED before marking the item as returned.' });
      return;
    }

    const lostItemReward = (match.lostItemId as any)?.rewardAmount;
    const rewardAmt = Number(match.rewardAmount || lostItemReward || 0);
    const isPaid = match.paymentStatus === 'PAID' || match.rewardPaid === true || match.rewardStatus === 'Paid';
    if (rewardAmt > 0 && !isPaid) {
      res.status(400).json({ message: 'Reward payment must be completed before marking item as returned.' });
      return;
    }

    if (match.completed || match.itemReturned) {
      res.status(400).json({ message: 'Item has already been marked as returned.' });
      return;
    }

    match.completed = true;
    match.completedAt = new Date();
    match.matchStatus = 'Completed';
    match.itemReturned = true;
    await match.save();

    await LostItemModel.findByIdAndUpdate(match.lostItemId, { status: 'Returned', returnedAt: new Date() });
    await FoundItemModel.findByIdAndUpdate(match.foundItemId, { status: 'Returned' });

    if (match.chatId) {
      await ChatModel.findByIdAndUpdate(match.chatId, {
        status: 'archived',
        isClosed: true,
        closedAt: new Date(),
      });
    }

    const foundUser = await UserModel.findById(match.foundUserId);
    if (foundUser) {
      foundUser.points = (foundUser.points || 0) + 50;
      if (!foundUser.badges.includes('Good Citizen Badge')) {
        foundUser.badges.push('Good Citizen Badge');
      }
      await foundUser.save();
    }

    const lostUser = await UserModel.findById(match.lostUserId);
    if (lostUser) {
      if (!lostUser.badges.includes('Successful Recovery Badge')) {
        lostUser.badges.push('Successful Recovery Badge');
      }
      await lostUser.save();
    }

    await NotificationModel.create([
      {
        userId: match.lostUserId,
        type: 'Match',
        title: '🎉 Item Returned Successfully',
        message: 'The item has been marked returned. You earned "Successful Recovery Badge"! Please leave a rating.',
        relatedId: match._id,
        relatedModel: 'Match',
      },
      {
        userId: match.foundUserId,
        type: 'Match',
        title: '🎉 Item Returned Successfully',
        message: 'Item marked returned! You earned +50 Campus Points & "Good Citizen Badge". Please leave a rating.',
        relatedId: match._id,
        relatedModel: 'Match',
      },
    ]);

    emitToUser(match.lostUserId.toString(), 'item:returned', {
      matchId: match._id.toString(),
      completedAt: match.completedAt,
    });
    emitToUser(match.foundUserId.toString(), 'item:returned', {
      matchId: match._id.toString(),
      completedAt: match.completedAt,
    });
    emitToUser(match.lostUserId.toString(), 'match:completed', { matchId: match._id });
    emitToUser(match.foundUserId.toString(), 'match:completed', { matchId: match._id });

    res.json({ message: 'Item marked returned successfully.', match });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/rate', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
      return;
    }

    const match = await MatchModel.findById(req.params.id);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const isOwner = match.lostUserId.toString() === userId;
    const isFinder = match.foundUserId.toString() === userId;
    if (!isOwner && !isFinder) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const revieweeId = isOwner ? match.foundUserId : match.lostUserId;
    const role = isOwner ? 'owner' : 'finder';

    if (isOwner) {
      match.ownerRating = { rating, feedback: feedback || '', createdAt: new Date() };
    } else {
      match.finderRating = { rating, feedback: feedback || '', createdAt: new Date() };
    }
    await match.save();

    await ReviewModel.findOneAndUpdate(
      { matchId: match._id, reviewerId: userId },
      {
        matchId: match._id,
        reviewerId: userId,
        revieweeId,
        rating,
        feedback: feedback || '',
        role,
      },
      { upsert: true, new: true },
    );

    await UserModel.findByIdAndUpdate(revieweeId, {
      $inc: { reputation: rating * 5, points: rating * 2 },
    });

    res.json({ message: 'Rating submitted successfully!', match });
  } catch (error) {
    next(error);
  }
});

export default router;
