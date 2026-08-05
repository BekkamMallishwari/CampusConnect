import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface ILostItem extends Document {
  itemName: string;
  category: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  imagePublicIds?: string[];
  images: string[];
  lostDate: Date;
  lostTime?: string;
  lostLocation: string;
  color?: string;
  brand?: string;
  additionalNotes?: string;
  contactNumber: string;
  status: 'Pending' | 'Matched' | 'Returned';
  postedBy: mongoose.Types.ObjectId | IUser;
  isActive: boolean;
  isClaimed: boolean;
  claimedBy?: mongoose.Types.ObjectId | IUser;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  rewardAmount: number;
  rewardStatus: 'Pending' | 'Negotiating' | 'Accepted' | 'Declined';
  rewardAccepted: boolean;
  rewardAcceptedAt?: Date;
  rewardUpdatedAt?: Date;
  rewardHistory: Array<{
    oldAmount: number;
    newAmount: number;
    updatedBy: mongoose.Types.ObjectId | IUser;
    timestamp: Date;
    reason?: string;
  }>;
}

const lostItemSchema = new Schema<ILostItem>(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    imagePublicIds: [{ type: String }],
    images: [{ type: String }],
    lostDate: { type: Date, required: true },
    lostTime: { type: String },
    lostLocation: { type: String, required: true },
    color: { type: String },
    brand: { type: String },
    additionalNotes: { type: String },
    contactNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Matched', 'Returned'],
      default: 'Pending',
    },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    isClaimed: { type: Boolean, default: false },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    returnedAt: { type: Date },
    rewardAmount: { type: Number, required: true, min: 1 },
    rewardStatus: { 
      type: String, 
      enum: ['Pending', 'Negotiating', 'Accepted', 'Declined'],
      default: 'Pending'
    },
    rewardAccepted: { type: Boolean, default: false },
    rewardAcceptedAt: { type: Date },
    rewardUpdatedAt: { type: Date },
    rewardHistory: [{
      oldAmount: { type: Number, required: true },
      newAmount: { type: Number, required: true },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      timestamp: { type: Date, default: Date.now },
      reason: { type: String }
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.imageUrl = ret.imageUrl || (ret.images && ret.images.length > 0 ? ret.images[0] : '');
        ret.imagePublicId = ret.imagePublicId || '';
        ret.imagePublicIds = ret.imagePublicIds || [];
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: any) {
        ret.imageUrl = ret.imageUrl || (ret.images && ret.images.length > 0 ? ret.images[0] : '');
        ret.imagePublicId = ret.imagePublicId || '';
        ret.imagePublicIds = ret.imagePublicIds || [];
        return ret;
      },
    },
  },
);

lostItemSchema.index({ itemName: 'text', description: 'text', brand: 'text', color: 'text' });

export default mongoose.models.LostItem || mongoose.model<ILostItem>('LostItem', lostItemSchema);
