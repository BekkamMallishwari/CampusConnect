import { useState } from 'react';
import { Star, Gift, ShieldCheck, CheckCircle2, FileText, X, Award, Sparkles, Loader2, CreditCard } from 'lucide-react';
import { matchesApi, paymentsApi, type MatchType } from '../lib/api';
import { toast } from 'react-hot-toast';

interface RewardsAndRatingModalProps {
  match: MatchType;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RewardsAndRatingModal({
  match,
  currentUserId,
  onClose,
  onSuccess,
}: RewardsAndRatingModalProps) {
  const isOwner = match.lostUserId._id === currentUserId;
  const partnerUser = isOwner ? match.foundUserId : match.lostUserId;
  const existingRating = isOwner ? match.ownerRating : match.finderRating;

  const rewardAmount = match.rewardAmount || match.lostItemId?.rewardAmount || match.foundItemId?.rewardAmount || 0;
  const hasReward = rewardAmount > 0;

  // Step state: 'REWARD' | 'RECEIPT' | 'RATING'
  const [step, setStep] = useState<'REWARD' | 'RECEIPT' | 'RATING'>(
    hasReward && isOwner && !match.rewardPaid ? 'REWARD' : 'RATING'
  );

  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(Boolean(match.rewardPaid));
  const [receiptData, setReceiptData] = useState<{
    txId: string;
    amount: number;
    date: string;
    item: string;
  } | null>(null);

  // Rating state
  const [starRating, setStarRating] = useState<number>(existingRating?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>(existingRating?.feedback || '');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(Boolean(existingRating?.rating));

  const handlePayReward = async () => {
    setPaying(true);
    try {
      const orderRes = await paymentsApi.createOrder(match._id, rewardAmount);
      
      await paymentsApi.verifyPayment({
        razorpay_order_id: orderRes.data.orderId || 'sim_order_' + Date.now(),
        razorpay_payment_id: 'pay_' + Math.random().toString(36).slice(2, 11),
        razorpay_signature: 'sig_' + Math.random().toString(36).slice(2, 11),
        matchId: match._id,
      });

      setPaymentSuccess(true);
      setReceiptData({
        txId: 'PAY-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        amount: rewardAmount,
        date: new Date().toLocaleString(),
        item: match.lostItemId.itemName,
      });
      toast.success(`Reward of ₹${rewardAmount} paid successfully!`);
      setStep('RECEIPT');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleSaveReview = async () => {
    setSubmittingRating(true);
    try {
      await matchesApi.rate(match._id, {
        rating: starRating,
        feedback: feedbackText,
      });
      toast.success('Rating & feedback saved!');
      setRatingSubmitted(true);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg overflow-hidden rounded-[22px] p-6 shadow-2xl transition-all space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Reward & Reputation</h3>
              <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>Complete handover reward and community review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-xl p-1 gap-1 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
          {hasReward && (
            <button
              onClick={() => setStep('REWARD')}
              className={`glass-tab-pill flex-1 py-2 text-xs font-bold ${step === 'REWARD' ? 'active' : ''}`}
            >
              Reward Details
            </button>
          )}
          {receiptData && (
            <button
              onClick={() => setStep('RECEIPT')}
              className={`glass-tab-pill flex-1 py-2 text-xs font-bold ${step === 'RECEIPT' ? 'active' : ''}`}
            >
              Payment Receipt
            </button>
          )}
          <button
            onClick={() => setStep('RATING')}
            className={`glass-tab-pill flex-1 py-2 text-xs font-bold ${step === 'RATING' ? 'active' : ''}`}
          >
            User Rating & Review
          </button>
        </div>

        {/* STEP 1: REWARD DISPLAY & PAYMENT */}
        {step === 'REWARD' && (
          <div className="space-y-5 py-2">
            {hasReward ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                  <Gift size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Promised Reward</span>
                  <div className="text-3xl font-black" style={{ color: 'var(--dash-text-primary)' }}>₹{rewardAmount}</div>
                  <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>
                    {isOwner
                      ? `Pay ₹${rewardAmount} reward to ${partnerUser.name} for safely returning your item.`
                      : `${partnerUser.name} offered a reward of ₹${rewardAmount} for this item.`}
                  </p>
                </div>

                {isOwner && !paymentSuccess ? (
                  <button
                    onClick={handlePayReward}
                    disabled={paying}
                    className="dash-btn-primary w-full py-3 text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {paying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    <span>Pay Reward ₹{rewardAmount} Now</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={16} /> Payment Completed & Verified
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-xs">
                  <Award size={32} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Campus Karma Reward</h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>
                    No cash reward was attached to this item.
                  </p>
                </div>

                <div className="rounded-xl p-4 text-left space-y-2 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>
                    <span>Good Citizen Badge</span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 font-extrabold">UNLOCKED 🎉</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>
                    <span>Campus Karma Points</span>
                    <span className="font-black text-indigo-500">+50 Points</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('RATING')}
                  className="dash-btn-primary w-full py-3 text-xs font-bold shadow-md"
                >
                  Continue to Rate {partnerUser.name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: GENERATED RECEIPT */}
        {step === 'RECEIPT' && (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl p-5 space-y-4 border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>CampusConnect Official Receipt</h4>
                  <p className="text-[10.5px]" style={{ color: 'var(--dash-text-muted)' }}>Transaction ID: {receiptData?.txId || 'PAY-8921034'}</p>
                </div>
                <FileText size={22} className="text-indigo-500" />
              </div>

              <div className="space-y-2 text-xs" style={{ color: 'var(--dash-text-primary)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dash-text-muted)' }}>Item Name:</span>
                  <span className="font-bold">{match.lostItemId.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dash-text-muted)' }}>Payer (Owner):</span>
                  <span className="font-bold">{match.lostUserId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dash-text-muted)' }}>Recipient (Finder):</span>
                  <span className="font-bold">{match.foundUserId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--dash-text-muted)' }}>Date & Time:</span>
                  <span>{receiptData?.date || new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-sm" style={{ borderColor: 'var(--glass-border)' }}>
                  <span className="font-bold">Total Amount Paid:</span>
                  <span className="font-black text-emerald-600">₹{rewardAmount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-[10.5px] text-emerald-600 font-bold border border-emerald-500/20">
                <ShieldCheck size={14} /> Verified CampusConnect Transaction
              </div>
            </div>

            <button
              onClick={() => setStep('RATING')}
              className="dash-btn-primary w-full py-3 text-xs font-bold shadow-md"
            >
              Proceed to Rate {partnerUser.name}
            </button>
          </div>
        )}

        {/* STEP 3: 5-STAR RATING & REVIEW */}
        {step === 'RATING' && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Rate your experience with {partnerUser.name}</h4>
              <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>Your rating builds trust across our campus community</p>
            </div>

            {/* Interactive Stars */}
            <div className="flex justify-center items-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`${
                      (hoverRating || starRating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200/50 text-slate-300 dark:text-slate-700'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--dash-text-primary)' }}>
                Feedback & Review
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience returning/recovering this item..."
                className="glass-input w-full p-3 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="dash-btn-secondary py-2.5 px-4 text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={submittingRating}
                className="dash-btn-primary py-2.5 px-5 text-xs font-bold shadow-md disabled:opacity-50"
              >
                {submittingRating ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                <span>{ratingSubmitted ? 'Update Review' : 'Save Review'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
