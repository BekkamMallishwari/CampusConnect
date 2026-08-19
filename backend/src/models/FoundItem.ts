import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IFoundItem extends Document {
  itemName: string;
  category: string;
  imageUrl?: string;
  imagePublicId?: string;
  imagePublicIds?: string[];
  images: string[];
  foundDate: Date;
  foundTime?: string;
  foundLocation: string;
  description: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  rewardExpected: boolean;
  rewardAmount?: number;
  status: 'Waiting' | 'Matched' | 'Returned';
  postedBy: mongoose.Types.ObjectId | IUser;
  isActive: boolean;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const foundItemSchema = new Schema<IFoundItem>(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    imagePublicIds: [{ type: String }],
    images: [{ type: String }],
    foundDate: { type: Date, required: true },
    foundTime: { type: String },
    foundLocation: { type: String, required: true },
    description: { type: String, required: true },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      required: true,
    },
    rewardExpected: { type: Boolean, default: false },
    rewardAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Waiting', 'Matched', 'Returned'],
      default: 'Waiting',
    },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    returnedAt: { type: Date },
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

foundItemSchema.index({ itemName: 'text', description: 'text' });

export default mongoose.models.FoundItem || mongoose.model<IFoundItem>('FoundItem', foundItemSchema);
