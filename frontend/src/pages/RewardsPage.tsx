import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Gift,
  Medal,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { paymentsApi, rewardsApi, type PaymentType, type UserType } from '../lib/api';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/ui/EmptyState';
import { AvatarBadge, PortalBadge, PortalProgress } from '../components/portal';

const isSuccessfulPayment = (payment: PaymentType) => ['SUCCESS', 'Completed', 'Paid'].includes(payment.paymentStatus || payment.status || '');

const formatAmount = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatPaymentDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusTone = (status: string) => {
  if (['SUCCESS', 'Completed', 'Paid'].includes(status)) return 'success' as const;
  if (['PENDING', 'PROCESSING', 'WAITING', 'Pending'].includes(status)) return 'warning' as const;
  return 'neutral' as const;
};

function leaderboardRole(user: UserType) {
  if (user.role === 'admin') return 'Admin';
  return user.department || user.year || 'Student';
}

export default function RewardsPage() {
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const [paymentsRes, leaderboardRes] = await Promise.all([
          paymentsApi.getAll(),
          rewardsApi.getLeaderboard().catch(() => null),
        ]);
        setPayments(paymentsRes.data.payments || []);
        setLeaderboard(leaderboardRes?.data.leaderboard || []);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const successfulPayments = useMemo(() => payments.filter(isSuccessfulPayment), [payments]);
  const totalDisbursed = useMemo(
    () => successfulPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    [successfulPayments],
  );
  const topScore = leaderboard[0]?.points || 0;
  const maxPoints = Math.max(1, ...leaderboard.map((student) => student.points || 0));
  const topPlayers = leaderboard.slice(0, 8);

  const summaryCards = [
    {
      label: 'Top Karma Score',
      value: topScore,
      description: 'Current leaderboard champion',
      icon: Trophy,
      accent: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      label: 'Payout Ratio',
      value: `${successfulPayments.length}/${payments.length || 0}`,
      description: 'Verified payouts completed',
      icon: ShieldCheck,
      accent: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      label: 'Total Disbursed',
      value: formatAmount(totalDisbursed),
      description: 'Total rewards distributed',
      icon: ReceiptText,
      accent: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      label: 'Ranked Students',
      value: leaderboard.length,
      description: 'Campus contributors',
      icon: Medal,
      accent: 'linear-gradient(135deg, #ec4899, #be185d)',
    },
  ];

  return (
    <PageTransition className="space-y-6 py-2 pb-24">
      {/* 1. Hero Glass Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Sparkles size={12} /> Community Karma
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              Rewards & Leaderboards
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              Explore top campus contributors, track verified escrow payouts, and celebrate community integrity.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="glass-panel px-4 py-2.5 text-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <span className="text-lg font-black block" style={{ color: 'var(--dash-accent)' }}>{formatAmount(totalDisbursed)}</span>
              <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Disbursed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={`${card.label}-${index}`} className="glass-stat-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>{card.label}</p>
                  <p className="mt-1 text-2xl font-black" style={{ color: 'var(--dash-text-primary)' }}>{card.value}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>{card.description}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md" style={{ background: card.accent }}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. Split: Leaderboard & Payouts */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Left: Leaderboard */}
        <div className="glass-panel p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Hall of Fame</p>
              <h2 className="text-lg font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Top Contributors</h2>
            </div>
            <PortalBadge tone="warning">
              <Trophy size={12} /> Campus Rankings
            </PortalBadge>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : topPlayers.length === 0 ? (
              <EmptyState
                title="No leaderboard data yet"
                description="Points will appear once campus members report and return items."
              />
            ) : (
              topPlayers.map((student, index) => {
                const points = student.points || 0;
                const progress = Math.max(8, Math.round((points / maxPoints) * 100));
                const rankTone =
                  index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : index === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : index === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)';

                return (
                  <div
                    key={`${student.id}-${index}`}
                    className="glass-action-card p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs" style={{ background: rankTone }}>
                          {index + 1}
                        </div>
                        <AvatarBadge name={student.name} avatar={student.avatar} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-xs sm:text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>{student.name}</p>
                          <p className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{leaderboardRole(student)}</p>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-xs font-extrabold" style={{ color: 'var(--dash-accent)' }}>{points} pts</span>
                      </div>
                    </div>

                    <div>
                      <PortalProgress value={progress} tone={index === 0 ? 'warning' : index === 1 ? 'neutral' : 'primary'} />
                    </div>

                    {student.badges && student.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {student.badges.slice(0, 3).map((badge, badgeIndex) => (
                          <span key={`${badge}-${badgeIndex}`} className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-bold" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--dash-accent)' }}>
                            <Medal size={10} /> {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Payout History */}
        <div className="glass-panel p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Transactions</p>
              <h2 className="text-lg font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Verified Payout History</h2>
            </div>
            <PortalBadge tone="success">
              <Gift size={12} /> Escrow Settled
            </PortalBadge>
          </div>

          <div className="space-y-3">
            {payments.length === 0 ? (
              <EmptyState
                title="No reward transactions"
                description="Completed item handovers will automatically appear in this ledger."
              />
            ) : (
              payments.slice(0, 8).map((payment, index) => {
                const status = payment.paymentStatus || payment.status || 'PENDING';
                const isSuccess = isSuccessfulPayment(payment);
                const statusTone = getStatusTone(status);
                const displayOrder = payment.razorpayOrderId || payment._id.slice(0, 12);

                return (
                  <div
                    key={`${payment._id}-${index}`}
                    className="glass-action-card p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isSuccess ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>Item handover reward</p>
                          <p className="text-[11px] font-mono" style={{ color: 'var(--dash-text-muted)' }}>
                            {displayOrder} • {formatPaymentDate(payment.paidAt || payment.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-black" style={{ color: 'var(--dash-text-primary)' }}>{formatAmount(payment.amount || 0)}</p>
                        <PortalBadge tone={statusTone} className="mt-0.5 text-[9.5px]">
                          {status}
                        </PortalBadge>
                      </div>
                    </div>

                    {payment.receiptUrl && (
                      <div className="border-t pt-2" style={{ borderColor: 'var(--glass-border)' }}>
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold"
                          style={{ color: 'var(--dash-accent)' }}
                        >
                          <ReceiptText size={13} />
                          <span>Open receipt</span>
                          <ArrowRight size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
