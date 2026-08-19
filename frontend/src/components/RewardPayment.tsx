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
      const res = await paymentsApi.createOrder(matchId, amount);

      if (!res.data || !res.data.orderId) {
        throw new Error(res.data?.message || 'Failed to create payment order');
      }

      const { orderId, amount: orderAmount, currency, keyId, paymentId } = res.data;

      setStatusText('Opening secure checkout...');

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
          try {
            setStatusText('Verifying payment signature...');
            const verifyRes = await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              matchId,
              paymentId,
            });

            if (verifyRes.data?.success) {
              setIsPaid(true);
              toast.success('🎉 Reward payment verified successfully!');
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            } else {
              toast.error(verifyRes.data?.message || 'Payment verification failed.');
            }
          } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Signature verification error.');
          } finally {
            setLoading(false);
            isProcessingRef.current = false;
            setStatusText('');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#6366F1',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            isProcessingRef.current = false;
            setStatusText('');
            toast('Payment cancelled.', { icon: 'ℹ️' });
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          toast.error(`Payment Failed: ${response.error?.description || 'Transaction declined'}`);
          setLoading(false);
          isProcessingRef.current = false;
          setStatusText('');
        });
        rzp.open();
      } else {
        // Fallback simulation for local dev
        setTimeout(async () => {
          try {
            await paymentsApi.verifyPayment({
              razorpay_order_id: orderId,
              razorpay_payment_id: 'sim_pay_' + Date.now(),
              razorpay_signature: 'sim_sig_' + Date.now(),
              matchId,
              paymentId,
            });
            setIsPaid(true);
            toast.success('🎉 Reward payment verified successfully!');
            if (onPaymentSuccess) onPaymentSuccess();
          } catch (e: any) {
            toast.error('Simulation payment failed');
          } finally {
            setLoading(false);
            isProcessingRef.current = false;
            setStatusText('');
          }
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to initiate checkout.');
      setLoading(false);
      isProcessingRef.current = false;
      setStatusText('');
    }
  };

  if (!isOwner) {
    return (
      <div className="glass-panel p-5 sm:p-6 rounded-[24px] space-y-4 border shadow-sm" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs" style={{ background: isPaid ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--dash-text-primary)' }}>Reward Payment</h3>
              <p className="text-xs text-slate-500">
                {isPaid ? 'Reward funds received in escrow.' : 'Payment will be completed by the item owner.'}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full border self-start sm:self-auto ${
            isPaid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
          }`}>
            {isPaid ? <Check size={13} /> : <Clock size={13} />}
            STATUS: {isPaid ? 'PAID' : 'PENDING'}
          </span>
        </div>

        <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--dash-text-muted)' }}>Reward for {itemName}</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>Payable to: <strong style={{ color: 'var(--dash-text-primary)' }}>{finderName}</strong></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--dash-text-muted)' }}>Amount</p>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{amount.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold" style={{ color: 'var(--dash-text-muted)' }}>
          <ShieldCheck size={12} /> {isPaid ? 'Reward funds will be disbursed upon verified item handover.' : 'Reward funds will be held in secure escrow once paid by owner.'}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
        <div className="flex items-center gap-3 text-sm font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs" style={{ background: isPaid ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Reward Payment</h3>
            <p className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: isPaid ? '#10b981' : 'var(--dash-accent)' }}>
              Secure Escrow Transaction
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full border ${
          isPaid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        }`}>
          {isPaid ? <Check size={13} /> : <Clock size={13} />}
          {isPaid ? 'Paid' : 'Pending'}
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Timeline */}
        <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--dash-text-muted)' }}>
          <div className="flex flex-col items-center gap-1.5 text-emerald-600">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs text-xs">
              <Check size={13} />
            </div>
            <span>Match Verified</span>
          </div>
          <div className="h-[2px] flex-1 bg-emerald-500 mx-2 opacity-50" />
          <div className="flex flex-col items-center gap-1.5 text-emerald-600">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs text-xs">
              <Check size={13} />
            </div>
            <span>Reward Accepted</span>
          </div>
          <div className={`h-[2px] flex-1 mx-2 ${isPaid ? 'bg-emerald-500 opacity-50' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`flex flex-col items-center gap-1.5 ${isPaid ? 'text-emerald-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
            <div className={`flex h-7 w-7 items-center justify-center rounded-full shadow-xs text-xs ${isPaid ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
              {isPaid ? <Check size={13} /> : <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
            </div>
            <span>{isPaid ? 'Payment Done' : 'Payment Required'}</span>
          </div>
        </div>

        <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Payment Details</p>
              <h4 className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>Reward for {itemName}</h4>
              <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>Payable to: <strong style={{ color: 'var(--dash-text-primary)' }}>{finderName}</strong></p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Amount</p>
              <div className="text-2xl font-black" style={{ color: 'var(--dash-text-primary)' }}>₹{amount.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleInitiatePayment}
          disabled={loading || !scriptLoaded || isPaid || amount <= 0}
          className={`dash-btn-primary w-full py-3.5 px-4 text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 ${
            isPaid
              ? 'opacity-70 cursor-not-allowed bg-emerald-600 hover:bg-emerald-600'
              : 'hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isPaid ? (
            <>
              <CheckCircle2 size={18} className="text-emerald-200" />
              <span>Reward Payment Completed Successfully</span>
            </>
          ) : loading ? (
            <>
              <Loader2 size={18} className="animate-spin text-white" />
              <span>{statusText || 'Processing Payment...'}</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Pay ₹{amount.toLocaleString('en-IN')} Securely via Razorpay</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold" style={{ color: 'var(--dash-text-muted)' }}>
          <ShieldCheck size={12} /> Payments are fully secured and escrowed until item is verified.
        </div>
      </div>
    </div>
  );
};

export default RewardPayment;
