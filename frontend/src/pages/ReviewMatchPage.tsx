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
  Info,
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
        className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
          ownerAccepted
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all ${
            ownerAccepted ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          {ownerAccepted ? <Check size={18} /> : <Clock size={16} />}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Owner</p>
          <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{ownerName}</p>
          <p className={`text-[10px] font-semibold ${ownerAccepted ? 'text-emerald-600' : 'text-amber-600'}`}>
            {ownerAccepted ? '✅ Accepted' : 'Pending'}
          </p>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
          finderAccepted
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all ${
            finderAccepted ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          {finderAccepted ? <Check size={18} /> : <Clock size={16} />}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Finder</p>
          <p className="text-xs font-bold text-[#0F172A] line-clamp-1">{finderName}</p>
          <p className={`text-[10px] font-semibold ${finderAccepted ? 'text-emerald-600' : 'text-amber-600'}`}>
            {finderAccepted ? '✅ Accepted' : 'Pending'}
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
      className={`flex flex-col items-center gap-2 flex-1 min-w-0 ${
        completed ? 'opacity-100' : current ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
          completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : current
            ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white animate-pulse'
            : 'border-slate-300 bg-white text-slate-400'
        }`}
      >
        {completed ? <Check size={16} /> : step}
      </div>
      <p className={`text-center text-[10px] font-semibold ${completed ? 'text-emerald-700' : current ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>
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
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
        isLost ? 'border-red-100' : 'border-emerald-100'
      }`}
    >
      {/* Card Header */}
      <div
        className={`flex items-center justify-between px-5 py-3 ${
          isLost ? 'bg-red-50/70' : 'bg-emerald-50/70'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              isLost ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          {accepted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <Check size={10} /> Accepted
            </span>
          )}
        </div>
        {reporterName && (
          <span className="text-[11px] text-[#64748B]">by {reporterName}</span>
        )}
      </div>

      {/* Item Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={itemName}
          className="h-48 w-full object-cover border-b border-slate-100"
        />
      ) : (
        <div className={`flex h-36 w-full items-center justify-center border-b border-slate-100 ${isLost ? 'bg-red-50/50' : 'bg-emerald-50/50'}`}>
          <AlertCircle size={32} className={isLost ? 'text-red-300' : 'text-emerald-300'} />
        </div>
      )}

      {/* Item Details */}
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">{itemName}</h3>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-[#64748B] line-clamp-3">{description}</p>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-[#64748B] border-t border-slate-100 pt-3">
          {category && (
            <div className="flex items-center gap-2">
              <Tag size={13} className="shrink-0 text-[#2563EB]" />
              <span>
                Category: <strong className="text-[#0F172A]">{category}</strong>
              </span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="shrink-0 text-[#2563EB]" />
              <span>
                {isLost ? 'Lost at' : 'Found at'}: <strong className="text-[#0F172A]">{location}</strong>
              </span>
            </div>
          )}
          {date && (
            <div className="flex items-center gap-2">
              <Calendar size={13} className="shrink-0 text-[#2563EB]" />
              <span>
                {isLost ? 'Lost on' : 'Found on'}:{' '}
                <strong className="text-[#0F172A]">{new Date(date).toLocaleDateString()}</strong>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <XCircle size={24} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">Reject this match?</h3>
        <p className="mt-1.5 text-sm text-[#64748B]">
          This will mark the match as rejected and notify the other party. This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition disabled:opacity-50"
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
  const [respondingMeeting, setRespondingMeeting] = useState(false);

  const handleRespondMeeting = async (action: 'accept' | 'decline') => {
    if (!match) return;
    setRespondingMeeting(true);
    try {
      const res = await matchesApi.respondMeeting(match._id, { action });
      setMatch(res.data.match);
      toast.success(action === 'accept' ? 'Meeting confirmed!' : 'Meeting declined.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to respond to meeting.');
    } finally {
      setRespondingMeeting(false);
    }
  };

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
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Match record not found</h2>
        <Link to="/matches" className="text-sm font-semibold text-[#2563EB] hover:underline">
          ← Return to matches list
        </Link>
      </div>
    );
  }

  const isOwner = match.lostUserId._id === user?.id;
  const isFinder = match.foundUserId._id === user?.id;

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

      <PageTransition className="mx-auto max-w-6xl space-y-6 py-2 pb-16">
        {/* ── Breadcrumb Nav ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            to="/matches"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-[#1E3A8A] transition"
          >
            <ChevronLeft size={16} /> Back to Matches
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B]">Match ID</span>
            <code className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-mono font-bold text-[#0F172A]">
              #{match._id.slice(-8)}
            </code>
          </div>
        </div>

        {/* ── Page Header Card ────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Navy top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-cyan-500" />

          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Confidence badge */}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E3A8A] px-3 py-1 text-[11px] font-bold text-white">
                  <TrendingUp size={12} /> {match.matchPercentage}% AI Confidence
                </span>

                {/* Status badge */}
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                    isBothAccepted
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : isRejected
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : ownerAccepted || finderAccepted
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
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

              <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">
                Review Match Details
              </h1>
              <p className="text-sm text-[#64748B]">
                Compare item details and decide whether this match is genuine. Mutual acceptance is required to confirm.
              </p>
            </div>

            {/* ── Action Controls ───────────────────── */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!isTerminal && (
                <>
                  {!currentUserAccepted ? (
                    <button
                      onClick={handleAcceptMatch}
                      disabled={actionLoading}
                      id={`accept-match-${match._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2563EB] active:scale-95 transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      {actionLoading ? 'Accepting…' : 'Accept Match'}
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                      <Check size={15} /> You Accepted · Awaiting partner
                    </div>
                  )}

                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    id={`reject-match-${match._id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#EF4444] hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <XCircle size={15} /> Reject Match
                  </button>
                </>
              )}

              {isBothAccepted && (
                <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={16} /> Match Confirmed!
                </span>
              )}

              {isRejected && (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
                  <XCircle size={15} /> Match Rejected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Mutual Acceptance Success Banner ───────────────────── */}
        <AnimatePresence>
          {isBothAccepted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Both Parties Have Accepted!</h4>
                    <p className="text-xs text-[#64748B]">
                      The match is now confirmed. Proceed to ownership verification to return the item.
                    </p>
                  </div>
                </div>
                {match.chatId && (
                  <Link
                    to={`/messages/${match.chatId}`}
                    className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition text-center"
                  >
                    Go to Messages →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Meeting Request Banner ─────────────────────────────────── */}
        {match?.meetingStatus === 'PENDING' && isFinder && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-900">Meeting Request Pending</h4>
              <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">Response Required</span>
            </div>
            <p className="text-xs text-slate-700">
              Location: <strong>{match.meetingLocation}</strong> | Time: <strong>{match.meetingTime ? new Date(match.meetingTime).toLocaleString() : 'TBD'}</strong>
            </p>
            <div className="flex gap-2 pt-1">
              <button
                disabled={respondingMeeting}
                onClick={() => handleRespondMeeting('accept')}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                {respondingMeeting ? 'Saving...' : 'Accept Meeting'}
              </button>
              <button
                disabled={respondingMeeting}
                onClick={() => handleRespondMeeting('decline')}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition"
              >
                Decline Meeting
              </button>
            </div>
          </div>
        )}

        {/* ── Workflow Status Timeline ────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Workflow Status
          </h3>
          <div className="relative flex items-start gap-0">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex flex-1 flex-col items-center">
                {/* Connector lines between steps */}
                {idx > 0 && (
                  <div
                    className={`absolute left-0 right-1/2 top-[1.125rem] h-0.5 -translate-y-1/2 ${
                      steps[idx - 1]?.completed ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-1/2 right-0 top-[1.125rem] h-0.5 -translate-y-1/2 ${
                      step.completed ? 'bg-emerald-400' : 'bg-slate-200'
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

        {/* ── AI Confidence Card ──────────────────────────────────── */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A] text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">AI Similarity Scan</h3>
                <p className="text-xs text-[#64748B]">Deep visual + textual similarity analysis</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-[#1E3A8A]">{match.matchPercentage}%</div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">Match Score</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${match.matchPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]"
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
              <span>Low (0%)</span>
              <span>Medium (50%)</span>
              <span className="text-[#1E3A8A]">High Match (80%+)</span>
            </div>
          </div>
        </div>

        {/* ── Mutual Acceptance Tracker ───────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Mutual Acceptance Status</h3>
          <AcceptanceMeter
            ownerAccepted={ownerAccepted}
            finderAccepted={finderAccepted}
            ownerName={match.lostUserId.name}
            finderName={match.foundUserId.name}
          />

          {/* Both accepted progress indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${ownerAccepted ? 'bg-emerald-500' : 'bg-slate-200'} transition-all`} />
            <div className="text-xs font-bold text-[#0F172A]">
              {ownerAccepted && finderAccepted ? '2/2' : ownerAccepted || finderAccepted ? '1/2' : '0/2'}
            </div>
            <div className={`h-2 flex-1 rounded-full ${finderAccepted ? 'bg-emerald-500' : 'bg-slate-200'} transition-all`} />
          </div>
        </div>

        {/* ── Side-by-Side Item Comparison ───────────────────────── */}
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

        {/* ── Ownership Verification Section ──────────────────────── */}
        {isBothAccepted && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1E3A8A]">
                <ShieldAlert size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Ownership Verification Details</h3>
                <p className="text-[10px] text-[#64748B]">
                  Required step to verify item details before marking as returned.
                </p>
              </div>
            </div>

            {/* Owner workflow to submit answers */}
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
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                        ⚠️ Previous verification attempt was rejected. Please review details and submit again.
                      </div>
                    )}
                    <p className="text-xs text-[#64748B]">
                      Please describe your item features to allow the finder to verify:
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Dynamic fields based on category */}
                      {match.lostItemId.category?.toLowerCase() === 'mobile' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Wallpaper Description</label>
                            <input name="wallpaper" required type="text" placeholder="e.g. Sunset photo" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Lock Screen Details</label>
                            <input name="lockScreen" required type="text" placeholder="e.g. Digital clock style" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Phone Case</label>
                            <input name="phoneCase" required type="text" placeholder="e.g. Blue silicone case" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Brand</label>
                            <input name="brand" required type="text" placeholder="e.g. Samsung / Apple" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">IMEI (Optional)</label>
                            <input name="imei" type="text" placeholder="IMEI number" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                        </>
                      )}

                      {match.lostItemId.category?.toLowerCase() === 'laptop' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Brand</label>
                            <input name="brand" required type="text" placeholder="e.g. Asus / Dell" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Sticker Description</label>
                            <input name="stickers" required type="text" placeholder="e.g. Github sticker on back" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Login Wallpaper</label>
                            <input name="loginWallpaper" required type="text" placeholder="e.g. Default Windows" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Charger Color</label>
                            <input name="chargerColor" required type="text" placeholder="e.g. Black with round pin" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                        </>
                      )}

                      {match.lostItemId.category?.toLowerCase() === 'wallet' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Card Names</label>
                            <input name="cardNames" required type="text" placeholder="e.g. College ID, Metro card" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Cash Approximation</label>
                            <input name="cashAmount" required type="text" placeholder="e.g. Around 500 Rupees" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Color</label>
                            <input name="color" required type="text" placeholder="e.g. Brown leather" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                        </>
                      )}

                      {match.lostItemId.category?.toLowerCase() === 'bag' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Brand</label>
                            <input name="brand" required type="text" placeholder="e.g. Wildcraft / American Tourister" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Contents</label>
                            <input name="contents" required type="text" placeholder="e.g. Notebooks, water bottle, keys" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Color</label>
                            <input name="color" required type="text" placeholder="e.g. Navy blue with yellow stripes" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                        </>
                      )}

                      {/* Generic/Default questions if no match */}
                      {!['mobile', 'laptop', 'wallet', 'bag'].includes(match.lostItemId.category?.toLowerCase() || '') && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Brand</label>
                            <input name="brand" required type="text" placeholder="Brand / Manufacturer" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Color</label>
                            <input name="color" required type="text" placeholder="Main color" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Unique Features / Identifying Marks</label>
                            <textarea name="uniqueMarks" required rows={2} placeholder="Describe scratches, keychains, stickers, etc." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#3B82F6] transition" />
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#2563EB] transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Submitting...' : 'Submit Verification Answers'}
                    </button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                    <p className="text-xs font-semibold text-blue-800">
                      Answers submitted. Verification status: <span className="font-bold">{match.verificationStatus}</span>
                    </p>
                    <div className="grid gap-2 border-t border-blue-100 pt-2 text-xs text-slate-700">
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

            {/* Finder review answers workflow */}
            {isFinder && (
              <div className="space-y-4">
                {match.verificationStatus === 'NONE' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    Awaiting ownership verification answers from the item owner.
                  </div>
                )}

                {match.verificationStatus === 'PENDING' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <h4 className="text-xs font-bold text-blue-900">Review Submitted Answers:</h4>
                      <div className="grid gap-2 text-xs text-slate-700">
                        {match.verificationAnswers &&
                          Object.entries(match.verificationAnswers).map(([key, val]) => (
                            <div key={key}>
                              <span className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {val}
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
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
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
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
                        className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition"
                      >
                        Reject Ownership
                      </button>
                    </div>
                  </div>
                )}

                {match.verificationStatus === 'VERIFIED' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                    ✅ Ownership verification APPROVED. The item is ready to be returned.
                  </div>
                )}

                {match.verificationStatus === 'VERIFICATION_FAILED' && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                    ❌ Ownership verification REJECTED. Awaiting updated details from owner.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Reward Negotiation Section ───────────────────────────── */}
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

        {/* ── Reward Payment Section ─────────────────────────────── */}
        {isBothAccepted && match.verificationStatus === 'VERIFIED' && (match.rewardStatus === 'Accepted' || match.rewardStatus === 'Paid') && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Secure Reward Payment</h3>
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

        {/* ── Participant Info Cards ──────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Match Participants</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { role: 'Item Owner', user: match.lostUserId, accepted: ownerAccepted },
              { role: 'Item Finder', user: match.foundUserId, accepted: finderAccepted },
            ].map(({ role, user: u, accepted }) => (
              <div key={u._id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <AvatarBadge name={u.name} avatar={u.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">{role}</p>
                  <p className="text-sm font-bold text-[#0F172A] truncate">{u.name}</p>
                  {u.collegeName && (
                    <p className="text-[11px] text-[#64748B] truncate">{u.collegeName}</p>
                  )}
                </div>
                <PortalBadge tone={accepted ? 'success' : 'warning'}>
                  {accepted ? 'Accepted' : 'Pending'}
                </PortalBadge>
              </div>
            ))}
          </div>
        </div>

        {/* ── Privacy & Security Notice ───────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
            <ShieldAlert size={16} /> Privacy & Security Controls
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            In accordance with CampusConnect privacy standards, contact numbers and personal emails remain strictly
            hidden until both users accept the match. After mutual acceptance, a secure chat channel is created for
            safe communication.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <Info size={14} className="mt-0.5 shrink-0 text-[#2563EB]" />
            <p className="text-[11px] text-[#2563EB] leading-relaxed">
              {!isTerminal
                ? currentUserAccepted
                  ? 'You have accepted this match. Waiting for the other party to review and accept.'
                  : 'Review the item details above carefully. Click "Accept Match" only if you believe this is a genuine match.'
                : isBothAccepted
                ? 'Both parties have accepted. The match is confirmed and secure communication is unlocked.'
                : 'This match was rejected. No further action is required.'}
            </p>
          </div>
        </div>
      </PageTransition>
    </>
  );
}
