import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import PaymentModel from '../models/Payment';
import RewardModel from '../models/Reward';
import MatchModel from '../models/Match';
import LostItemModel from '../models/LostItem';
import FoundItemModel from '../models/FoundItem';
import NotificationModel from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const getStripe = (): Stripe | null => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
};

// POST /api/payments/create-session
router.post('/create-session', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rewardId } = req.body;
    const reward = await RewardModel.findById(rewardId);
    if (!reward || reward.status !== 'Accepted') {
      res.status(400).json({ message: 'Reward must be accepted before payment' });
      return;
    }
    if (reward.lostUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Only the item owner can initiate payment' });
      return;
    }
    const stripe = getStripe();
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];

    // Create payment record
    const payment = await PaymentModel.create({
      matchId: reward.matchId,
      rewardId: reward._id,
      lostUserId: reward.lostUserId,
      foundUserId: reward.foundUserId,
      amount: reward.requestedAmount,
      currency: 'usd',
    });

    if (!stripe) {
      // Simulated payment flow for dev environments without Stripe key
      const simulatedReceiptUrl = `${clientUrl}/payments/receipt/${(payment._id as { toString(): string }).toString()}`;
      res.json({
        mode: 'simulated',
        paymentId: (payment._id as { toString(): string }).toString(),
        simulatedUrl: `${clientUrl}/payments/confirm?paymentId=${(payment._id as { toString(): string }).toString()}&simulated=true`,
        message: 'Stripe not configured. Using simulated payment flow.',
      });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(reward.requestedAmount * 100),
            product_data: {
              name: 'Lost & Found Reward Payment',
              description: 'CampusConnect - Reward for returning lost item',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}&paymentId=${(payment._id as { toString(): string }).toString()}`,
      cancel_url: `${clientUrl}/payments/cancel?paymentId=${(payment._id as { toString(): string }).toString()}`,
      metadata: { paymentId: (payment._id as { toString(): string }).toString() },
    });

    payment.stripeSessionId = session.id;
    await payment.save();

    res.json({ sessionId: session.id, sessionUrl: session.url, paymentId: (payment._id as { toString(): string }).toString() });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/confirm — simulated or real Stripe success
router.post('/confirm', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentId, sessionId } = req.body;
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    if (payment.lostUserId.toString() !== req.user!.userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const stripe = getStripe();
    if (stripe && sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        res.status(400).json({ message: 'Payment not completed' });
        return;
      }
      payment.stripePaymentIntentId = session.payment_intent as string;
    }

    payment.status = 'Completed';
    payment.receiptUrl = `/payments/receipt/${(payment._id as { toString(): string }).toString()}`;
    await payment.save();

    // Update reward and match status
    const reward = await RewardModel.findById(payment.rewardId);
    if (reward) { reward.status = 'Paid'; await reward.save(); }
    const match = await MatchModel.findById(payment.matchId);
    if (match) {
      match.rewardStatus = 'Paid';
      match.matchStatus = 'Verified';
      match.contactShared = true;
      await match.save();
    }
    // Update item statuses
    if (match) {
      const lostItem = await LostItemModel.findById(match.lostItemId);
      const foundItem = await FoundItemModel.findById(match.foundItemId);
      if (lostItem) { lostItem.status = 'Returned'; await lostItem.save(); }
      if (foundItem) { foundItem.status = 'Returned'; await foundItem.save(); }
    }

    // Notify both users
    if (match) {
      await NotificationModel.create([
        {
          userId: match.lostUserId,
          type: 'Payment',
          title: 'Payment successful!',
          message: 'Your reward payment was completed. Contact details are now shared.',
          relatedId: payment._id as any,
          relatedModel: 'Payment',
        },
        {
          userId: match.foundUserId,
          type: 'Payment',
          title: 'Reward payment received!',
          message: 'The owner has paid the reward. Contact details are now shared.',
          relatedId: payment._id as any,
          relatedModel: 'Payment',
        },
      ]);
    }

    res.json({ message: 'Payment confirmed', payment });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await PaymentModel.find({
      $or: [{ lostUserId: req.user!.userId }, { foundUserId: req.user!.userId }],
    })
      .sort({ createdAt: -1 })
      .populate('matchId')
      .populate('lostUserId', 'name email')
      .populate('foundUserId', 'name email');
    res.json({ payments });
  } catch (error) {
    next(error);
  }
});

export default router;
