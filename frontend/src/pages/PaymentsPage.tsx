import { useEffect, useState } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Clock,
  IndianRupee,
  Package,
  ExternalLink,
  RefreshCw,
  Loader2,
  Download,
} from 'lucide-react';
import { paymentsApi, type PaymentType } from '../lib/api';
import PageTransition from '../components/PageTransition';

// ─── Callback / Confirm Page (after payment gateway redirect) ──────────────────
function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [matchId, setMatchId] = useState<string | null>(null);

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
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
        const res = await paymentsApi.confirmPayment(paymentId, sessionId || undefined);
        setMatchId((res.data.payment as any)?.matchId || null);
        setStatus('success');
        toast.success('Escrow payment verified successfully!');
      } catch (err: any) {
        setStatus('error');
        const errMsg = err?.response?.data?.message || err?.message || String(err);
        toast.error(`Verification Failed: ${errMsg}`);
      }
    };

    confirmPayment();
  }, [paymentId, sessionId, simulated]);

  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-6">
        {status === 'verifying' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Verifying Payment…
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Confirming transaction with payment gateway. Please do not close or reload this page.
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60">
              <CheckCircle2 className="text-emerald-600" size={34} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Payment Successful!
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your reward payment has been verified and credited to the finder. Handover contact details are now unlocked.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {matchId && (
                <Link
                  to={`/matches/${matchId}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow hover:bg-blue-700 transition"
                >
                  View Match Details <ArrowRight size={16} />
                </Link>
              )}
              <Link
                to="/payments"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                Payment History
              </Link>
              <Link
                to="/dashboard"
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/60">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                We couldn't confirm your transaction. If this was a mistake, please try making the payment again from the match chat page.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/matches"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow hover:bg-blue-700 transition"
              >
                Go to Matches
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payment Status Badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'completed' || s === 'paid')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
        <CheckCircle2 size={11} /> Paid
      </span>
    );
  if (s === 'pending')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
        <Clock size={11} /> Pending
      </span>
    );
  if (s === 'failed')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400">
        <AlertTriangle size={11} /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      {status || 'Unknown'}
    </span>
  );
}

// ─── Payment History Page ──────────────────────────────────────────────────────
function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadReceipt = async (paymentId: string) => {
    setDownloadingId(paymentId);
    try {
      const res = await paymentsApi.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchPayments = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await paymentsApi.getAll();
      setPayments(res.data.payments || []);
    } catch {
      toast.error('Failed to load payment history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalPaid = payments
    .filter((p) => {
      const s = (p.paymentStatus || p.status || '').toLowerCase();
      return s === 'success' || s === 'completed' || s === 'paid';
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingCount = payments.filter((p) => {
    const s = (p.paymentStatus || p.status || '').toLowerCase();
    return s === 'pending';
  }).length;

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <CreditCard size={13} />
            <span>Escrow & Rewards</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Payment History
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track all reward payments and escrow transactions across your matches.
          </p>
        </div>
        <button
          onClick={() => fetchPayments(true)}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Transactions',
            value: payments.length,
            icon: CreditCard,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/60',
          },
          {
            label: 'Total Amount Paid',
            value: `₹${totalPaid.toLocaleString('en-IN')}`,
            icon: IndianRupee,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          },
          {
            label: 'Pending Payments',
            value: pendingCount,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/60',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{card.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">All Transactions</h2>
          </div>
          <span className="text-xs font-medium text-slate-400">{payments.length} records</span>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Package size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">No payments yet</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Reward payments will appear here once a match reaches the payment stage.
              </p>
            </div>
            <Link
              to="/matches"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              View Matches <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((payment) => {
              const payer = payment.lostUserId || payment.userId;
              const finder = payment.foundUserId || payment.finderId;
              const statusStr = payment.paymentStatus || payment.status || 'unknown';
              const isPaid =
                (statusStr as string).toLowerCase() === 'success' ||
                (statusStr as string).toLowerCase() === 'completed' ||
                (statusStr as string).toLowerCase() === 'paid';

              return (
                <div
                  key={payment._id}
                  className={`flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between ${
                    isPaid ? '' : 'opacity-80'
                  }`}
                >
                  {/* Left section */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <IndianRupee size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        Reward Payment
                        {payment.razorpayPaymentId && (
                          <span className="ml-2 font-mono text-[10px] text-slate-400">
                            #{payment.razorpayPaymentId.slice(-8)}
                          </span>
                        )}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                        {payer && typeof payer === 'object' && 'name' in payer && (
                          <span>From: <span className="font-semibold text-slate-600 dark:text-slate-300">{(payer as { name: string }).name}</span></span>
                        )}
                        {finder && typeof finder === 'object' && 'name' in finder && (
                          <span>→ To: <span className="font-semibold text-slate-600 dark:text-slate-300">{(finder as { name: string }).name}</span></span>
                        )}
                        <span>{new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {payment.paidAt && (
                          <span className="text-emerald-500">
                            Paid {new Date(payment.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right section */}
                  <div className="flex shrink-0 items-center gap-4 sm:pl-4">
                    <div className="text-right">
                      <p className={`text-base font-black ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        ₹{(payment.amount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <StatusBadge status={statusStr as string} />
                    {payment.matchId && (
                      <Link
                        to={`/matches/${payment.matchId}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-600 transition dark:border-slate-700 dark:bg-slate-800"
                        title="View Match"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    )}
                    {isPaid && (
                      <button
                        onClick={() => handleDownloadReceipt(payment._id)}
                        disabled={downloadingId === payment._id}
                        title="Download Receipt"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                      >
                        {downloadingId === payment._id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export — routes to either callback page or history ──────────────────
export default function PaymentsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isCallback =
    location.pathname.includes('/confirm') ||
    location.pathname.includes('/success') ||
    searchParams.get('paymentId') !== null;

  return (
    <PageTransition className="py-4 pb-16">
      {isCallback ? <PaymentCallbackPage /> : <PaymentHistoryPage />}
    </PageTransition>
  );
}
