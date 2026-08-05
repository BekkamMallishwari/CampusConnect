import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId | IUser;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  author: mongoose.Types.ObjectId | IUser;
  content: string;
  category: 'General' | 'Announcement' | 'Hackathon' | 'Placement' | 'Club' | 'Event' | 'LostItemAwareness';
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  bookmarks: mongoose.Types.ObjectId[];
  hashtags: string[];
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['General', 'Announcement', 'Hackathon', 'Placement', 'Club', 'Event', 'LostItemAwareness'],
      default: 'General',
    },
    mediaType: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
    mediaUrl: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    hashtags: [{ type: String, lowercase: true, trim: true }],
    sharesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

postSchema.index({ content: 'text', hashtags: 'text' });

export default mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
