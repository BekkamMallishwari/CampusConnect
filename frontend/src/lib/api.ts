import axios from 'axios';
import { getOptionalFrontendEnv } from './env';

const normalizeApiBaseUrl = (value?: string) => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const getApiBaseUrl = (): string => {
  const envUrl = getOptionalFrontendEnv('VITE_API_URL');
  if (envUrl) {
    return normalizeApiBaseUrl(envUrl);
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    window.location.hostname !== '::1'
  ) {
    return 'https://campusconnect-qpgo.onrender.com/api';
  }
  return 'http://localhost:5001/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'https://campusconnect-qpgo.onrender.com';
  }
};

export type UserType = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  collegeName?: string;
  department?: string;
  year?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isBlocked: boolean;
  points?: number;
  badges?: string[];
  reputation?: number;
  fcmToken?: string;
  savedItems?: string[];
  loginHistory?: Array<{
    ip: string;
    device: string;
    browser: string;
    os: string;
    loggedInAt: string;
    isNewDevice?: boolean;
  }>;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  isOnline?: boolean;
};

export type AuthResponse = {
  message: string;
  token: string;
  user: UserType;
};

export type LostItemType = {
  _id: string;
  itemName: string;
  category: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  imagePublicIds?: string[];
  images: string[];
  lostDate: string;
  lostTime?: string;
  lostLocation: string;
  color?: string;
  brand?: string;
  additionalNotes?: string;
  contactNumber: string;
  rewardAmount?: number;
  status: 'Pending' | 'Matched' | 'Returned';
  postedBy: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
};

export type FoundItemType = {
  _id: string;
  itemName: string;
  category: string;
  imageUrl?: string;
  imagePublicId?: string;
  imagePublicIds?: string[];
  images: string[];
  foundDate: string;
  foundTime?: string;
  foundLocation: string;
  description: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  rewardExpected: boolean;
  rewardAmount?: number;
  status: 'Waiting' | 'Matched' | 'Returned';
  postedBy: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
};

export type MatchType = {
  _id: string;
  lostUserId: { _id: string; name: string; email: string; avatar?: string; phone?: string; collegeName?: string; points?: number; badges?: string[]; reputation?: number };
  foundUserId: { _id: string; name: string; email: string; avatar?: string; phone?: string; collegeName?: string; points?: number; badges?: string[]; reputation?: number };
  lostItemId: LostItemType;
  foundItemId: FoundItemType;
  matchPercentage: number;
  ownerAccepted?: boolean;
  finderAccepted?: boolean;
  lostUserAccepted?: boolean;
  foundUserAccepted?: boolean;
  verified?: boolean;
  completed?: boolean;
  completedAt?: string;
  chatId?: string | ChatType;
  verificationQuestions?: {
    wallpaper?: string;
    phoneCase?: string;
    uniqueStickers?: string;
    serialNumber?: string;
    customDetails?: string;
    submittedAt?: string;
  };
  verificationResponse?: {
    verifiedByFinder?: boolean;
    notes?: string;
    respondedAt?: string;
  };
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'VERIFICATION_FAILED' | 'NONE';
  verificationAnswers?: Record<string, string>;
  verifiedBy?: string;
  verifiedAt?: string;
  meetingLocation?: string;
  meetingCoordinates?: {
    lat: number;
    lng: number;
  };
  meetingTime?: string;
  meetingStatus?: 'NONE' | 'PENDING' | 'CONFIRMED' | 'DECLINED';
  meetingScheduledBy?: string;
  rewardAmount?: number;
  rewardPaid?: boolean;
  paymentStatus?: 'NONE' | 'PENDING' | 'PAID' | 'FAILED';
  paymentId?: string;
  transactionId?: string;
  paidAt?: string;
  ownerRating?: {
    rating: number;
    feedback?: string;
    createdAt?: string;
  };
  finderRating?: {
    rating: number;
    feedback?: string;
    createdAt?: string;
  };
  lostUserVerified?: boolean;
  foundUserVerified?: boolean;
  lostUserHandover?: boolean;
  foundUserHandover?: boolean;
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
    | 'HANDOVER_COMPLETED'
    | 'Accepted'
    | 'Rejected';
  rewardStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating' | 'Paid';
  contactShared: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType = {
  _id: string;
  userId: string;
  type: 'Match' | 'Chat' | 'Payment' | 'Reward' | 'System' | 'Item';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: string;
  createdAt: string;
};

export type ChatType = {
  _id: string;
  kind?: 'match' | 'conversation';
  itemType?: 'lost' | 'found';
  matchId?: MatchType;
  itemId?: string;
  ownerId?: string;
  requesterId?: string;
  participants: UserType[];
  lastMessage?: MessageType;
  isClosed?: boolean;
  unreadCount?: number;
  itemPreview?: {
    _id: string;
    itemName: string;
    imageUrl?: string;
    status?: string;
    location?: string;
    itemType?: 'lost' | 'found';
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageLocation = {
  name: string;
  lat?: number;
  lng?: number;
};

export type MessageType = {
  _id: string;
  chatId: string;
  senderId: { _id: string; name: string; avatar?: string };
  receiverId?: { _id: string; name: string; avatar?: string };
  conversationId?: string;
  itemId?: string;
  text?: string;
  imageUrl?: string;
  location?: MessageLocation;
  isRead: boolean;
  createdAt: string;
};

export type AiStatusType = {
  success: boolean;
  provider: string;
  configured: boolean;
  model: string;
  status?: 'online' | 'degraded' | 'offline';
  aiStatus?: string;
  similarityScore?: number;
  pendingReviews?: number;
  processingQueue?: number;
  accuracy?: number;
  confidenceLevel?: number;
  todayMatches?: number;
  lastScan?: string;
  matchingEngine?: string;
};

export type RewardType = {
  _id: string;
  matchId: string;
  lostUserId: string;
  foundUserId: string;
  requestedAmount: number;
  finalAmount?: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating' | 'Paid';
  history: Array<{
    proposedBy: string;
    amount: number;
    action: 'Proposed' | 'Negotiated';
    createdAt: string;
  }>;
};

export type PaymentType = {
  _id: string;
  matchId: string;
  userId?: { _id: string; name: string; email: string };
  finderId?: { _id: string; name: string; email: string };
  rewardId?: string;
  lostUserId?: { _id: string; name: string; email: string };
  foundUserId?: { _id: string; name: string; email: string };
  amount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'Pending' | 'Completed' | 'Failed';
  status?: string;
  receiptUrl?: string;
  paidAt?: string;
  createdAt: string;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusconnect_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  signup: (payload: FormData | Record<string, any>) => {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return api.post<AuthResponse>('/auth/signup', payload, { headers });
  },
  login: (payload: Record<string, any>) => api.post<AuthResponse>('/auth/login', payload),
  googleLogin: (payload: { googleId: string; email: string; name: string; avatar?: string }) =>
    api.post<AuthResponse>('/auth/google', payload),
  googleTokenLogin: (credential: string) =>
    api.post<AuthResponse>('/auth/google/verify-token', { credential }),
  appleLogin: (payload: { appleId: string; email?: string; name?: string }) =>
    api.post<AuthResponse>('/auth/apple', payload),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (payload: Record<string, any>) => api.post<{ message: string }>('/auth/reset-password', payload),
  getMe: () => api.get<{ user: UserType }>('/auth/me'),
  updateProfile: (payload: FormData) =>
    api.put<{ message: string; user: UserType }>('/auth/profile', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const lostItemsApi = {
  getAll: (params?: Record<string, any>) => api.get<{ items: LostItemType[] }>('/lost-items', { params }),
  getMyItems: () => api.get<{ items: LostItemType[] }>('/lost-items/my-items'),
  getById: (id: string) => api.get<{ item: LostItemType }>(`/lost-items/${id}`),
  create: (formData: FormData) =>
    api.post<{ message: string; item: LostItemType }>('/lost-items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, formData: FormData) =>
    api.put<{ message: string; item: LostItemType }>(`/lost-items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete<{ message: string }>(`/lost-items/${id}`),
  markReturned: (id: string) => api.post<{ message: string; item: LostItemType }>(`/lost-items/${id}/mark-returned`),
};

export const foundItemsApi = {
  getAll: (params?: Record<string, any>) => api.get<{ items: FoundItemType[] }>('/found-items', { params }),
  getMyItems: () => api.get<{ items: FoundItemType[] }>('/found-items/my-items'),
  getById: (id: string) => api.get<{ item: FoundItemType }>(`/found-items/${id}`),
  create: (formData: FormData) =>
    api.post<{ message: string; item: FoundItemType }>('/found-items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, formData: FormData) =>
    api.put<{ message: string; item: FoundItemType }>(`/found-items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete<{ message: string }>(`/found-items/${id}`),
  markReturned: (id: string) => api.post<{ message: string; item: FoundItemType }>(`/found-items/${id}/mark-returned`),
};

export const matchesApi = {
  getAll: () => api.get<{ matches: MatchType[] }>('/matches'),
  getById: (id: string) => api.get<{ match: MatchType }>(`/matches/${id}`),
  accept: (id: string) => api.post<{ message: string; match: MatchType; chat?: ChatType }>(`/matches/${id}/accept`),
  confirm: (id: string) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/confirm`),
  foundConfirm: (id: string) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/found-confirm`),
  confirmHandover: (id: string) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/confirm-handover`),
  reject: (id: string) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/reject`),
  verifyOwnership: (
    id: string,
    questions: { wallpaper?: string; phoneCase?: string; uniqueStickers?: string; serialNumber?: string; customDetails?: string; answers?: Record<string, string> },
  ) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/verify-ownership`, questions),
  finderVerify: (id: string, payload: { verified: boolean; notes?: string }) =>
    api.post<{ message: string; match: MatchType }>(`/matches/${id}/finder-verify`, payload),
  scheduleMeeting: (id: string, payload: { meetingLocation: string; meetingTime: string; meetingCoordinates?: { lat: number; lng: number } }) =>
    api.post<{ message: string; match: MatchType }>(`/matches/${id}/schedule-meeting`, payload),
  respondMeeting: (id: string, payload: { action: 'accept' | 'decline' }) =>
    api.post<{ message: string; match: MatchType }>(`/matches/${id}/respond-meeting`, payload),
  markReturned: (id: string) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/mark-returned`),
  rate: (id: string, payload: { rating: number; feedback?: string }) =>
    api.post<{ message: string; match: MatchType }>(`/matches/${id}/rate`, payload),
};

export const notificationsApi = {
  getAll: () => api.get<{ notifications: NotificationType[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) => api.patch<{ message: string }>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ message: string }>('/notifications/read-all'),
};

export const chatsApi = {
  getAll: () => api.get<{ chats: ChatType[] }>('/chats'),
  contactOwner: (payload: { itemId: string; ownerId: string; itemType: 'lost' | 'found' }) =>
    api.post<{ chat: ChatType; created: boolean }>('/chats/contact-owner', payload),
  getMessages: (chatId: string) => api.get<{ messages: MessageType[] }>(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, text?: string, image?: File, location?: MessageLocation) => {
    const fd = new FormData();
    if (text) fd.append('text', text);
    if (image) fd.append('image', image);
    if (location) fd.append('location', JSON.stringify(location));
    return api.post<{ message: MessageType }>(`/chats/${chatId}/messages`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const rewardsApi = {
  create: (matchId: string, requestedAmount: number) =>
    api.post<{ message: string; reward: RewardType }>('/rewards', { matchId, requestedAmount }),
  getByMatchId: (matchId: string) => api.get<{ reward: RewardType }>(`/rewards/${matchId}`),
  getLeaderboard: () => api.get<{ leaderboard: UserType[] }>('/rewards/leaderboard'),
  accept: (id: string) => api.patch<{ message: string; reward: RewardType }>(`/rewards/${id}/accept`),
  reject: (id: string) => api.patch<{ message: string; reward: RewardType }>(`/rewards/${id}/reject`),
  negotiate: (id: string, amount: number) =>
    api.patch<{ message: string; reward: RewardType }>(`/rewards/${id}/negotiate`, { amount }),
};

export const paymentsApi = {
  createOrder: (matchId: string, amount?: number) =>
    api.post<{
      success: boolean;
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      paymentId: string;
      message?: string;
    }>('/payments/create-order', { matchId, amount }),
  verifyPayment: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    matchId: string;
    paymentId?: string;
  }) =>
    api.post<{
      success: boolean;
      message: string;
      payment: PaymentType;
      match: MatchType;
    }>('/payments/verify-payment', payload),
  verify: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    matchId: string;
    paymentId?: string;
  }) =>
    api.post<{
      success: boolean;
      message: string;
      payment: PaymentType;
      match: MatchType;
    }>('/payments/verify', payload),
  getById: (id: string) => api.get<{ success: boolean; payment: PaymentType }>(`/payments/${id}`),
  getAll: () => api.get<{ payments: PaymentType[] }>('/payments'),
  downloadReceipt: (id: string) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
};

export type PostType = {
  _id: string;
  author: { _id: string; name: string; email: string; avatar?: string; collegeName?: string; role: string };
  content: string;
  category: 'General' | 'Announcement' | 'Hackathon' | 'Placement' | 'Club' | 'Event' | 'LostItemAwareness';
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  likes: string[];
  comments: Array<{ _id: string; user: { _id: string; name: string; avatar?: string }; text: string; createdAt: string }>;
  bookmarks: string[];
  hashtags: string[];
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
};

export const communityApi = {
  getPosts: (params?: { category?: string; hashtag?: string; page?: number; limit?: number }) =>
    api.get<{ posts: PostType[]; total: number; page: number; hasMore: boolean }>('/community/posts', { params }),
  createPost: (formData: FormData) =>
    api.post<{ message: string; post: PostType }>('/community/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  likePost: (id: string) => api.post<{ message: string; likesCount: number; likes: string[] }>(`/community/posts/${id}/like`),
  commentPost: (id: string, text: string) =>
    api.post<{ message: string; comments: any[] }>(`/community/posts/${id}/comment`, { text }),
  getTrendingHashtags: () => api.get<{ trending: Array<{ tag: string; count: number }> }>('/community/trending'),
};

export const aiApi = {
  getStatus: () => api.get<AiStatusType>('/ai/status'),
  enhanceDescription: (payload: {
    itemName: string;
    category: string;
    description: string;
    location?: string;
    brand?: string;
    color?: string;
  }) => api.post<{ enhancedDescription: string }>('/ai/enhance-description', payload),
  testConnection: () =>
    api.get<{
      success: boolean;
      configured: boolean;
      model: string;
      message: string;
      possibleCauses?: string[];
    }>('/ai/test'),
};

export const adminApi = {
  getAnalytics: () =>
    api.get<{
      totalUsers: number;
      totalLostItems: number;
      totalFoundItems: number;
      totalMatches: number;
      acceptedMatches: number;
      totalPayments: number;
      completedPayments: number;
      totalRevenue: number;
      returnedItems: number;
      activeChats: number;
    }>('/admin/analytics'),
  getUsers: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<{ users: UserType[]; total: number; page: number }>('/admin/users', { params }),
  blockUser: (id: string) => api.patch<{ message: string; user: UserType }>(`/admin/users/${id}/block`),
  getReports: (params: { type: 'lost' | 'found'; page?: number; limit?: number }) =>
    api.get<{ items: any[]; total: number }>('/admin/reports', { params }),
  deleteReport: (id: string, type: 'lost' | 'found') =>
    api.delete<{ message: string }>(`/admin/reports/${id}`, { params: { type } }),
  getMatches: () => api.get<{ matches: any[] }>('/admin/matches'),
  getPayments: () => api.get<{ payments: any[] }>('/admin/payments'),
};
