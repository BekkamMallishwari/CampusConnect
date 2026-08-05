import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  matchId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  rating: number;
  feedback: string;
  role: 'owner' | 'finder';
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['owner', 'finder'], required: true },
  },
  { timestamps: true },
);

reviewSchema.index({ matchId: 1, reviewerId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
