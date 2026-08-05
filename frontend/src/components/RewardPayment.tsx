import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard, CheckCircle2, Loader2, ShieldCheck, Clock, Check, ArrowRight } from 'lucide-react';
import { paymentsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface RewardPaymentProps {
  matchId: string;
  defaultAmount?: number;
  finderName?: string;
  itemName?: string;
  paymentStatus?: string;
  isOwner?: boolean;
  onPaymentSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const RewardPayment: React.FC<RewardPaymentProps> = ({
  matchId,
  defaultAmount = 0,
  finderName = 'the finder',
  itemName = 'Item',
  paymentStatus,
  isOwner = true,
  onPaymentSuccess,
}) => {
  const { user } = useAuth();
  const [amount] = useState<number>(defaultAmount);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  const [isPaid, setIsPaid] = useState<boolean>(
    paymentStatus === 'PAID' || paymentStatus === 'SUCCESS' || paymentStatus === 'Completed'
  );

  useEffect(() => {
    setIsPaid(paymentStatus === 'PAID' || paymentStatus === 'SUCCESS' || paymentStatus === 'Completed');
  }, [paymentStatus]);

  useEffect(() => {
    // Check if Razorpay script is already present
    if (window.Razorpay || document.querySelector('script[src*="checkout.razorpay.com"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
    };
    document.body.appendChild(script);
  }, []);

  const handleInitiatePayment = async () => {
    if (isProcessingRef.current || loading || isPaid) return;

    if (amount <= 0) {
      toast.error('Please enter a valid reward amount (greater than ₹0)');
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);
    setStatusText('Creating order...');

    try {
      // 1. Create order on backend
      const res = await paymentsApi.createOrder(matchId, amount);

      if (!res.data || !res.data.orderId) {
        throw new Error(res.data?.message || 'Failed to create payment order');
      }

      const { orderId, amount: orderAmount, currency, keyId, paymentId } = res.data;

      setStatusText('Opening secure checkout...');

      // 2. Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: orderAmount,
        currency: currency || 'INR',
        name: 'CampusConnect',
        description: `Reward payment to ${finderName} for ${itemName}`,
        image: '/favicon.ico',
        order_id: orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setStatusText('Verifying payment signature...');
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              matchId,
              paymentId,
            });

            if (verifyRes.data.success) {
              setIsPaid(true);
              toast.success('✅ Payment Successful! Contact details & chat unlocked.');
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            } else {
              toast.error(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            const errMsg = err?.response?.data?.message || err?.message || String(err);
            toast.error(`Payment Verification Failed: ${errMsg}`);
          } finally {
            isProcessingRef.current = false;
            setLoading(false);
            setStatusText('');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#2563EB',
        },
        modal: {
          ondismiss: () => {
            isProcessingRef.current = false;
            setLoading(false);
            setStatusText('');
            toast.error('Payment checkout window closed before completing payment.');
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK is not loaded. Please try again.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed event:', response.error);
        toast.error(`Payment failed: ${response.error?.description || response.error?.reason || 'Transaction declined'}`);
        isProcessingRef.current = false;
        setLoading(false);
        setStatusText('');
      });

      rzp.open();
    } catch (err: any) {
      console.error('Create order error:', err);
      const errMsg = err?.response?.data?.message || err?.message || String(err);
      toast.error(`Failed to initiate payment: ${errMsg}`);
      isProcessingRef.current = false;
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between border-b ${isPaid ? 'border-emerald-100 bg-emerald-50' : 'border-blue-100 bg-blue-50/50'}`}>
        <div className="flex items-center gap-3 text-sm font-bold">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${isPaid ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className={isPaid ? 'text-emerald-900' : 'text-blue-950'}>Reward Payment</h3>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${isPaid ? 'text-emerald-600' : 'text-blue-600'}`}>
              Secure Escrow Transaction
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-xs ${
          isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
        }`}>
          {isPaid ? <Check size={14} /> : <Clock size={14} />}
          {isPaid ? 'Paid' : 'Pending'}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Timeline */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-500 shadow-sm">
              <Check size={14} />
            </div>
            <span>Match Verified</span>
          </div>
          <div className="h-[2px] flex-1 bg-emerald-500 mx-2 opacity-50" />
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-500 shadow-sm">
              <Check size={14} />
            </div>
            <span>Reward Accepted</span>
          </div>
          <div className={`h-[2px] flex-1 mx-2 ${isPaid ? 'bg-emerald-500 opacity-50' : 'bg-slate-200'}`} />
          <div className={`flex flex-col items-center gap-2 ${isPaid ? 'text-emerald-600' : 'text-blue-600'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm border-2 ${isPaid ? 'bg-emerald-100 border-emerald-500' : 'bg-blue-100 border-blue-500'}`}>
              {isPaid ? <Check size={14} /> : <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />}
            </div>
            <span>{isPaid ? 'Payment Done' : 'Payment Required'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Details</p>
              <h4 className="text-sm font-bold text-slate-900">Reward for {itemName}</h4>
              <p className="text-xs text-slate-600 mt-1">Payable to: <strong className="text-slate-900">{finderName}</strong></p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</p>
              <div className="text-2xl font-black text-slate-900">₹{amount.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isOwner ? (
          <button
            onClick={handleInitiatePayment}
            disabled={loading || !scriptLoaded || isPaid || amount <= 0}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-bold shadow-md transition-all duration-300 ${
              isPaid
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-[#1E3A8A] text-white hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isPaid ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-500" />
                Payment Completed Successfully
              </>
            ) : loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                {statusText || 'Processing...'}
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Pay ₹{amount.toLocaleString('en-IN')} Securely via Razorpay
                <ArrowRight size={16} />
              </>
            )}
          </button>
        ) : (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 text-center font-medium">
            {isPaid ? (
              <span className="flex items-center justify-center gap-2 text-emerald-700"><CheckCircle2 size={16}/> Reward payment received!</span>
            ) : (
              <span className="flex items-center justify-center gap-2 animate-pulse"><Clock size={16}/> Waiting for owner to complete the reward payment...</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400">
          <ShieldCheck size={12} /> Payments are fully secured and escrowed until item is verified.
        </div>
      </div>
    </div>
  );
};

export default RewardPayment;
