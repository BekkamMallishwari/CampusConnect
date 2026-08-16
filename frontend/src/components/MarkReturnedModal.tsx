import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import { matchesApi, type MatchType } from '../lib/api';
import { toast } from 'react-hot-toast';

interface MarkReturnedModalProps {
  match: MatchType;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MarkReturnedModal({ match, onClose, onSuccess }: MarkReturnedModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await matchesApi.markReturned(match._id);
      toast.success('Item marked returned! Chat archived and reward & rating step opened.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark item returned.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md overflow-hidden rounded-[22px] p-6 shadow-2xl transition-all space-y-4">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-center space-y-3 pt-1 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
            <AlertTriangle size={26} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black" style={{ color: 'var(--dash-text-primary)' }}>Mark Item Returned?</h3>
            <p className="text-xs text-rose-500 font-bold">This action completes the item lifecycle.</p>
          </div>

          <p className="text-xs leading-relaxed px-2" style={{ color: 'var(--dash-text-secondary)' }}>
            Confirming will update both lost and found item reports to <strong>Returned</strong>, archive this active chat conversation, and unlock the Reward & Rating review workflow.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="dash-btn-secondary flex-1 py-2.5 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="dash-btn-primary flex-1 py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            <span>Confirm Returned</span>
          </button>
        </div>
      </div>
    </div>
  );
}
