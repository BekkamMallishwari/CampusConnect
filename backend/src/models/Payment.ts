import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId | IUser; // Lost owner / payer
  userId?: mongoose.Types.ObjectId | IUser; // Alias
  finderId?: mongoose.Types.ObjectId | IUser;
  item?: mongoose.Types.ObjectId; // Lost or Found item ref
  itemModel?: string;
  matchId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'Pending' | 'Completed' | 'Failed';
  status?: string;
  rewardId?: mongoose.Types.ObjectId;
  lostUserId?: mongoose.Types.ObjectId | IUser;
  foundUserId?: mongoose.Types.ObjectId | IUser;
  receiptUrl?: string;
  paidAt?: Date;
  payer?: mongoose.Types.ObjectId | IUser;
  receiver?: mongoose.Types.ObjectId | IUser;
  transactionReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    finderId: { type: Schema.Types.ObjectId, ref: 'User' },
    item: { type: Schema.Types.ObjectId, refPath: 'itemModel' },
    itemModel: { type: String, enum: ['FoundItem', 'LostItem', 'Match'], default: 'FoundItem' },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR', required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'Pending', 'Completed', 'Failed'],
      default: 'PENDING',
    },
    rewardId: { type: Schema.Types.ObjectId, ref: 'Reward' },
    lostUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    foundUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    receiptUrl: { type: String },
    paidAt: { type: Date },
    payer: { type: Schema.Types.ObjectId, ref: 'User' },
    receiver: { type: Schema.Types.ObjectId, ref: 'User' },
    transactionReference: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.userId = ret.user || ret.userId || ret.lostUserId;
        ret.status = ret.paymentStatus;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: any) {
        ret.userId = ret.user || ret.userId || ret.lostUserId;
        ret.status = ret.paymentStatus;
        return ret;
      },
    },
  },
);

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);

