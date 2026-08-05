import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  kind: 'match' | 'conversation';
  itemType?: 'lost' | 'found';
  matchId: mongoose.Types.ObjectId;
  itemId?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  requesterId?: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  status: 'active' | 'archived';
  isClosed: boolean;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    kind: {
      type: String,
      enum: ['match', 'conversation'],
      default: 'match',
    },
    itemType: { type: String, enum: ['lost', 'found'] },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', unique: true, sparse: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'LostItem', index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date },
  },
  { timestamps: true },
);

chatSchema.index(
  { itemId: 1, ownerId: 1, requesterId: 1 },
  { unique: true, sparse: true },
);

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
