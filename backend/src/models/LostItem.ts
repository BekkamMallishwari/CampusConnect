import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface ILostItem extends Document {
  itemName: string;
  category: string;
  description: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const lostItemSchema = new Schema<ILostItem>(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
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
  },
  { timestamps: true },
);

lostItemSchema.index({ itemName: 'text', description: 'text', brand: 'text', color: 'text' });

export default mongoose.models.LostItem || mongoose.model<ILostItem>('LostItem', lostItemSchema);
