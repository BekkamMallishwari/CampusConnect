import mongoose, { Document, Schema } from 'mongoose';

interface RewardHistory {
  proposedBy: mongoose.Types.ObjectId;
  amount: number;
  action: 'Proposed' | 'Negotiated';
  createdAt: Date;
}

export interface IReward extends Document {
  matchId: mongoose.Types.ObjectId;
  lostUserId: mongoose.Types.ObjectId;
  foundUserId: mongoose.Types.ObjectId;
  requestedAmount: number;
  finalAmount?: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating' | 'Paid';
  history: RewardHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema<IReward>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    lostUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    foundUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedAmount: { type: Number, required: true },
    finalAmount: { type: Number },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Negotiating', 'Paid'],
      default: 'Pending',
    },
    history: [
      {
        proposedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        amount: { type: Number },
        action: { type: String, enum: ['Proposed', 'Negotiated'] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Reward || mongoose.model<IReward>('Reward', rewardSchema);
