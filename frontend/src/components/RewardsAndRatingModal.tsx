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
      // Create Razorpay or simulated payment order
      const orderRes = await paymentsApi.createOrder(match._id, rewardAmount);
      
      // Complete payment verification
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#1E3A8A]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Reward & Reputation</h3>
              <p className="text-xs text-[#64748B]">Complete handover reward and user review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-100 bg-[#F8FAFC] my-4 rounded-xl p-1 gap-1">
          {hasReward && (
            <button
              onClick={() => setStep('REWARD')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                step === 'REWARD'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Reward Details
            </button>
          )}
          {receiptData && (
            <button
              onClick={() => setStep('RECEIPT')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                step === 'RECEIPT'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Payment Receipt
            </button>
          )}
          <button
            onClick={() => setStep('RATING')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              step === 'RATING'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            User Rating & Review
          </button>
        </div>

        {/* STEP 1: REWARD DISPLAY & PAYMENT */}
        {step === 'REWARD' && (
          <div className="space-y-6 py-2">
            {hasReward ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#10B981] border border-emerald-200">
                  <Gift size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Promised Reward</span>
                  <div className="text-3xl font-black text-[#0F172A]">₹{rewardAmount}</div>
                  <p className="text-xs text-[#64748B] mt-1">
                    {isOwner
                      ? `Pay ₹${rewardAmount} reward to ${partnerUser.name} for safely returning your item.`
                      : `${partnerUser.name} offered a reward of ₹${rewardAmount} for this item.`}
                  </p>
                </div>

                {isOwner && !paymentSuccess ? (
                  <button
                    onClick={handlePayReward}
                    disabled={paying}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] py-3 text-xs font-bold text-white shadow-md hover:bg-[#2563EB] transition disabled:opacity-50"
                  >
                    {paying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    Pay Reward ₹{rewardAmount} Now
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-[#10B981]">
                    <CheckCircle2 size={16} /> Payment Completed & Verified
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-200">
                  <Award size={32} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0F172A]">Campus Karma Reward</h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    No cash reward was attached to this item.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-[#F8FAFC] p-4 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A]">Good Citizen Badge</span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">UNLOCKED 🎉</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A]">Campus Points</span>
                    <span className="font-black text-[#2563EB]">+50 Points</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('RATING')}
                  className="w-full rounded-xl bg-[#1E3A8A] py-3 text-xs font-bold text-white hover:bg-[#2563EB] transition"
                >
                  Continue to Rate {partnerUser.name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: GENERATED RECEIPT */}
        {step === 'RECEIPT' && (
          <div className="space-y-5 py-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">CampusConnect Official Receipt</h4>
                  <p className="text-[10px] text-[#64748B]">Transaction ID: {receiptData?.txId || 'PAY-8921034'}</p>
                </div>
                <FileText size={22} className="text-[#2563EB]" />
              </div>

              <div className="space-y-2 text-xs text-[#0F172A]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Item Name:</span>
                  <span className="font-semibold">{match.lostItemId.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Payer (Owner):</span>
                  <span className="font-semibold">{match.lostUserId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Recipient (Finder):</span>
                  <span className="font-semibold">{match.foundUserId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Date & Time:</span>
                  <span>{receiptData?.date || new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-bold text-[#0F172A]">Total Amount Paid:</span>
                  <span className="font-black text-[#10B981]">₹{rewardAmount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-[10px] text-[#10B981] font-semibold">
                <ShieldCheck size={14} /> Verified CampusConnect Transaction
              </div>
            </div>

            <button
              onClick={() => setStep('RATING')}
              className="w-full rounded-xl bg-[#1E3A8A] py-3 text-xs font-bold text-white hover:bg-[#2563EB] transition"
            >
              Proceed to Rate {partnerUser.name}
            </button>
          </div>
        )}

        {/* STEP 3: 5-STAR RATING & REVIEW */}
        {step === 'RATING' && (
          <div className="space-y-5 py-2">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-[#0F172A]">Rate your experience with {partnerUser.name}</h4>
              <p className="text-xs text-[#64748B]">Your rating builds trust in our campus community</p>
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
                        : 'fill-slate-100 text-slate-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Feedback & Review
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience returning/recovering this item..."
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={submittingRating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#2563EB] transition disabled:opacity-50"
              >
                {submittingRating ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                {ratingSubmitted ? 'Update Review' : 'Save Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
