import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  lostUserId: mongoose.Types.ObjectId;
  foundUserId: mongoose.Types.ObjectId;
  lostItemId: mongoose.Types.ObjectId;
  foundItemId: mongoose.Types.ObjectId;
  matchPercentage: number;
  // Acceptance flags
  ownerAccepted: boolean;
  finderAccepted: boolean;
  lostUserAccepted: boolean;
  foundUserAccepted: boolean;
  // Verification and completion
  verified: boolean;
  completed: boolean;
  completedAt?: Date;
  chatId?: mongoose.Types.ObjectId;
  
  // Verification questionnaire
  verificationQuestions?: {
    wallpaper?: string;
    phoneCase?: string;
    uniqueStickers?: string;
    serialNumber?: string;
    customDetails?: string;
    submittedAt?: Date;
  };
  verificationResponse?: {
    verifiedByFinder?: boolean;
    notes?: string;
    respondedAt?: Date;
  };
  
  // Phase 3 fields
  verificationStatus: 'PENDING' | 'VERIFIED' | 'VERIFICATION_FAILED' | 'NONE';
  verificationAnswers?: Record<string, string>;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  meetingLocation?: string;
  meetingCoordinates?: {
    lat: number;
    lng: number;
  };
  meetingTime?: Date;
  meetingStatus?: 'NONE' | 'PENDING' | 'CONFIRMED' | 'DECLINED';
  meetingScheduledBy?: mongoose.Types.ObjectId;
  liveTrackingOwner?: boolean;
  liveTrackingFinder?: boolean;

  // Rewards & Payments
  rewardAmount?: number;
  rewardPaid?: boolean;
  itemReturned?: boolean;
  rewardStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating' | 'Paid';
  paymentStatus?: 'NONE' | 'PENDING' | 'PAID' | 'FAILED';
  paymentId?: mongoose.Types.ObjectId;
  transactionId?: string;
  paidAt?: Date;
  // Ratings
  ownerRating?: {
    rating: number;
    feedback?: string;
    createdAt?: Date;
  };
  finderRating?: {
    rating: number;
    feedback?: string;
    createdAt?: Date;
  };
  // Ownership verification fields (legacy compatibility)
  lostUserVerified: boolean;
  foundUserVerified: boolean;
  lostUserHandover: boolean;
  foundUserHandover: boolean;
  matchStatus:
    | 'Pending'
    | 'Owner Accepted'
    | 'Finder Accepted'
    | 'PossibleMatch'
    | 'LostUserVerified'
    | 'Confirmed'
    | 'CONFIRMED'
    | 'Verified'
    | 'Completed'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_COMPLETED'
    | 'payment_completed'
    | 'HANDOVER_COMPLETED'
    | 'Accepted'
    | 'Rejected';
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
    // Acceptance flags
    ownerAccepted: { type: Boolean, default: false },
    finderAccepted: { type: Boolean, default: false },
    lostUserAccepted: { type: Boolean, default: false },
    foundUserAccepted: { type: Boolean, default: false },
    // Verification & completion
    verified: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat' },
    verificationQuestions: {
      wallpaper: { type: String },
      phoneCase: { type: String },
      uniqueStickers: { type: String },
      serialNumber: { type: String },
      customDetails: { type: String },
      submittedAt: { type: Date },
    },
    verificationResponse: {
      verifiedByFinder: { type: Boolean },
      notes: { type: String },
      respondedAt: { type: Date },
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'VERIFICATION_FAILED', 'NONE'],
      default: 'NONE',
    },
    verificationAnswers: { type: Map, of: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    meetingLocation: { type: String },
    meetingCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    meetingTime: { type: Date },
    meetingStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'CONFIRMED', 'DECLINED'],
      default: 'NONE',
    },
    meetingScheduledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    liveTrackingOwner: { type: Boolean, default: false },
    liveTrackingFinder: { type: Boolean, default: false },
    rewardAmount: { type: Number },
    rewardPaid: { type: Boolean, default: false },
    itemReturned: { type: Boolean, default: false },
    rewardStatus: {
      type: String,
      enum: ['None', 'Pending', 'Accepted', 'Rejected', 'Negotiating', 'Paid'],
      default: 'None',
    },
    paymentStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PAID', 'FAILED'],
      default: 'NONE',
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    transactionId: { type: String },
    paidAt: { type: Date },
    ownerRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
    finderRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
    lostUserVerified: { type: Boolean, default: false },
    foundUserVerified: { type: Boolean, default: false },
    lostUserHandover: { type: Boolean, default: false },
    foundUserHandover: { type: Boolean, default: false },
    matchStatus: {
      type: String,
      enum: [
        'Pending',
        'Owner Accepted',
        'Finder Accepted',
        'PossibleMatch',
        'LostUserVerified',
        'Confirmed',
        'CONFIRMED',
        'Verified',
        'Completed',
        'PENDING_PAYMENT',
        'PAYMENT_COMPLETED',
        'payment_completed',
        'HANDOVER_COMPLETED',
        'Accepted',
        'Rejected',
      ],
      default: 'Pending',
    },
    contactShared: { type: Boolean, default: false },
  },
  { timestamps: true },
);

matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

export default mongoose.models.Match || mongoose.model<IMatch>('Match', matchSchema);
