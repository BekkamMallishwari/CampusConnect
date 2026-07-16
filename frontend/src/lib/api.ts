import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

export type UserType = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  collegeName?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isBlocked: boolean;
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
  images: string[];
  lostDate: string;
  lostTime?: string;
  lostLocation: string;
  color?: string;
  brand?: string;
  additionalNotes?: string;
  contactNumber: string;
  status: 'Pending' | 'Matched' | 'Returned';
  postedBy: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
};

export type FoundItemType = {
  _id: string;
  itemName: string;
  category: string;
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
  lostUserId: { _id: string; name: string; email: string; avatar?: string; phone?: string; collegeName?: string };
  foundUserId: { _id: string; name: string; email: string; avatar?: string; phone?: string; collegeName?: string };
  lostItemId: LostItemType;
  foundItemId: FoundItemType;
  matchPercentage: number;
  lostUserAccepted: boolean;
  foundUserAccepted: boolean;
  matchStatus: 'Pending' | 'Accepted' | 'Rejected' | 'Verified';
  rewardStatus: 'None' | 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating' | 'Paid';
  contactShared: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType = {
  _id: string;
  userId: string;
  type: 'Match' | 'Chat' | 'Payment' | 'Reward' | 'System';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: string;
  createdAt: string;
};

export type ChatType = {
  _id: string;
  matchId: MatchType;
  participants: UserType[];
  lastMessage?: MessageType;
  createdAt: string;
  updatedAt: string;
};

export type MessageType = {
  _id: string;
  chatId: string;
  senderId: { _id: string; name: string; avatar?: string };
  text?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
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
  rewardId: string;
  lostUserId: { _id: string; name: string; email: string };
  foundUserId: { _id: string; name: string; email: string };
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  receiptUrl?: string;
  createdAt: string;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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
};

export const matchesApi = {
  getAll: () => api.get<{ matches: MatchType[] }>('/matches'),
  getById: (id: string) => api.get<{ match: MatchType }>(`/matches/${id}`),
  accept: (id: string) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/accept`),
  reject: (id: string) => api.post<{ message: string; match: MatchType }>(`/matches/${id}/reject`),
};

export const notificationsApi = {
  getAll: () => api.get<{ notifications: NotificationType[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) => api.patch<{ message: string }>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ message: string }>('/notifications/read-all'),
};

export const chatsApi = {
  getAll: () => api.get<{ chats: ChatType[] }>('/chats'),
  getMessages: (chatId: string) => api.get<{ messages: MessageType[] }>(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, text: string, image?: File) => {
    const fd = new FormData();
    if (text) fd.append('text', text);
    if (image) fd.append('image', image);
    return api.post<{ message: MessageType }>(`/chats/${chatId}/messages`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const rewardsApi = {
  create: (matchId: string, requestedAmount: number) =>
    api.post<{ message: string; reward: RewardType }>('/rewards', { matchId, requestedAmount }),
  getByMatchId: (matchId: string) => api.get<{ reward: RewardType }>(`/rewards/${matchId}`),
  accept: (id: string) => api.patch<{ message: string; reward: RewardType }>(`/rewards/${id}/accept`),
  reject: (id: string) => api.patch<{ message: string; reward: RewardType }>(`/rewards/${id}/reject`),
  negotiate: (id: string, amount: number) =>
    api.patch<{ message: string; reward: RewardType }>(`/rewards/${id}/negotiate`, { amount }),
};

export const paymentsApi = {
  createSession: (rewardId: string) =>
    api.post<{
      sessionId?: string;
      sessionUrl?: string;
      simulatedUrl?: string;
      mode?: string;
      paymentId: string;
    }>('/payments/create-session', { rewardId }),
  confirmPayment: (paymentId: string, sessionId?: string) =>
    api.post<{ message: string; payment: PaymentType }>('/payments/confirm', { paymentId, sessionId }),
  getAll: () => api.get<{ payments: PaymentType[] }>('/payments'),
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
