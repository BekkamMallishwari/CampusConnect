import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginHistory {
  ip: string;
  device: string;
  browser: string;
  os: string;
  loggedInAt: Date;
  isNewDevice?: boolean;
}

export interface INotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  collegeName?: string;
  department?: string;
  year?: string;
  fcmToken?: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  googleId?: string;
  appleId?: string;
  points: number;
  badges: string[];
  reputation: number;
  savedItems: mongoose.Types.ObjectId[];
  loginHistory: ILoginHistory[];
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    fcmToken: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    googleId: { type: String, index: true },
    appleId: { type: String, index: true },
    points: { type: Number, default: 0 },
    badges: [{ type: String }],
    reputation: { type: Number, default: 100 },
    savedItems: [{ type: Schema.Types.ObjectId, ref: 'LostItem' }],
    loginHistory: [
      {
        ip: { type: String, default: 'Unknown' },
        device: { type: String, default: 'Unknown Device' },
        browser: { type: String, default: 'Unknown Browser' },
        os: { type: String, default: 'Unknown OS' },
        loggedInAt: { type: Date, default: Date.now },
        isNewDevice: { type: Boolean, default: false },
      },
    ],
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default UserModel;
