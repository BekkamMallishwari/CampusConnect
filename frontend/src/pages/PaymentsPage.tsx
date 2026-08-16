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
      <div className="glass-panel w-full max-w-md p-8 text-center shadow-2xl space-y-6">
        {status === 'verifying' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Loader2 className="animate-spin" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                Verifying Payment…
              </h2>
              <p className="mt-2 text-xs sm:text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
                Confirming transaction with payment gateway. Please do not close or reload this page.
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                Payment Successful!
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
                Your reward payment has been verified and credited to the finder. Handover contact details are now unlocked.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {matchId && (
                <Link
                  to={`/matches/${matchId}`}
                  className="dash-btn-primary w-full py-3 text-xs font-bold shadow-md"
                >
                  <span>View Match Details</span> <ArrowRight size={14} />
                </Link>
              )}
              <Link
                to="/payments"
                className="dash-btn-secondary w-full py-2.5 text-xs font-bold"
              >
                Payment History
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                Verification Failed
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
                We couldn't confirm your transaction. If this was a mistake, please retry from the match chat page.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/matches"
                className="dash-btn-primary w-full py-3 text-xs font-bold"
              >
                Go to Matches
              </Link>
              <Link
                to="/dashboard"
                className="dash-btn-secondary w-full py-2.5 text-xs font-bold"
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
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
        <CheckCircle2 size={11} /> Paid
      </span>
    );
  if (s === 'pending')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
        <Clock size={11} /> Pending
      </span>
    );
  if (s === 'failed')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-600">
        <AlertTriangle size={11} /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/20 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 pb-24">
      {/* Hero Header */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <CreditCard size={12} /> Escrow & Ledger
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              Payment History
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              Track all verified reward payments and escrow settlements across your lost & found handovers.
            </p>
          </div>
          <button
            onClick={() => fetchPayments(true)}
            disabled={refreshing}
            className="dash-btn-secondary shrink-0 py-2.5 px-4 text-xs font-bold"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Transactions',
            value: payments.length,
            icon: CreditCard,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
          },
          {
            label: 'Total Amount Paid',
            value: `₹${totalPaid.toLocaleString('en-IN')}`,
            icon: IndianRupee,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Pending Payouts',
            value: pendingCount,
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-stat-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>{card.label}</p>
                  <p className="mt-1 text-2xl font-black" style={{ color: 'var(--dash-text-primary)' }}>{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.bg} ${card.color} shadow-xs`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions Table Panel */}
      <div className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-indigo-500" />
            <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>All Transactions</h2>
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--dash-text-muted)' }}>{payments.length} records</span>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="dash-empty-icon h-14 w-14 rounded-2xl">
              <Package size={26} style={{ color: 'var(--dash-accent)' }} />
            </div>
            <div>
              <p className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>No payments yet</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                Reward payments will appear here once an item handover is confirmed.
              </p>
            </div>
            <Link
              to="/matches"
              className="dash-btn-primary mt-2 py-2 px-4 text-xs font-bold"
            >
              View Matches <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
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
                  className="glass-table-row flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ opacity: isPaid ? 1 : 0.8 }}
                >
                  {/* Left section */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isPaid
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      <IndianRupee size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>
                        Reward Payment
                        {payment.razorpayPaymentId && (
                          <span className="ml-2 font-mono text-[10.5px]" style={{ color: 'var(--dash-text-muted)' }}>
                            #{payment.razorpayPaymentId.slice(-8)}
                          </span>
                        )}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                        {payer && typeof payer === 'object' && 'name' in payer && (
                          <span>From: <strong style={{ color: 'var(--dash-text-primary)' }}>{(payer as { name: string }).name}</strong></span>
                        )}
                        {finder && typeof finder === 'object' && 'name' in finder && (
                          <span>→ To: <strong style={{ color: 'var(--dash-text-primary)' }}>{(finder as { name: string }).name}</strong></span>
                        )}
                        <span>{new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right section */}
                  <div className="flex shrink-0 items-center gap-3 sm:pl-4">
                    <div className="text-right">
                      <p className={`text-sm sm:text-base font-black ${isPaid ? 'text-emerald-600' : ''}`} style={{ color: isPaid ? undefined : 'var(--dash-text-primary)' }}>
                        ₹{(payment.amount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <StatusBadge status={statusStr as string} />
                    {payment.matchId && (
                      <Link
                        to={`/matches/${payment.matchId}`}
                        className="footer-contact-icon-btn rounded-xl p-2"
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
                        className="footer-contact-icon-btn rounded-xl p-2 text-emerald-600"
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

export default function PaymentsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isCallback =
    location.pathname.includes('/confirm') ||
    location.pathname.includes('/success') ||
    searchParams.get('paymentId') !== null;

  return (
    <PageTransition className="py-2 pb-16">
      {isCallback ? <PaymentCallbackPage /> : <PaymentHistoryPage />}
    </PageTransition>
  );
}
