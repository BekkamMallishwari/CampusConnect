import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  lostUserId: mongoose.Types.ObjectId;
  foundUserId: mongoose.Types.ObjectId;
  lostItemId: mongoose.Types.ObjectId;
  foundItemId: mongoose.Types.ObjectId;
  matchPercentage: number;
  lostUserAccepted: boolean;
  foundUserAccepted: boolean;
  matchStatus: 'Pending' | 'Accepted' | 'Rejected' | 'Verified';
  rewardStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating' | 'Paid';
  contactShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    lostUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    foundUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lostItemId: { type: Schema.Types.ObjectId, ref: 'LostItem', required: true },
    foundItemId: { type: Schema.Types.ObjectId, ref: 'FoundItem', required: true },
    matchPercentage: { type: Number, required: true },
    lostUserAccepted: { type: Boolean, default: false },
    foundUserAccepted: { type: Boolean, default: false },
    matchStatus: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Verified'],
      default: 'Pending',
    },
    rewardStatus: {
      type: String,
      enum: ['None', 'Pending', 'Accepted', 'Rejected', 'Negotiating', 'Paid'],
      default: 'None',
    },
    contactShared: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Match || mongoose.model<IMatch>('Match', matchSchema);
