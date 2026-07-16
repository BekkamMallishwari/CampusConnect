import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Calendar, MapPin, Tag, User, Phone, Mail, Award, Lock, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { lostItemsApi, foundItemsApi, matchesApi, rewardsApi, paymentsApi, type LostItemType, type FoundItemType, type MatchType, type RewardType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type ItemDetailsPageProps = {
  type: 'lost' | 'found';
};

export default function ItemDetailsPage({ type }: ItemDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [item, setItem] = useState<LostItemType | FoundItemType | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchType | null>(null);
  const [reward, setReward] = useState<RewardType | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [negotiatingAmount, setNegotiatingAmount] = useState('');
  const [showNegotiate, setShowNegotiate] = useState(false);

  const isLost = type === 'lost';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isLost) {
        const res = await lostItemsApi.getById(id!);
        setItem(res.data.item);
        
        // Load associated matches
        const matchesRes = await matchesApi.getAll();
        const itemMatches = matchesRes.data.matches.filter(
          (m) => m.lostItemId._id === id!
        );
        setMatches(itemMatches);
        
        // Check for accepted match
        const accepted = itemMatches.find((m) => m.matchStatus === 'Accepted' || m.matchStatus === 'Verified');
        if (accepted) {
          setActiveMatch(accepted);
          loadRewardDetails(accepted._id);
        }
      } else {
        const res = await foundItemsApi.getById(id!);
        setItem(res.data.item);
        
        // Load associated matches
        const matchesRes = await matchesApi.getAll();
        const itemMatches = matchesRes.data.matches.filter(
          (m) => m.foundItemId._id === id!
        );
        setMatches(itemMatches);
        
        const accepted = itemMatches.find((m) => m.matchStatus === 'Accepted' || m.matchStatus === 'Verified');
        if (accepted) {
          setActiveMatch(accepted);
          loadRewardDetails(accepted._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load item details.');
    } finally {
      setLoading(false);
    }
  };

  const loadRewardDetails = async (matchId: string) => {
    try {
      const res = await rewardsApi.getByMatchId(matchId);
      setReward(res.data.reward);
    } catch (err) {
      // Reward might not exist yet; ignore error
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, type]);

  const handleAcceptMatch = async (matchId: string) => {
    try {
      await matchesApi.accept(matchId);
      toast.success('Match accepted!');
      fetchData();
    } catch (err) {
      toast.error('Failed to accept match.');
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to decline this match?')) return;
    try {
      await matchesApi.reject(matchId);
      toast.success('Match declined.');
      fetchData();
    } catch (err) {
      toast.error('Failed to decline match.');
    }
  };

  const handleCreateRewardRequest = async () => {
    if (!activeMatch) return;
    const amount = Number(prompt('Enter requested reward amount ($):'));
    if (!amount || amount <= 0) return;
    
    try {
      await rewardsApi.create(activeMatch._id, amount);
      toast.success('Reward request sent!');
      loadRewardDetails(activeMatch._id);
    } catch (err) {
      toast.error('Failed to request reward.');
    }
  };

  const handleAcceptReward = async () => {
    if (!reward) return;
    try {
      await rewardsApi.accept(reward._id);
      toast.success('Reward offer accepted!');
      loadRewardDetails(activeMatch!._id);
    } catch (err) {
      toast.error('Failed to accept reward.');
    }
  };

  const handleRejectReward = async () => {
    if (!reward) return;
    try {
      await rewardsApi.reject(reward._id);
      toast.success('Reward offer declined.');
      loadRewardDetails(activeMatch!._id);
    } catch (err) {
      toast.error('Failed to reject reward.');
    }
  };

  const handleNegotiateReward = async () => {
    if (!reward || !negotiatingAmount) return;
    try {
      await rewardsApi.negotiate(reward._id, Number(negotiatingAmount));
      toast.success('Counter-offer submitted.');
      setShowNegotiate(false);
      setNegotiatingAmount('');
      loadRewardDetails(activeMatch!._id);
    } catch (err) {
      toast.error('Failed to submit counter-offer.');
    }
  };

  const handlePayReward = async () => {
    if (!reward) return;
    setPaymentLoading(true);
    try {
      const res = await paymentsApi.createSession(reward._id);
      if (res.data.mode === 'simulated' && res.data.simulatedUrl) {
        // Stripe fallback redirect to frontend checkout mock
        window.location.href = res.data.simulatedUrl;
      } else if (res.data.sessionUrl) {
        // Redirect to real Stripe
        window.location.href = res.data.sessionUrl;
      }
    } catch (err) {
      toast.error('Failed to initialize payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20 text-slate-400">
        Item report not found.
      </div>
    );
  }

  const isOwner = item.postedBy._id === user?.id;
  const statusFlow = [
    { name: 'Reported', active: true },
    { name: 'Possible Match', active: matches.length > 0 },
    { name: 'Verified', active: activeMatch?.matchStatus === 'Accepted' || activeMatch?.matchStatus === 'Verified' },
    { name: 'Payment/Handover', active: activeMatch?.matchStatus === 'Accepted' || activeMatch?.matchStatus === 'Verified' },
    { name: 'Returned', active: item.status === 'Returned' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        {isOwner && (
          <Link
            to={isLost ? `/lost-items/edit/${item._id}` : `/found-items/edit/${item._id}`}
            className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm font-bold text-white hover:border-slate-700 transition"
          >
            Edit Post
          </Link>
        )}
      </div>

      {/* Item Info Card */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Images slider/grid */}
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-3xl border border-slate-900 bg-slate-950">
            <img
              src={item.images && item.images.length > 0 ? item.images[0] : 'https://picsum.photos/seed/placeholder/800/600'}
              alt={item.itemName}
              className="h-full w-full object-cover"
            />
          </div>
          {item.images && item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {item.images.slice(1).map((url, idx) => (
                <div key={idx} className="aspect-square overflow-hidden rounded-2xl border border-slate-900 bg-slate-950">
                  <img src={url} alt="thumbnail" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details column */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                item.status === 'Returned' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                {item.status}
              </span>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-350">
                {isLost ? 'Missing Item' : 'Recovered Item'}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white">{item.itemName}</h1>
            <p className="text-base text-slate-350 leading-relaxed">{item.description}</p>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-900/65 pt-6">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Tag size={16} className="text-cyan-400" />
                <span>{item.category}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Calendar size={16} className="text-cyan-400" />
                <span>{new Date(isLost ? (item as LostItemType).lostDate : (item as FoundItemType).foundDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400 col-span-2">
                <MapPin size={16} className="text-cyan-400" />
                <span>{isLost ? (item as LostItemType).lostLocation : (item as FoundItemType).foundLocation}</span>
              </div>
            </div>

            {/* Custom attributes */}
            {isLost && (
              <div className="border-t border-slate-900 pt-6 grid grid-cols-2 gap-4 text-sm">
                {(item as LostItemType).brand && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Brand</span>
                    <p className="font-semibold text-white">{(item as LostItemType).brand}</p>
                  </div>
                )}
                {(item as LostItemType).color && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Color</span>
                    <p className="font-semibold text-white">{(item as LostItemType).color}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Details Unlock Panel */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock size={14} className="text-cyan-400" />
              Coordinate Handover Contact
            </h3>
            
            {activeMatch?.contactShared || item.status === 'Returned' ? (
              <div className="mt-4 space-y-3 text-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-3 text-slate-350">
                  <User size={15} className="text-cyan-400" />
                  <span>{item.postedBy.name}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-350">
                  <Mail size={15} className="text-cyan-400" />
                  <a href={`mailto:${item.postedBy.email}`} className="hover:text-cyan-400 underline">{item.postedBy.email}</a>
                </div>
                {isLost && (item as LostItemType).contactNumber && (
                  <div className="flex items-center gap-3 text-slate-350">
                    <Phone size={15} className="text-cyan-400" />
                    <span>{(item as LostItemType).contactNumber}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-405 leading-relaxed">
                Contact information (Phone number, email address) will be revealed only after a similarity match is accepted by both users, and the reward payout is paid (if requested).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Item Flowchart Progress */}
      <div className="rounded-3xl border border-slate-900 bg-slate-900/25 p-6">
        <h3 className="text-sm font-bold text-white">Item Status Flowchart</h3>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          {statusFlow.map((step, idx) => (
            <div key={step.name} className="flex items-center gap-4">
              <div className={`flex items-center gap-1.5 rounded-full border px-4 py-2 ${
                step.active ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' : 'bg-slate-950/20 text-slate-550 border-slate-900'
              }`}>
                {step.active && <CheckCircle2 size={12} />}
                {step.name}
              </div>
              {idx < statusFlow.length - 1 && <ChevronRight size={14} className="text-slate-700" />}
            </div>
          ))}
        </div>
      </div>

      {/* Matches Panel */}
      {isOwner && matches.length > 0 && !activeMatch && (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-8 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" />
            Detected Similarity Matches
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Our automated scanner found potential overlaps. Please verify these items:
          </p>

          <div className="mt-6 space-y-4">
            {matches.map((match) => {
              const matchedItem = isLost ? match.foundItemId : match.lostItemId;
              return (
                <div key={match._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-slate-850 bg-slate-950/20 p-5">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">{matchedItem.itemName}</p>
                    <p className="text-xs text-slate-400">Match confidence: {match.matchPercentage}% confidence</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAcceptMatch(match._id)}
                      className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                    >
                      Verify Match
                    </button>
                    <button
                      onClick={() => handleRejectMatch(match._id)}
                      className="rounded-xl border border-rose-950/30 bg-rose-950/10 px-4 py-2 text-xs font-bold text-rose-455 hover:bg-rose-950/30 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted Match Reward escrow & Chat Room Panel */}
      {activeMatch && (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-8 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-cyan-400" />
                Verified Match Active
              </h2>
              <p className="mt-2 text-sm text-slate-405">
                Match verified. Coordinate using private messages.
              </p>
            </div>
            
            <Link
              to="/chats"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/15"
            >
              Open Messaging Room
            </Link>
          </div>

          {/* Reward escrow interface */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/50 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award size={15} className="text-cyan-400" />
              Finder Reward System
            </h3>

            {!reward ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">No reward requested yet.</p>
                {!isLost && (
                  <button
                    onClick={handleCreateRewardRequest}
                    className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                  >
                    Request Reward
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-200">
                    Reward State: <span className="text-cyan-400">{reward.status}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-405">
                    Amount Proposed: <span className="font-bold text-white">${reward.requestedAmount} USD</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {reward.status === 'Pending' && isLost && (
                    <>
                      <button
                        onClick={handleAcceptReward}
                        className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => setShowNegotiate(true)}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs font-bold text-slate-350 hover:border-slate-700 transition"
                      >
                        Negotiate
                      </button>
                      <button
                        onClick={handleRejectReward}
                        className="rounded-xl border border-rose-950/30 bg-rose-950/10 px-4 py-2 text-xs font-bold text-rose-455 hover:bg-rose-950/30 transition"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {reward.status === 'Accepted' && isLost && (
                    <button
                      onClick={handlePayReward}
                      disabled={paymentLoading}
                      className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                    >
                      {paymentLoading ? 'Redirecting...' : 'Pay Reward (Stripe)'}
                    </button>
                  )}

                  {reward.status === 'Paid' && (
                    <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      Paid & Completed
                    </span>
                  )}
                </div>
              </div>
            )}

            {showNegotiate && (
              <div className="mt-4 flex items-center gap-3 animate-in fade-in duration-200">
                <input
                  type="number"
                  value={negotiatingAmount}
                  onChange={(e) => setNegotiatingAmount(e.target.value)}
                  placeholder="Counter-offer amount ($)"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleNegotiateReward}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                >
                  Send Counter
                </button>
                <button
                  onClick={() => setShowNegotiate(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
