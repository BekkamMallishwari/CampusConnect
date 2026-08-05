import { api } from '../lib/api';

export interface RewardUpdateResponse {
  message: string;
  rewardAmount: number;
}

export interface RewardStatusResponse {
  message: string;
  rewardStatus: string;
}

export const rewardService = {
  // Update reward amount (Owner only)
  updateReward: async (matchId: string, amount: number): Promise<RewardUpdateResponse> => {
    const response = await api.put<RewardUpdateResponse>(`/rewards/match/${matchId}/update`, { amount });
    return response.data;
  },

  // Accept reward (Finder only)
  acceptReward: async (matchId: string): Promise<RewardStatusResponse> => {
    const response = await api.post<RewardStatusResponse>(`/rewards/match/${matchId}/accept`);
    return response.data;
  },

  // Decline reward (Finder only)
  declineReward: async (matchId: string): Promise<RewardStatusResponse> => {
    const response = await api.post<RewardStatusResponse>(`/rewards/match/${matchId}/decline`);
    return response.data;
  },
};
