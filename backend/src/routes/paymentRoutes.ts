import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { getRazorpayInstance } from '../config/razorpay';
import PaymentModel, { type IPayment } from '../models/Payment';
import RewardModel from '../models/Reward';
import MatchModel, { type IMatch } from '../models/Match';
import LostItemModel from '../models/LostItem';
import NotificationModel from '../models/Notification';
import ChatModel from '../models/Chat';
import UserModel from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { emitToUser } from '../services/socketHub';
import { sendSms } from '../services/smsService';
import { sendRewardReceivedEmail } from '../services/emailService';

const router = Router();

type PaymentDoc = IPayment;
type MatchDoc = IMatch;

const getIdString = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const withId = value as { _id?: { toString(): string }; toString?: () => string };
    if (withId._id?.toString) return withId._id.toString();
    if (withId.toString) return withId.toString();
  }
  return undefined;
};

const ensurePaymentChat = async (match: MatchDoc) => {
  let chat = await ChatModel.findOne({ matchId: match._id });
  if (!chat) {
    chat = await ChatModel.create({
      kind: 'match',
      matchId: match._id,
      participants: [match.lostUserId, match.foundUserId],
      status: 'active',
      isClosed: false,
    });
  }
  return chat;
};

const notifyPaymentFailure = async (payment: PaymentDoc | null) => {
  if (!payment?.matchId) return;

  const failedMatch = await MatchModel.findById(payment.matchId);
  if (!failedMatch) return;

  emitToUser(failedMatch.lostUserId.toString(), 'payment:failed', { matchId: failedMatch._id.toString() });
  emitToUser(failedMatch.foundUserId.toString(), 'payment:failed', { matchId: failedMatch._id.toString() });
};

const finalizePaymentSuccess = async ({
  payment,
  match,
  razorpayPaymentId,
}: {
  payment: PaymentDoc;
  match: MatchDoc;
  razorpayPaymentId: string;
}) => {
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = payment.razorpaySignature || '';
  payment.paymentStatus = 'SUCCESS';
  payment.status = 'Completed';
  payment.paidAt = new Date();
  payment.receiptUrl = `/payments/receipt/${payment._id}`;
  await payment.save();

  match.matchStatus = 'PAYMENT_COMPLETED';
  match.contactShared = true;
  match.rewardStatus = 'Paid';
  match.rewardPaid = true;
  match.paymentStatus = 'PAID';
  match.paymentId = payment._id as any;
  match.transactionId = razorpayPaymentId;
  match.paidAt = new Date();
  await match.save();

  const reward = await RewardModel.findOne({ matchId: match._id });
  if (reward) {
    reward.status = 'Paid';
    reward.finalAmount = payment.amount;
    await reward.save();
  }

  await ensurePaymentChat(match);

  const notifications = await NotificationModel.create([
    {
      userId: match.lostUserId,
      type: 'Payment',
      title: '💳 Payment Successful!',
      message: `Reward payment of ₹${payment.amount} completed. The item can now be returned.`,
      relatedId: match._id,
      relatedModel: 'Match',
    },
    {
      userId: match.foundUserId,
      type: 'Payment',
      title: '🎉 Reward Received!',
      message: `Reward of ₹${payment.amount} received. Please hand over the item to the owner.`,
      relatedId: match._id,
      relatedModel: 'Match',
    },
  ]);

  const ownerUserId = match.lostUserId.toString();
  const finderUserId = match.foundUserId.toString();

  emitToUser(ownerUserId, 'payment:success', {
    matchId: match._id.toString(),
    amount: payment.amount,
    paymentId: payment._id?.toString(),
  });
  emitToUser(finderUserId, 'payment:success', {
    matchId: match._id.toString(),
    amount: payment.amount,
    paymentId: payment._id?.toString(),
  });
  emitToUser(finderUserId, 'match:updated', { matchId: match._id.toString() });
  emitToUser(ownerUserId, 'match:updated', { matchId: match._id.toString() });

  if (notifications[0]) emitToUser(ownerUserId, 'notification:new', notifications[0]);
  if (notifications[1]) emitToUser(finderUserId, 'notification:new', notifications[1]);

  const [lostUser, foundUser, lostItem] = await Promise.all([
    UserModel.findById(match.lostUserId),
    UserModel.findById(match.foundUserId),
    LostItemModel.findById(match.lostItemId),
  ]);

  if (lostUser?.phone) {
    sendSms({ to: lostUser.phone, message: 'Payment completed successfully for your lost item.' }).catch(() => {});
  }
  if (foundUser?.phone) {
    sendSms({ to: foundUser.phone, message: 'Reward payment received! You can now return the item.' }).catch(() => {});
  }
  if (foundUser?.email) {
    const itemName = lostItem?.itemName || 'your found item';
    sendRewardReceivedEmail(foundUser.email, foundUser.name, payment.amount || 0, itemName).catch((error: unknown) => {
      console.warn('[PaymentRoutes] sendRewardReceivedEmail failed:', error);
    });
  }
};

router.post('/create-order', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matchId } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    if (!matchId) {
      res.status(400).json({ success: false, message: 'matchId is required' });
      return;
    }

    const match = await MatchModel.findById(matchId);
    if (!match) {
      res.status(404).json({ success: false, message: 'Match not found' });
      return;
    }

    if (match.lostUserId.toString() !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Only the item owner can make the reward payment' });
      return;
    }

    if (match.rewardStatus !== 'Accepted') {
      res.status(400).json({
        success: false,
        message: 'Reward must be accepted by the finder before initiating payment.',
      });
      return;
    }

    const allowedStatuses: MatchDoc['matchStatus'][] = ['CONFIRMED', 'Confirmed', 'Verified', 'PENDING_PAYMENT'];
    if (!allowedStatuses.includes(match.matchStatus)) {
      res.status(400).json({
        success: false,
        message: 'Payment cannot be created until the match is confirmed/verified.',
      });
      return;
    }

    const finalAmount = Number(match.rewardAmount);
    if (!finalAmount || Number.isNaN(finalAmount) || finalAmount <= 0) {
      res.status(400).json({ success: false, message: 'No valid reward amount is set for this match.' });
      return;
    }

    const existingPayment = await PaymentModel.findOne({
      matchId: match._id,
      paymentStatus: 'PENDING',
      razorpayOrderId: { $exists: true, $ne: null },
    });
    if (existingPayment?.razorpayOrderId) {
      const rKeyId = process.env.RAZORPAY_KEY_ID;
      if (!rKeyId) {
        res.status(500).json({ success: false, message: 'Razorpay keys are not configured on server' });
        return;
      }

      res.json({
        success: true,
        orderId: existingPayment.razorpayOrderId,
        amount: Math.round(finalAmount * 100),
        currency: 'INR',
        keyId: rKeyId,
        paymentId: existingPayment._id,
      });
      return;
    }

    const rKeyId = process.env.RAZORPAY_KEY_ID;
    const rKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!rKeyId || !rKeySecret) {
      res.status(500).json({ success: false, message: 'Razorpay keys are not configured on server' });
      return;
    }

    const razorpay = getRazorpayInstance();
    const orderReceipt = `rcpt_${match._id.toString().slice(-8)}_${Math.floor(Date.now() / 1000)}`;
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: orderReceipt,
      notes: {
        matchId: match._id.toString(),
        userId: req.user.userId,
        finderId: match.foundUserId.toString(),
      },
    });

    const payment = await PaymentModel.create({
      user: match.lostUserId,
      userId: match.lostUserId,
      finderId: match.foundUserId,
      matchId: match._id,
      item: match.lostItemId,
      itemModel: 'LostItem',
      amount: finalAmount,
      razorpayOrderId: order.id,
      paymentStatus: 'PENDING',
      lostUserId: match.lostUserId,
      foundUserId: match.foundUserId,
      currency: 'INR',
    });

    const ownerUserId = match.lostUserId.toString();
    const finderUserId = match.foundUserId.toString();
    emitToUser(ownerUserId, 'payment:initiated', { matchId: match._id.toString(), amount: finalAmount });
    emitToUser(finderUserId, 'payment:initiated', { matchId: match._id.toString(), amount: finalAmount });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: rKeyId,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create Razorpay order',
    });
  }
});

const handleVerifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, matchId, paymentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification fields (order_id, payment_id, signature)',
      });
      return;
    }

    let payment: PaymentDoc | null = await PaymentModel.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment && paymentId) {
      payment = await PaymentModel.findById(paymentId);
    }

    if (payment && (payment.paymentStatus === 'SUCCESS' || payment.status === 'Completed')) {
      const existingMatch = payment.matchId ? await MatchModel.findById(payment.matchId) : null;
      res.json({
        success: true,
        message: 'Payment already completed successfully.',
        payment,
        match: existingMatch,
      });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.status(500).json({ success: false, message: 'Razorpay secret key is not configured on server.' });
      return;
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      if (payment) {
        payment.paymentStatus = 'FAILED';
        payment.status = 'Failed';
        await payment.save();
      }
      await notifyPaymentFailure(payment);
      res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
      return;
    }

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    const targetMatchId = matchId || payment.matchId;
    if (!targetMatchId) {
      res.status(400).json({ success: false, message: 'Match reference is missing for this payment.' });
      return;
    }

    const match = await MatchModel.findById(targetMatchId);
    if (!match) {
      res.status(404).json({ success: false, message: 'Match not found for payment verification.' });
      return;
    }

    await finalizePaymentSuccess({ payment, match, razorpayPaymentId: razorpay_payment_id });

    res.json({
      success: true,
      message: 'Payment verified and completed successfully.',
      payment,
      match,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error while verifying payment',
    });
  }
};

router.post('/verify-payment', requireAuth, handleVerifyPayment);
router.post('/verify', requireAuth, handleVerifyPayment);

router.get('/:id/receipt', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payment = await PaymentModel.findById(req.params.id)
      .populate('user', 'name email')
      .populate('finderId', 'name email');

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    const userId = req.user!.userId;
    const ownerId = getIdString(payment.user) || getIdString(payment.userId) || getIdString(payment.lostUserId);
    const finderId = getIdString(payment.finderId) || getIdString(payment.foundUserId);
    const isOwner = ownerId === userId;
    const isFinder = finderId === userId;

    if (!isOwner && !isFinder) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (payment.paymentStatus !== 'SUCCESS' && payment.status !== 'Completed') {
      res.status(400).json({ success: false, message: 'Receipt is only available for successful payments' });
      return;
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=campusconnect_receipt_${payment._id}.pdf`);
    doc.pipe(res);

    doc
      .fontSize(26)
      .fillColor('#1E3A8A')
      .text('CampusConnect', { align: 'center' })
      .fontSize(11)
      .fillColor('#64748B')
      .text('Lost & Found - Reward Payment Receipt', { align: 'center' })
      .moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke().moveDown(1.5);

    doc.fontSize(14).fillColor('#0F172A').text('Payment Details').moveDown(0.5);
    const details = [
      ['Receipt ID', payment._id.toString()],
      ['Date & Time', payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')],
      ['Transaction ID', payment.razorpayPaymentId || 'N/A'],
      ['Order ID', payment.razorpayOrderId || 'N/A'],
      ['Status', 'PAYMENT SUCCESSFUL'],
      ['Currency', 'INR'],
    ] as const;

    doc.fontSize(11).fillColor('#334155');
    for (const [label, value] of details) {
      doc.text(`${label}:  ${value}`, { continued: false });
    }

    doc.moveDown(1);
    doc.fontSize(22).fillColor('#10B981').text(`Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}`, { align: 'right' }).moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke().moveDown(1);

    const ownerName = getIdString(payment.user) ? (payment.user as { name?: string })?.name || 'Item Owner' : 'Item Owner';
    const finderName = getIdString(payment.finderId) ? (payment.finderId as { name?: string })?.name || 'Item Finder' : 'Item Finder';

    doc.fontSize(12).fillColor('#0F172A').text('Paid By (Item Owner):').fillColor('#334155').text(ownerName).moveDown(0.5);
    doc.fillColor('#0F172A').text('Paid To (Reward Finder):').fillColor('#334155').text(finderName).moveDown(2);

    doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke().moveDown(1);
    doc
      .fontSize(10)
      .fillColor('#94A3B8')
      .text('Thank you for using CampusConnect to securely return lost items!', { align: 'center' })
      .text('For support, visit campusconnect.com or contact support@campusconnect.com', { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payment = await PaymentModel.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('finderId', 'name email avatar')
      .populate('matchId')
      .populate('item');

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
});

router.post('/confirm', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentId } = req.body;
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    const paymentUserId = getIdString(payment.user) || getIdString(payment.userId) || getIdString(payment.lostUserId);
    if (paymentUserId !== req.user!.userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    payment.paymentStatus = 'SUCCESS';
    payment.status = 'Completed';
    payment.paidAt = new Date();
    payment.receiptUrl = `/payments/receipt/${payment._id.toString()}`;
    await payment.save();

    const match = await MatchModel.findById(payment.matchId);
    if (match) {
      match.rewardStatus = 'Paid';
      match.rewardPaid = true;
      match.matchStatus = 'PAYMENT_COMPLETED';
      match.paymentStatus = 'PAID';
      match.contactShared = true;
      match.paymentId = payment._id as any;
      match.paidAt = new Date();
      await match.save();

      const ownerUserId = match.lostUserId.toString();
      const finderUserId = match.foundUserId.toString();
      emitToUser(ownerUserId, 'payment:success', { matchId: match._id.toString() });
      emitToUser(finderUserId, 'payment:success', { matchId: match._id.toString() });
      emitToUser(finderUserId, 'match:updated', { matchId: match._id.toString() });
      emitToUser(ownerUserId, 'match:updated', { matchId: match._id.toString() });
    }

    res.json({ message: 'Payment confirmed', payment });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const payments = await PaymentModel.find({
      $or: [{ user: userId }, { userId }, { lostUserId: userId }, { finderId: userId }, { foundUserId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar')
      .populate('finderId', 'name email avatar')
      .populate('matchId')
      .populate('item');

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

export default router;
