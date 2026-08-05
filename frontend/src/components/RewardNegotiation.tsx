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
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-blue-950">Reward Offer</h3>
          <p className="text-xs text-blue-700 mt-1">
            {isLocked ? 'The reward amount is locked.' : isOwner ? 'You can edit the reward before it is accepted.' : 'Please accept or decline the owner\'s reward offer.'}
          </p>
        </div>
        <div className="text-right">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-1 text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div className="text-2xl font-black text-blue-900">₹{initialAmount}</div>
          )}
          <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isLocked ? 'text-emerald-600' : rewardStatus === 'Rejected' ? 'text-red-600' : 'text-amber-600'}`}>
            Status: {rewardStatus}
          </div>
        </div>
      </div>

      {!isLocked && (
        <div className="flex justify-end gap-3 pt-2">
          {isOwner ? (
            isEditing ? (
              <>
                <button
                  onClick={() => { setIsEditing(false); setAmount(initialAmount); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  Save Reward
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition"
              >
                <Edit2 size={14} /> Edit Offer
              </button>
            )
          ) : (
            <>
              <button
                onClick={handleDecline}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                disabled={loading}
              >
                <XCircle size={14} /> Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                disabled={loading}
              >
                <CheckCircle2 size={14} /> Accept Reward
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
