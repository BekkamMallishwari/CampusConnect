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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-center space-y-4 pt-1 pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 border border-amber-200">
            <AlertTriangle size={28} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#0F172A]">Mark Item Returned?</h3>
            <p className="text-xs text-[#EF4444] font-semibold">This action cannot be undone.</p>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed px-4">
            Confirming will update the status of both lost and found item reports to <strong>Returned</strong>, archive the active chat conversation, and open the Reward & Rating workflow.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#2563EB] transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Confirm Returned
          </button>
        </div>
      </div>
    </div>
  );
}
