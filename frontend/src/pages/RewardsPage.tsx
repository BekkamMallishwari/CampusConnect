import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock, Gift, ReceiptText, ShieldCheck, Trophy, Medal } from 'lucide-react';
import { paymentsApi, rewardsApi, type PaymentType, type UserType } from '../lib/api';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import { AvatarBadge, PortalBadge, PortalCard, PortalProgress, PortalSection } from '../components/portal';

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

  const totalDisbursed = useMemo(
    () =>
      payments
        .filter((payment) => ['SUCCESS', 'Completed', 'Paid'].includes(payment.paymentStatus || payment.status || ''))
        .reduce((sum, payment) => sum + (payment.amount || 0), 0),
    [payments],
  );

  const topPlayers = leaderboard.slice(0, 6);

  return (
    <PageTransition className="space-y-8 py-4 pb-16">
      <PortalSection
        eyebrow="Rewards"
        title="Rewards and leaderboards"
        description="A polished view of verified payouts, achievement progress, and the students driving campus recovery forward."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PortalCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Total settled</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">₹{totalDisbursed.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Verified handover payouts</p>
          </PortalCard>
          <PortalCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Your points</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{leaderboard[0]?.points || 0}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live leaderboard source</p>
          </PortalCard>
          <PortalCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Payouts</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{payments.length}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real transaction history</p>
          </PortalCard>
          <PortalCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Reward flow</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Active</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Connected to payments and chat</p>
          </PortalCard>
        </div>
      </PortalSection>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PortalCard className="p-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Leaderboard</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Top contributors</h2>
            </div>
            <PortalBadge tone="warning">
              <Trophy size={12} />
              Campus rankings
            </PortalBadge>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-800" />
              </div>
            ) : topPlayers.length === 0 ? (
              <EmptyState
                title="No leaderboard yet"
                description="Points will appear once students start reporting and returning items."
              />
            ) : (
              topPlayers.map((student, index) => (
                <div key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-white">
                      {index + 1}
                    </div>
                    <AvatarBadge name={student.name} avatar={student.avatar} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{student.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.points || 0} points</p>
                    </div>
                    <div className="min-w-[140px]">
                      <PortalProgress value={Math.min(100, student.points || 0)} tone={index === 0 ? 'success' : 'primary'} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(student.badges || []).slice(0, 3).map((badge) => (
                      <PortalBadge key={badge} tone="accent">
                        <Medal size={11} />
                        {badge}
                      </PortalBadge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </PortalCard>

        <PortalCard className="p-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Payments</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Verified payout history</h2>
            </div>
            <PortalBadge tone="primary">
              <Gift size={12} />
              Live
            </PortalBadge>
          </div>

          <div className="mt-5 space-y-3">
            {payments.length === 0 ? (
              <EmptyState
                title="No reward transactions"
                description="Completed handovers will automatically appear here."
              />
            ) : (
              payments.slice(0, 8).map((payment) => {
                const status = payment.paymentStatus || payment.status || 'PENDING';
                const isSuccess = ['SUCCESS', 'Completed', 'Paid'].includes(status);

                return (
                  <div key={payment._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isSuccess ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                          {isSuccess ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">Item handover reward</p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {payment.razorpayOrderId || payment._id.substring(0, 12)} • {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">₹{payment.amount.toLocaleString()}</p>
                        <PortalBadge tone={isSuccess ? 'success' : 'warning'}>{status}</PortalBadge>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                      {payment.receiptUrl ? (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                          <ReceiptText size={15} />
                          Receipt
                          <ArrowUpRight size={14} />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                          <ShieldCheck size={15} />
                          Verified handover
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PortalCard>
      </section>
    </PageTransition>
  );
}
