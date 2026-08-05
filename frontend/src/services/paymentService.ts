import { api } from '../lib/api';

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  matchId: string;
  paymentId: string;
}

export const paymentService = {
  createRazorpayOrder: async (matchId: string, amount: number): Promise<RazorpayOrderResponse> => {
    const response = await api.post<RazorpayOrderResponse>('/payments/create-order', { matchId, amount });
    return response.data;
  },

  verifyRazorpayPayment: async (payload: VerifyPaymentPayload): Promise<any> => {
    const response = await api.post('/payments/verify', payload);
    return response.data;
  },
};
