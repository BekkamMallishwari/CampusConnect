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
  ShieldCheck,
} from 'lucide-react';
import { matchesApi, type MatchType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import { AvatarBadge, PortalBadge, getPrimaryImage } from '../components/portal';

// ─── Status helpers ──────────────────────────────────────────────────────────

function getStatusConfig(matchStatus: MatchType['matchStatus'], ownerAccepted: boolean, finderAccepted: boolean) {
  if (matchStatus === 'Rejected') return { label: 'Rejected', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
  if (matchStatus === 'Confirmed' || matchStatus === 'CONFIRMED') return { label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  if (matchStatus === 'Completed') return { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  if (matchStatus === 'PAYMENT_COMPLETED') return { label: 'Payment Completed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  if (matchStatus === 'PENDING_PAYMENT') return { label: 'Awaiting Payment', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
  if (matchStatus === 'HANDOVER_COMPLETED') return { label: 'Handover Done', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  if (matchStatus === 'Verified') return { label: 'Verified', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' };
  if (ownerAccepted && finderAccepted) return { label: 'Both Accepted', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  if (ownerAccepted) return { label: 'Owner Accepted', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
  if (finderAccepted) return { label: 'Finder Accepted', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
  return { label: 'Pending Review', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20' };
}

function ConfidenceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'from-emerald-500 to-teal-400' : pct >= 60 ? 'from-indigo-500 to-purple-500' : 'from-amber-500 to-orange-400';
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[3rem] text-right text-xs font-black" style={{ color: 'var(--dash-text-primary)' }}>{pct}%</span>
    </div>
  );
}

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingSpinner />;

  const pendingCount = matches.filter(
    (m) => m.matchStatus === 'Pending' || m.matchStatus === 'Owner Accepted' || m.matchStatus === 'Finder Accepted',
  ).length;

  return (
    <PageTransition className="space-y-6 py-2 pb-20">
      {/* 1. Hero Glass Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Sparkles size={12} /> AI Similarity Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              Detected Matches {pendingCount > 0 && `(${pendingCount} Pending Review)`}
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              Potential lost & found overlaps detected by our multimodal similarity engine. Review each match pair to confirm ownership and coordinate handover.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {[
              { label: 'Total Matches', value: matches.length, bg: 'rgba(99,102,241,0.08)', text: 'var(--dash-accent)' },
              { label: 'Pending', value: pendingCount, bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
              {
                label: 'Confirmed',
                value: matches.filter((m) => m.matchStatus === 'Confirmed' || m.matchStatus === 'CONFIRMED' || m.matchStatus === 'Completed').length,
                bg: 'rgba(16,185,129,0.1)',
                text: '#10b981',
              },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel px-3.5 py-2 text-center" style={{ background: stat.bg }}>
                <span className="text-base font-black block" style={{ color: stat.text }}>{stat.value}</span>
                <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Matches List / Empty State */}
      {matches.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center p-14 text-center">
          <div className="dash-empty-icon mb-3 h-14 w-14 rounded-2xl">
            <Sparkles size={24} style={{ color: 'var(--dash-accent)' }} />
          </div>
          <h3 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>No matches detected yet</h3>
          <p className="mt-1 max-w-sm text-xs sm:text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
            The AI similarity engine automatically compares title, category, visual features, and location when new items are reported.
          </p>
          <Link
            to="/lost-items/new"
            className="dash-btn-primary mt-5 py-2.5 px-5 text-xs font-bold shadow-md"
          >
            Report a Lost Item <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {matches.map((match) => {
            const isOwner = match.lostUserId._id === user?.id;

            const ownerAccepted = Boolean(match.ownerAccepted || match.lostUserAccepted);
            const finderAccepted = Boolean(match.finderAccepted || match.foundUserAccepted);
            const currentUserAccepted = isOwner ? ownerAccepted : finderAccepted;

            const statusConfig = getStatusConfig(match.matchStatus, ownerAccepted, finderAccepted);

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
                className="glass-panel overflow-hidden transition-all duration-200 hover:shadow-lg"
                style={{ opacity: isRejected ? 0.7 : 1 }}
              >
                {/* Top header bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5" style={{ borderColor: 'var(--glass-border)', background: 'rgba(99,102,241,0.03)' }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      <TrendingUp size={11} /> {match.matchPercentage}% Match
                    </span>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>

                    {isMatchPending && !isRejected && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          currentUserAccepted
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-600'
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

                  <code className="rounded-md px-2 py-0.5 text-[10px] font-mono" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--dash-text-muted)' }}>
                    #{match._id.slice(-8)}
                  </code>
                </div>

                {/* AI Confidence Bar */}
                <div className="border-b px-5 py-3" style={{ borderColor: 'var(--glass-border)' }}>
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5" style={{ color: 'var(--dash-text-muted)' }}>
                    <span>Confidence Level</span>
                    <span style={{ color: 'var(--dash-accent)' }}>
                      {match.matchPercentage >= 80 ? 'High Confidence (Verified overlap)' : match.matchPercentage >= 60 ? 'Moderate Similarity' : 'Low Similarity'}
                    </span>
                  </div>
                  <ConfidenceBar pct={match.matchPercentage} />
                </div>

                {/* Side-by-side Items Comparison Grid */}
                <div className="grid gap-4 p-5 md:grid-cols-2">
                  {/* Lost Item Card */}
                  <div className="flex gap-3 rounded-2xl p-3.5" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.18)' }}>
                    {lostImage ? (
                      <img
                        src={lostImage}
                        alt={match.lostItemId.itemName}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                        <AlertCircle size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <PortalBadge tone="danger" className="mb-1 text-[9.5px]">Lost Item</PortalBadge>
                      <Link to={`/lost-items/${match.lostItemId._id}`} className="block text-xs sm:text-sm font-bold hover:underline line-clamp-1" style={{ color: 'var(--dash-text-primary)' }}>
                        {match.lostItemId.itemName}
                      </Link>
                      <p className="mt-0.5 text-[11px] line-clamp-2" style={{ color: 'var(--dash-text-secondary)' }}>{match.lostItemId.description}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <AvatarBadge name={match.lostUserId.name} avatar={match.lostUserId.avatar} size="sm" />
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-muted)' }}>{match.lostUserId.name}</span>
                        {ownerAccepted && <CheckCircle2 size={12} className="text-emerald-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Found Item Card */}
                  <div className="flex gap-3 rounded-2xl p-3.5" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.18)' }}>
                    {foundImage ? (
                      <img
                        src={foundImage}
                        alt={match.foundItemId.itemName}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <PortalBadge tone="success" className="mb-1 text-[9.5px]">Found Item</PortalBadge>
                      <Link to={`/found-items/${match.foundItemId._id}`} className="block text-xs sm:text-sm font-bold hover:underline line-clamp-1" style={{ color: 'var(--dash-text-primary)' }}>
                        {match.foundItemId.itemName}
                      </Link>
                      <p className="mt-0.5 text-[11px] line-clamp-2" style={{ color: 'var(--dash-text-secondary)' }}>{match.foundItemId.description}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <AvatarBadge name={match.foundUserId.name} avatar={match.foundUserId.avatar} size="sm" />
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-muted)' }}>{match.foundUserId.name}</span>
                        {finderAccepted && <CheckCircle2 size={12} className="text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Handover Done Banner */}
                {isHandoverCompleted && (
                  <div className="mx-5 mb-4 flex items-center gap-2.5 rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <ShieldCheck size={16} />
                    <span>Item handover confirmed and safely returned!</span>
                  </div>
                )}

                {/* Unlocked Contact Details */}
                {showContactDetails && match.contactShared && (
                  <div className="mx-5 mb-4 rounded-xl p-4 space-y-2 border" style={{ borderColor: 'var(--glass-border)', background: 'rgba(99,102,241,0.05)' }}>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      <ShieldCheck size={14} /> Verified Handover Details & Direct Contact
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs" style={{ color: 'var(--dash-text-primary)' }}>
                      <div className="flex items-center gap-2">
                        <User size={13} style={{ color: 'var(--dash-text-muted)' }} />
                        <span>
                          {isOwner ? 'Finder: ' : 'Owner: '}
                          <strong>{isOwner ? match.foundUserId.name : match.lostUserId.name}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} style={{ color: 'var(--dash-text-muted)' }} />
                        <span>{isOwner ? match.foundUserId.email : match.lostUserId.email}</span>
                      </div>
                      {(isOwner ? match.foundUserId.phone : match.lostUserId.phone) && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <Phone size={13} style={{ color: 'var(--dash-text-muted)' }} />
                          <span>Phone: {isOwner ? match.foundUserId.phone : match.lostUserId.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5" style={{ borderColor: 'var(--glass-border)', background: 'rgba(99,102,241,0.02)' }}>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                    <Clock size={12} />
                    <span>{new Date(match.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isMatchPending && !isRejected && (
                      <>
                        <Link
                          to={`/matches/${match._id}`}
                          id={`review-match-${match._id}`}
                          className="dash-btn-primary py-2 px-4 text-xs font-bold"
                        >
                          <Eye size={13} />
                          <span>{currentUserAccepted ? 'View Match Details' : 'Review Match'}</span>
                          <ArrowRight size={12} />
                        </Link>

                        {!currentUserAccepted && (
                          <button
                            onClick={() => handleReject(match._id)}
                            id={`reject-match-${match._id}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                          >
                            <XCircle size={13} /> Dismiss
                          </button>
                        )}
                      </>
                    )}

                    {isConfirmed && !isMatchPending && (
                      <Link
                        to={`/matches/${match._id}`}
                        className="dash-btn-secondary py-2 px-4 text-xs font-bold"
                      >
                        <Eye size={13} /> View Details
                      </Link>
                    )}

                    {isChatEnabled && (
                      <Link
                        to="/chats"
                        id={`open-chat-${match._id}`}
                        className="dash-btn-primary py-2 px-4 text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                      >
                        <MessageSquare size={13} /> Open Chat
                      </Link>
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
