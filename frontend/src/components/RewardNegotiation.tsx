import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { rewardService } from '../services/rewardService';

interface RewardNegotiationProps {
  matchId: string;
  initialAmount: number;
  rewardStatus: string;
  isOwner: boolean;
  onUpdate: () => void;
}

export const RewardNegotiation: React.FC<RewardNegotiationProps> = ({
  matchId,
  initialAmount,
  rewardStatus,
  isOwner,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState<number>(initialAmount);
  const [loading, setLoading] = useState(false);

  const isLocked = rewardStatus === 'Accepted' || rewardStatus === 'Paid';

  const handleUpdate = async () => {
    if (amount <= 0) {
      toast.error('Reward must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      await rewardService.updateReward(matchId, amount);
      toast.success('Reward amount updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update reward');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await rewardService.acceptReward(matchId);
      toast.success('Reward accepted');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept reward');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await rewardService.declineReward(matchId);
      toast.success('Reward declined');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to decline reward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Reward Offer</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>
            {isLocked ? 'The reward amount is confirmed and locked.' : isOwner ? 'You can adjust the reward offer before it is confirmed.' : 'Please accept or decline the owner\'s reward offer.'}
          </p>
        </div>
        <div className="text-left sm:text-right">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="glass-input h-9 w-28 px-2 text-sm font-bold"
              />
            </div>
          ) : (
            <div className="text-2xl font-black" style={{ color: 'var(--dash-text-primary)' }}>₹{initialAmount}</div>
          )}
          <div className={`text-[10.5px] font-extrabold uppercase tracking-wider mt-1 ${isLocked ? 'text-emerald-600' : rewardStatus === 'Rejected' ? 'text-rose-600' : 'text-amber-500'}`}>
            STATUS: {rewardStatus ? rewardStatus.toUpperCase() : 'PENDING'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        {isOwner && !isLocked && (
          <>
            {isEditing ? (
              <>
                <button
                  disabled={loading}
                  onClick={handleUpdate}
                  className="dash-btn-primary py-2 px-4 text-xs font-bold shadow-md"
                >
                  Save Amount
                </button>
                <button
                  disabled={loading}
                  onClick={() => {
                    setAmount(initialAmount);
                    setIsEditing(false);
                  }}
                  className="dash-btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="dash-btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
              >
                <Edit2 size={13} /> Edit Offer
              </button>
            )}
          </>
        )}

        {!isOwner && !isLocked && (
          <>
            <button
              disabled={loading}
              onClick={handleAccept}
              className="dash-btn-primary py-2 px-4 text-xs font-bold shadow-md"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <CheckCircle2 size={14} /> Accept Offer
            </button>
            <button
              disabled={loading}
              onClick={handleDecline}
              className="dash-btn-secondary py-2 px-4 text-xs font-bold"
              style={{ color: '#e11d48', borderColor: 'rgba(244,63,94,0.3)' }}
            >
              <XCircle size={14} /> Decline Offer
            </button>
          </>
        )}
      </div>
    </div>
  );
};
