import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  MapPin,
  Calendar,
  Tag,
  AlertCircle,
  Check,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react';
import { matchesApi, type MatchType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import { AvatarBadge, PortalBadge } from '../components/portal';
import RewardPayment from '../components/RewardPayment';
import { RewardNegotiation } from '../components/RewardNegotiation';

// ─── Acceptance Status Banner ─────────────────────────────────────────────────

function AcceptanceMeter({
  ownerAccepted,
  finderAccepted,
  ownerName,
  finderName,
}: {
  ownerAccepted: boolean;
  finderAccepted: boolean;
  ownerName: string;
  finderName: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div
        className="glass-panel flex items-center gap-3 p-4 transition-all"
        style={{
          background: ownerAccepted ? 'rgba(16,185,129,0.08)' : 'var(--glass-bg)',
          borderColor: ownerAccepted ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all shadow-xs"
          style={{ background: ownerAccepted ? 'linear-gradient(135deg, #10b981, #059669)' : '#94a3b8' }}
        >
          {ownerAccepted ? <Check size={18} /> : <Clock size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Owner</p>
          <p className="text-xs font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>{ownerName}</p>
          <p className={`text-[10.5px] font-extrabold ${ownerAccepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
            {ownerAccepted ? '✅ Accepted' : 'Pending Review'}
          </p>
        </div>
      </div>

      <div
        className="glass-panel flex items-center gap-3 p-4 transition-all"
        style={{
          background: finderAccepted ? 'rgba(16,185,129,0.08)' : 'var(--glass-bg)',
          borderColor: finderAccepted ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all shadow-xs"
          style={{ background: finderAccepted ? 'linear-gradient(135deg, #10b981, #059669)' : '#94a3b8' }}
        >
          {finderAccepted ? <Check size={18} /> : <Clock size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Finder</p>
          <p className="text-xs font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>{finderName}</p>
          <p className={`text-[10.5px] font-extrabold ${finderAccepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
            {finderAccepted ? '✅ Accepted' : 'Pending Review'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Status Step Pill ─────────────────────────────────────────────────────────

function StepPill({
  step,
  label,
  completed,
  current,
}: {
  step: number;
  label: string;
  completed: boolean;
  current: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 ${
        completed ? 'opacity-100' : current ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-xs transition-all ${
          completed
            ? 'bg-emerald-500 text-white'
            : current
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white animate-pulse'
            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'
        }`}
      >
        {completed ? <Check size={14} /> : step}
      </div>
      <p className={`text-center text-[9.5px] font-bold ${completed ? 'text-emerald-600 dark:text-emerald-400' : current ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
        {label}
      </p>
    </div>
  );
}

// ─── Item Detail Card ─────────────────────────────────────────────────────────

function ItemCard({
  type,
  imageUrl,
  itemName,
  description,
  category,
  location,
  date,
  reporterName,
  accepted,
}: {
  type: 'lost' | 'found';
  imageUrl?: string;
  itemName: string;
  description?: string;
  category?: string;
  location?: string;
  date?: string;
  reporterName?: string;
  accepted: boolean;
}) {
  const isLost = type === 'lost';
  return (
    <div
      className="glass-panel overflow-hidden transition-all hover:shadow-lg"
      style={{ borderColor: isLost ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)' }}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{
          borderColor: 'var(--glass-border)',
          background: isLost ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs ${
              isLost ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          {accepted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check size={10} /> Accepted
            </span>
          )}
        </div>
        {reporterName && (
          <span className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-muted)' }}>by {reporterName}</span>
        )}
      </div>

      {/* Item Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={itemName}
          className="h-48 w-full object-cover border-b"
          style={{ borderColor: 'var(--glass-border)' }}
        />
      ) : (
        <div className="flex h-36 w-full items-center justify-center border-b bg-slate-100/50 dark:bg-slate-800/50" style={{ borderColor: 'var(--glass-border)' }}>
          <AlertCircle size={32} className={isLost ? 'text-rose-400' : 'text-emerald-400'} />
        </div>
      )}

      {/* Item Details */}
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>{itemName}</h3>
          {description && (
            <p className="mt-1 text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--dash-text-secondary)' }}>{description}</p>
          )}
        </div>

        <div className="space-y-1.5 text-xs border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
          {category && (
            <div className="flex items-center gap-2" style={{ color: 'var(--dash-text-secondary)' }}>
              <Tag size={13} className="shrink-0 text-indigo-500" />
              <span>
                Category: <strong style={{ color: 'var(--dash-text-primary)' }}>{category}</strong>
              </span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2" style={{ color: 'var(--dash-text-secondary)' }}>
              <MapPin size={13} className="shrink-0 text-rose-500" />
              <span>
                {isLost ? 'Lost at' : 'Found at'}: <strong style={{ color: 'var(--dash-text-primary)' }}>{location}</strong>
              </span>
            </div>
          )}
          {date && (
            <div className="flex items-center gap-2" style={{ color: 'var(--dash-text-secondary)' }}>
              <Calendar size={13} className="shrink-0 text-indigo-500" />
              <span>
                {isLost ? 'Lost on' : 'Found on'}:{' '}
                <strong style={{ color: 'var(--dash-text-primary)' }}>{new Date(date).toLocaleDateString()}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reject Confirmation Modal ────────────────────────────────────────────────

function RejectModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-md p-6 shadow-2xl space-y-4"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <XCircle size={24} />
        </div>
        <div>
          <h3 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Reject this match?</h3>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
            This will mark the match as rejected and notify the other party. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="dash-btn-secondary flex-1 py-2.5 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-md"
          >
            {loading ? 'Rejecting…' : 'Yes, Reject Match'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewMatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState<MatchType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchMatchDetails = async () => {
    if (!id) return;
    try {
      const res = await matchesApi.getById(id);
      setMatch(res.data.match);
    } catch {
      toast.error('Failed to load match details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails();
  }, [id]);

  const handleAcceptMatch = async () => {
    if (!match) return;
    setActionLoading(true);
    try {
      const res = await matchesApi.accept(match._id);
      setMatch(res.data.match);
      if (res.data.match.ownerAccepted && res.data.match.finderAccepted) {
        toast.success('🎉 Match Confirmed by both parties! Redirecting to secure chat...');
        const chatId = res.data.chat?._id || res.data.match.chatId;
        if (chatId) {
          setTimeout(() => {
            navigate(`/messages/${chatId}`);
          }, 1500);
        }
      } else {
        toast.success('Match accepted! Waiting for the other party.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept match.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!match) return;
    setActionLoading(true);
    try {
      const res = await matchesApi.reject(match._id);
      setMatch(res.data.match);
      toast.success('Match rejected.');
      setShowRejectModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject match.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!match) {
    return (
      <div className="glass-panel py-20 text-center space-y-3">
        <AlertCircle size={32} className="mx-auto text-rose-500" />
        <h2 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Match record not found</h2>
        <Link to="/matches" className="dash-btn-secondary inline-flex py-1.5 px-4 text-xs font-bold">
          ← Return to Matches
        </Link>
      </div>
    );
  }

  const currentUserId = String(user?.id || (user as any)?._id || '');
  const lostUserIdStr = String((match.lostUserId as any)?._id || (match.lostUserId as any)?.id || match.lostUserId || '');
  const foundUserIdStr = String((match.foundUserId as any)?._id || (match.foundUserId as any)?.id || match.foundUserId || '');

  const isOwner = Boolean(currentUserId && lostUserIdStr && currentUserId === lostUserIdStr);
  const isFinder = Boolean(currentUserId && foundUserIdStr && currentUserId === foundUserIdStr);

  const ownerAccepted = Boolean(match.ownerAccepted || match.lostUserAccepted);
  const finderAccepted = Boolean(match.finderAccepted || match.foundUserAccepted);
  const isBothAccepted =
    (ownerAccepted && finderAccepted) ||
    match.matchStatus === 'Confirmed' ||
    match.matchStatus === 'CONFIRMED';
  const isRejected = match.matchStatus === 'Rejected';
  const currentUserAccepted = isOwner ? ownerAccepted : finderAccepted;
  const isTerminal = isBothAccepted || isRejected;

  // Status timeline
  const steps = [
    { label: 'AI Match', completed: true },
    { label: 'Accepted', completed: isBothAccepted, current: !isBothAccepted && !isRejected },
    { label: 'Secure Chat', completed: isBothAccepted, current: isBothAccepted && match.verificationStatus === 'NONE' },
    { label: 'Ownership Verified', completed: match.verificationStatus === 'VERIFIED', current: isBothAccepted && match.verificationStatus !== 'VERIFIED' && match.verificationStatus !== 'NONE' },
    { label: 'Reward Paid', completed: Boolean(match.paymentStatus === 'PAID' || match.rewardPaid), current: match.verificationStatus === 'VERIFIED' && !match.rewardPaid && match.paymentStatus !== 'PAID' },
    { label: 'Returned', completed: Boolean(match.completed), current: match.verificationStatus === 'VERIFIED' && Boolean(match.paymentStatus === 'PAID' || match.rewardPaid) && !match.completed },
  ];

  return (
    <>
      <AnimatePresence>
        {showRejectModal && (
          <RejectModal
            onConfirm={handleRejectConfirm}
            onCancel={() => setShowRejectModal(false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <PageTransition className="mx-auto max-w-6xl space-y-6 py-2 pb-20 px-2 sm:px-4">
        {/* Breadcrumb Nav */}
        <div className="flex items-center justify-between">
          <Link
            to="/matches"
            className="dash-btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold"
          >
            <ChevronLeft size={14} /> Back to Matches
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>Match ID</span>
            <code className="rounded-md px-2 py-0.5 text-[11px] font-mono font-bold" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--dash-text-primary)' }}>
              #{match._id.slice(-8)}
            </code>
          </div>
        </div>

        {/* Page Header Glass Card */}
        <div className="glass-panel p-6 sm:p-7 space-y-5">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <TrendingUp size={12} /> {match.matchPercentage}% AI Confidence
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                    isBothAccepted
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : isRejected
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                      : ownerAccepted || finderAccepted
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                      : 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isBothAccepted
                    ? '✅ Confirmed'
                    : isRejected
                    ? '❌ Rejected'
                    : ownerAccepted
                    ? '⏳ Owner Accepted'
                    : finderAccepted
                    ? '⏳ Finder Accepted'
                    : '⌛ Pending Review'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                Review AI Match Details
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
                Compare item features and confirm whether this match is genuine. Mutual acceptance is required to initiate secure coordination.
              </p>
            </div>

            {/* Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!isTerminal && (
                <>
                  {!currentUserAccepted ? (
                    <button
                      onClick={handleAcceptMatch}
                      disabled={actionLoading}
                      id={`accept-match-${match._id}`}
                      className="dash-btn-primary py-2.5 px-6 text-xs font-bold shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      <span>{actionLoading ? 'Accepting…' : 'Accept Match'}</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Check size={14} /> You Accepted · Waiting for partner
                    </div>
                  )}

                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    id={`reject-match-${match._id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                  >
                    <XCircle size={14} /> Reject Match
                  </button>
                </>
              )}

              {isBothAccepted && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} /> Match Confirmed!
                </span>
              )}

              {isRejected && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600">
                  <XCircle size={15} /> Match Rejected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Both Parties Accepted Banner */}
        <AnimatePresence>
          {isBothAccepted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>Both Parties Accepted</h4>
                  <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                    Match confirmed! Proceed with meeting schedule or ownership verification to complete handover.
                  </p>
                </div>
              </div>
              {match.chatId && (
                <Link
                  to={`/messages/${match.chatId}`}
                  className="dash-btn-primary shrink-0 py-2.5 px-5 text-xs font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Go to Messages →
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workflow Status Timeline */}
        <div className="glass-panel p-5 sm:p-6 space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
            Workflow Steps
          </h3>
          <div className="relative flex items-start gap-0">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex flex-1 flex-col items-center">
                {idx > 0 && (
                  <div
                    className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 ${
                      steps[idx - 1]?.completed ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-1/2 right-0 top-4 h-0.5 -translate-y-1/2 ${
                      step.completed ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
                <div className="relative z-10">
                  <StepPill
                    step={idx + 1}
                    label={step.label}
                    completed={step.completed}
                    current={step.current ?? false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Confidence Card */}
        <div className="glass-panel p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>AI Similarity Scan</h3>
                <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>Multimodal visual + semantic attribute comparison</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black" style={{ color: 'var(--dash-accent)' }}>{match.matchPercentage}%</div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Score</p>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${match.matchPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
              />
            </div>
            <div className="flex justify-between text-[10.5px] font-bold" style={{ color: 'var(--dash-text-muted)' }}>
              <span>Low (0%)</span>
              <span>Moderate (50%)</span>
              <span style={{ color: 'var(--dash-accent)' }}>High Match (80%+)</span>
            </div>
          </div>
        </div>

        {/* Mutual Acceptance Tracker */}
        <div className="glass-panel p-5 sm:p-6 space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Mutual Acceptance Status</h3>
          <AcceptanceMeter
            ownerAccepted={ownerAccepted}
            finderAccepted={finderAccepted}
            ownerName={match.lostUserId.name}
            finderName={match.foundUserId.name}
          />
        </div>

        {/* Side-by-Side Item Comparison */}
        <div className="grid gap-6 md:grid-cols-2">
          <ItemCard
            type="lost"
            imageUrl={match.lostItemId.imageUrl || match.lostItemId.images?.[0]}
            itemName={match.lostItemId.itemName}
            description={match.lostItemId.description}
            category={match.lostItemId.category}
            location={match.lostItemId.lostLocation}
            date={match.lostItemId.lostDate}
            reporterName={match.lostUserId.name}
            accepted={ownerAccepted}
          />
          <ItemCard
            type="found"
            imageUrl={match.foundItemId.imageUrl || match.foundItemId.images?.[0]}
            itemName={match.foundItemId.itemName}
            description={match.foundItemId.description}
            category={match.foundItemId.category}
            location={match.foundItemId.foundLocation}
            date={match.foundItemId.foundDate}
            reporterName={match.foundUserId.name}
            accepted={finderAccepted}
          />
        </div>

        {/* Ownership Verification Section */}
        {isBothAccepted && (
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <ShieldAlert size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>Ownership Verification Details</h3>
                <p className="text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>
                  Required verification step to validate unique identifiers before item handover.
                </p>
              </div>
            </div>

            {/* Owner form */}
            {isOwner && (
              <div>
                {match.verificationStatus === 'NONE' || match.verificationStatus === 'VERIFICATION_FAILED' ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const answers: Record<string, string> = {};
                      formData.forEach((value, key) => {
                        answers[key] = value.toString();
                      });

                      setActionLoading(true);
                      try {
                        const res = await matchesApi.verifyOwnership(match._id, { answers });
                        setMatch(res.data.match);
                        toast.success('Verification answers submitted successfully!');
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Failed to submit answers.');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    {match.verificationStatus === 'VERIFICATION_FAILED' && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        ⚠️ Previous verification attempt was rejected. Please review details and submit again.
                      </div>
                    )}
                    <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                      Describe key distinguishing features to allow the finder to verify ownership:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Brand / Manufacturer</label>
                        <input name="brand" required type="text" placeholder="Brand name" className="glass-input h-10 w-full px-3 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Color & Material</label>
                        <input name="color" required type="text" placeholder="Color or finish" className="glass-input h-10 w-full px-3 text-xs" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Identifying Traits & Hidden Marks</label>
                        <textarea name="uniqueMarks" required rows={2} placeholder="Describe scratches, stickers, wallpaper, serial numbers, etc." className="glass-input w-full p-3 text-xs" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="dash-btn-primary py-2.5 px-6 text-xs font-bold"
                    >
                      {actionLoading ? 'Submitting...' : 'Submit Verification Answers'}
                    </button>
                  </form>
                ) : (
                  <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Answers submitted. Verification status: <span className="uppercase">{match.verificationStatus}</span>
                    </p>
                    <div className="grid gap-1.5 border-t pt-2 text-xs" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-primary)' }}>
                      {match.verificationAnswers &&
                        Object.entries(match.verificationAnswers).map(([key, val]) => (
                          <div key={key}>
                            <span className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {val}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Finder approval form */}
            {isFinder && (
              <div className="space-y-3">
                {match.verificationStatus === 'NONE' && (
                  <div className="rounded-xl p-4 text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                    Awaiting ownership verification answers from the item owner.
                  </div>
                )}

                {match.verificationStatus === 'PENDING' && (
                  <div className="space-y-3">
                    <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Review Owner's Submitted Answers:</h4>
                      <div className="grid gap-1.5 text-xs" style={{ color: 'var(--dash-text-primary)' }}>
                        {match.verificationAnswers &&
                          Object.entries(match.verificationAnswers).map(([key, val]) => (
                            <div key={key}>
                              <span className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {val}
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const res = await matchesApi.finderVerify(match._id, { verified: true });
                            setMatch(res.data.match);
                            toast.success('Ownership approved!');
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message || 'Failed to approve.');
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        className="dash-btn-primary py-2 px-5 text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                      >
                        Approve Ownership
                      </button>
                      <button
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const res = await matchesApi.finderVerify(match._id, { verified: false });
                            setMatch(res.data.match);
                            toast.error('Ownership rejected.');
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message || 'Failed to reject.');
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        className="dash-btn-secondary py-2 px-5 text-xs font-bold"
                        style={{ color: '#e11d48', borderColor: 'rgba(244,63,94,0.3)' }}
                      >
                        Reject Ownership
                      </button>
                    </div>
                  </div>
                )}

                {match.verificationStatus === 'VERIFIED' && (
                  <div className="rounded-xl p-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    ✅ Ownership verification APPROVED. The item is verified and ready to be returned.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reward Negotiation */}
        {isBothAccepted && match.rewardStatus !== 'Paid' && (
          <RewardNegotiation
            matchId={match._id}
            initialAmount={match.rewardAmount || 0}
            rewardStatus={match.rewardStatus}
            isOwner={isOwner}
            onUpdate={() => {
              matchesApi.getById(match._id).then((res) => setMatch(res.data.match));
            }}
          />
        )}

        {/* Reward Payment */}
        {isBothAccepted && match.verificationStatus === 'VERIFIED' && (match.rewardStatus === 'Accepted' || match.rewardStatus === 'Paid') && (
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Secure Reward Payment</h3>
            <RewardPayment
              matchId={match._id}
              defaultAmount={match.rewardAmount || 0}
              finderName={match.foundUserId.name}
              itemName={match.lostItemId.itemName}
              paymentStatus={match.paymentStatus}
              isOwner={isOwner}
              onPaymentSuccess={() => {
                matchesApi.getById(match._id).then((res) => setMatch(res.data.match));
              }}
            />
          </div>
        )}

        {/* Participant Info Cards */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Match Participants</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { role: 'Item Owner', user: match.lostUserId, accepted: ownerAccepted },
              { role: 'Item Finder', user: match.foundUserId, accepted: finderAccepted },
            ].map(({ role, user: u, accepted }) => (
              <div key={u._id} className="glass-action-card flex items-center gap-3 p-4">
                <AvatarBadge name={u.name} avatar={u.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>{role}</p>
                  <p className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>{u.name}</p>
                  {u.collegeName && (
                    <p className="text-[11px] truncate" style={{ color: 'var(--dash-text-secondary)' }}>{u.collegeName}</p>
                  )}
                </div>
                <PortalBadge tone={accepted ? 'success' : 'warning'}>
                  {accepted ? 'Accepted' : 'Pending'}
                </PortalBadge>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    </>
  );
}
