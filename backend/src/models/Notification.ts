import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'Match' | 'Chat' | 'Payment' | 'Reward' | 'System' | 'Item';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['Match', 'Chat', 'Payment', 'Reward', 'System', 'Item'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: Schema.Types.ObjectId },
    relatedModel: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
