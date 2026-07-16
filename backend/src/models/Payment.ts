import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  matchId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  lostUserId: mongoose.Types.ObjectId;
  foundUserId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    rewardId: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
    lostUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    foundUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    receiptUrl: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
