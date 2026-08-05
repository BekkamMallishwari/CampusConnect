import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  User,
  ArrowRight,
  XCircle,
  Eye,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import { matchesApi, type MatchType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import RewardPayment from '../components/RewardPayment';
import { PortalSection, AvatarBadge, PortalBadge, getPrimaryImage } from '../components/portal';

// ─── Status helpers ──────────────────────────────────────────────────────────

function getStatusConfig(matchStatus: MatchType['matchStatus'], ownerAccepted: boolean, finderAccepted: boolean) {
  if (matchStatus === 'Rejected') return { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' };
  if (matchStatus === 'Confirmed' || matchStatus === 'CONFIRMED') return { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (matchStatus === 'Completed') return { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (matchStatus === 'PAYMENT_COMPLETED') return { label: 'Payment Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (matchStatus === 'PENDING_PAYMENT') return { label: 'Awaiting Payment', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (matchStatus === 'HANDOVER_COMPLETED') return { label: 'Handover Done', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (matchStatus === 'Verified') return { label: 'Verified', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (ownerAccepted && finderAccepted) return { label: 'Both Accepted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (ownerAccepted) return { label: 'Owner Accepted', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (finderAccepted) return { label: 'Finder Accepted', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Pending Review', color: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function ConfidenceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'from-emerald-500 to-emerald-400' : pct >= 60 ? 'from-blue-600 to-cyan-500' : 'from-amber-500 to-orange-400';
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[3.5rem] text-right text-xs font-extrabold text-[#1E3A8A]">{pct}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      const res = await matchesApi.getAll();
      setMatches(res.data.matches);
    } catch {
      toast.error('Failed to load matching records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);



  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to dismiss this match?')) return;
    try {
      await matchesApi.reject(id);
      toast.success('Match dismissed.');
      fetchMatches();
    } catch {
      toast.error('Failed to decline match.');
    }
  };

  const handleConfirmHandover = async (id: string) => {
    setConfirmLoading(id);
    try {
      await matchesApi.confirmHandover(id);
      toast.success('Handover confirmation recorded!');
      fetchMatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record handover confirmation.');
    } finally {
      setConfirmLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const pendingCount = matches.filter(
    (m) => m.matchStatus === 'Pending' || m.matchStatus === 'Owner Accepted' || m.matchStatus === 'Finder Accepted',
  ).length;

  return (
    <PageTransition className="space-y-8 py-2 pb-16">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <PortalSection
        eyebrow="AI-Powered Matching"
        title={`Detected Matches${pendingCount > 0 ? ` (${pendingCount} Pending Review)` : ''}`}
        description="Potential item overlaps detected by our AI similarity engine. Review each match and accept or reject to proceed."
      >
        {/* Summary stat pills */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total', value: matches.length, color: 'bg-slate-100 text-slate-700' },
            { label: 'Pending', value: pendingCount, color: 'bg-amber-50 text-amber-700 border border-amber-200' },
            {
              label: 'Confirmed',
              value: matches.filter((m) => m.matchStatus === 'Confirmed' || m.matchStatus === 'CONFIRMED' || m.matchStatus === 'Completed').length,
              color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl px-4 py-2 text-sm font-semibold ${stat.color}`}>
              <span className="font-black">{stat.value}</span> {stat.label}
            </div>
          ))}
        </div>
      </PortalSection>

      {/* ── Empty State ─────────────────────────────────────────── */}
      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Sparkles size={28} className="text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">No matches detected yet</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              The AI similarity engine runs automatically when items are reported.
            </p>
          </div>
          <Link
            to="/lost-items/new"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#2563EB] transition"
          >
            Report a Lost Item <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => {
            const isOwner = match.lostUserId._id === user?.id;
            const isFinder = match.foundUserId._id === user?.id;

            const ownerAccepted = Boolean(match.ownerAccepted || match.lostUserAccepted);
            const finderAccepted = Boolean(match.finderAccepted || match.foundUserAccepted);
            const currentUserAccepted = isOwner ? ownerAccepted : finderAccepted;

            const statusConfig = getStatusConfig(match.matchStatus, ownerAccepted, finderAccepted);

            // Legacy status checks (preserved)
            const isMatchPending =
              match.matchStatus === 'Pending' ||
              match.matchStatus === 'PossibleMatch' ||
              match.matchStatus === 'LostUserVerified' ||
              match.matchStatus === 'Owner Accepted' ||
              match.matchStatus === 'Finder Accepted';
            const isMatchConfirmed = match.matchStatus === 'CONFIRMED' || match.matchStatus === 'PENDING_PAYMENT';
            const isPaymentCompleted = match.matchStatus === 'PAYMENT_COMPLETED';
            const isHandoverCompleted =
              match.matchStatus === 'HANDOVER_COMPLETED' ||
              match.matchStatus === 'Verified' ||
              match.matchStatus === 'Accepted';
            const isBothAccepted =
              (ownerAccepted && finderAccepted) ||
              match.matchStatus === 'Confirmed' ||
              match.matchStatus === 'CONFIRMED';
            const isConfirmed =
              isBothAccepted ||
              match.matchStatus === 'Completed' ||
              isPaymentCompleted ||
              isHandoverCompleted;
            const isRejected = match.matchStatus === 'Rejected';
            const isChatEnabled = isMatchConfirmed || isPaymentCompleted || isHandoverCompleted || isBothAccepted;
            const showContactDetails = match.contactShared || isPaymentCompleted || isHandoverCompleted;

            const lostImage = getPrimaryImage(match.lostItemId as any);
            const foundImage = getPrimaryImage(match.foundItemId as any);

            return (
              <div
                key={match._id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  isRejected
                    ? 'border-slate-200 opacity-70'
                    : isMatchPending && !currentUserAccepted
                    ? 'border-blue-200 ring-2 ring-blue-500/10'
                    : 'border-slate-200'
                }`}
              >
                {/* ── Card Top Bar ─────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* AI confidence badge */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E3A8A] px-3 py-1 text-[11px] font-bold text-white">
                      <TrendingUp size={12} /> {match.matchPercentage}% Match
                    </span>

                    {/* Status badge */}
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>

                    {/* User's own acceptance indicator */}
                    {isMatchPending && !isRejected && (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          currentUserAccepted
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {currentUserAccepted ? (
                          <>
                            <Check size={11} className="mr-1 inline" />
                            You Accepted
                          </>
                        ) : (
                          <>
                            <Clock size={11} className="mr-1 inline" />
                            Awaiting Your Review
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Match ID */}
                  <code className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-mono text-slate-500">
                    #{match._id.slice(-8)}
                  </code>
                </div>

                {/* ── Confidence Bar ───────────────────────────── */}
                <div className="border-b border-slate-100 px-6 py-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
                    <span>AI Confidence Score</span>
                    <span className="text-[#1E3A8A]">{match.matchPercentage >= 80 ? 'High Confidence' : match.matchPercentage >= 60 ? 'Medium Confidence' : 'Low Confidence'}</span>
                  </div>
                  <ConfidenceBar pct={match.matchPercentage} />
                </div>

                {/* ── Item Comparison Grid ─────────────────────── */}
                <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
                  {/* Lost Item */}
                  <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50/30 p-4">
                    {lostImage ? (
                      <img
                        src={lostImage}
                        alt={match.lostItemId.itemName}
                        className="h-16 w-16 shrink-0 rounded-xl border border-red-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-100 text-red-400">
                        <AlertCircle size={24} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <PortalBadge tone="danger" className="mb-1 text-[10px]">Lost Item</PortalBadge>
                      <Link to={`/lost-items/${match.lostItemId._id}`} className="block text-sm font-bold text-[#0F172A] hover:underline line-clamp-1">
                        {match.lostItemId.itemName}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-[#64748B] line-clamp-2">{match.lostItemId.description}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <AvatarBadge name={match.lostUserId.name} avatar={match.lostUserId.avatar} size="sm" />
                        <span className="text-[11px] text-[#64748B]">{match.lostUserId.name}</span>
                        {ownerAccepted && <CheckCircle2 size={13} className="ml-1 text-emerald-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Found Item */}
                  <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                    {foundImage ? (
                      <img
                        src={foundImage}
                        alt={match.foundItemId.itemName}
                        className="h-16 w-16 shrink-0 rounded-xl border border-emerald-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-100 text-emerald-400">
                        <CheckCircle2 size={24} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <PortalBadge tone="success" className="mb-1 text-[10px]">Found Item</PortalBadge>
                      <Link to={`/found-items/${match.foundItemId._id}`} className="block text-sm font-bold text-[#0F172A] hover:underline line-clamp-1">
                        {match.foundItemId.itemName}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-[#64748B] line-clamp-2">{match.foundItemId.description}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <AvatarBadge name={match.foundUserId.name} avatar={match.foundUserId.avatar} size="sm" />
                        <span className="text-[11px] text-[#64748B]">{match.foundUserId.name}</span>
                        {finderAccepted && <CheckCircle2 size={13} className="ml-1 text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Integrated Reward Payment ─ only shown after reward is Accepted ——─ */}
                {isMatchConfirmed && isOwner && (match.rewardStatus === 'Accepted' || (!match.rewardStatus || match.rewardStatus === 'None')) && (
                  <div className="border-t border-slate-100 px-6 pb-5">
                    <RewardPayment
                      matchId={match._id}
                      defaultAmount={match.rewardAmount || match.lostItemId?.rewardAmount || 0}
                      finderName={match.foundUserId.name}
                      itemName={match.lostItemId.itemName}
                      onPaymentSuccess={fetchMatches}
                    />
                  </div>
                )}

                {/* ── Handover Complete Banner (legacy preserved) ─── */}
                {isHandoverCompleted && (
                  <div className="mx-6 mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Item handover confirmed and returned successfully
                    </span>
                  </div>
                )}

                {/* ── Unlocked Contact Info (legacy preserved) ──── */}
                {showContactDetails && match.contactShared && (
                  <div className="mx-6 mb-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                      <CheckCircle2 size={15} /> Verified Handover Details & Unlocked Contacts
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-500" />
                        <span>
                          {isOwner ? 'Finder: ' : 'Owner: '}
                          <strong className="text-slate-950">
                            {isOwner ? match.foundUserId.name : match.lostUserId.name}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-500" />
                        <span>{isOwner ? match.foundUserId.email : match.lostUserId.email}</span>
                      </div>
                      {(isOwner ? match.foundUserId.phone : match.lostUserId.phone) && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <Phone size={14} className="text-slate-500" />
                          <span>Phone: {isOwner ? match.foundUserId.phone : match.lostUserId.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Action Footer ─────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <Clock size={12} />
                    {new Date(match.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* PRIMARY CTA — Review Match (for pending/partial accepted) */}
                    {isMatchPending && !isRejected && (
                      <>
                        <Link
                          to={`/matches/${match._id}`}
                          id={`review-match-${match._id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#2563EB] transition"
                        >
                          <Eye size={14} />
                          {currentUserAccepted ? 'View Match Details' : 'Review Match'}
                          <ArrowRight size={13} />
                        </Link>

                        {/* Quick Reject (only if not already accepted) */}
                        {!currentUserAccepted && !isRejected && (
                          <button
                            onClick={() => handleReject(match._id)}
                            disabled={confirmLoading === match._id}
                            id={`reject-match-${match._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#EF4444] hover:bg-red-50 transition disabled:opacity-50"
                          >
                            <XCircle size={13} /> Dismiss
                          </button>
                        )}
                      </>
                    )}

                    {/* View Details for confirmed/completed matches */}
                    {isConfirmed && !isMatchPending && (
                      <Link
                        to={`/matches/${match._id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-[#1E3A8A] hover:bg-blue-100 transition"
                      >
                        <Eye size={13} /> View Details
                      </Link>
                    )}

                    {/* Chat button for confirmed matches */}
                    {isChatEnabled && (
                      <Link
                        to="/chats"
                        id={`open-chat-${match._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <MessageSquare size={13} /> Open Chat
                      </Link>
                    )}

                    {/* Legacy: Payment stage actions */}
                    {isPaymentCompleted && isOwner && !match.lostUserHandover && (
                      <button
                        onClick={() => handleConfirmHandover(match._id)}
                        disabled={confirmLoading === match._id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        <CheckCircle2 size={13} />
                        {confirmLoading === match._id ? 'Confirming…' : 'Confirm Handover'}
                      </button>
                    )}

                    {isPaymentCompleted && isFinder && !match.foundUserHandover && (
                      <button
                        onClick={() => handleConfirmHandover(match._id)}
                        disabled={confirmLoading === match._id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        <CheckCircle2 size={13} />
                        {confirmLoading === match._id ? 'Confirming…' : 'Confirm Handover'}
                      </button>
                    )}

                    {/* Rejected state */}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500">
                        <XCircle size={13} /> Dismissed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
