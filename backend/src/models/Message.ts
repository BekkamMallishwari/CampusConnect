import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  itemId?: mongoose.Types.ObjectId;
  text?: string;
  imageUrl?: string;
  location?: {
    name: string;
    lat?: number;
    lng?: number;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Chat', index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'LostItem', index: true },
    text: { type: String },
    imageUrl: { type: String },
    location: {
      name: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
