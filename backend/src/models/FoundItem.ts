import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IFoundItem extends Document {
  itemName: string;
  category: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const foundItemSchema = new Schema<IFoundItem>(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true },
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
    rewardAmount: { type: Number },
    status: {
      type: String,
      enum: ['Waiting', 'Matched', 'Returned'],
      default: 'Waiting',
    },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

foundItemSchema.index({ itemName: 'text', description: 'text' });

export default mongoose.models.FoundItem || mongoose.model<IFoundItem>('FoundItem', foundItemSchema);
