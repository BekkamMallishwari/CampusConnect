import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { paymentsApi } from '../lib/api';

export default function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  const paymentId = searchParams.get('paymentId');
  const sessionId = searchParams.get('session_id');
  const simulated = searchParams.get('simulated');

  useEffect(() => {
    if (!paymentId) {
      setStatus('error');
      return;
    }

    const confirmPayment = async () => {
      try {
        if (simulated === 'true') {
          // If simulated dev redirect, confirm after 1s delay
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
        await paymentsApi.confirmPayment(paymentId, sessionId || undefined);
        setStatus('success');
        toast.success('Escrow payment verified successfully!');
      } catch (err) {
        setStatus('error');
        toast.error('Failed to verify payment session.');
      }
    };

    confirmPayment();
  }, [paymentId, sessionId, simulated]);

  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-900/10 p-8 text-center shadow-2xl backdrop-blur-md space-y-6">
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <h2 className="text-xl font-bold text-white">Verifying Payment Payout...</h2>
            <p className="text-sm text-slate-400">
              Confirming transaction with payment gateway. Please do not close or reload this page.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Payment Successful!</h2>
            <p className="text-sm text-slate-350 leading-relaxed">
              Your reward payment has been credited to the finder. Handover contact details are now unlocked and shared on the item details page.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition"
            >
              Back to Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Verification Failed</h2>
            <p className="text-sm text-slate-350 leading-relaxed">
              We couldn't confirm your Stripe transaction. If this was a mistake, please try making the payment again.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
