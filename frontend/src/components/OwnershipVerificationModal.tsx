import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { matchesApi, type MatchType } from '../lib/api';
import { toast } from 'react-hot-toast';

interface OwnershipVerificationModalProps {
  match: MatchType;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OwnershipVerificationModal({
  match,
  currentUserId,
  onClose,
  onSuccess,
}: OwnershipVerificationModalProps) {
  const isOwner = match.lostUserId._id === currentUserId;
  const isFinder = match.foundUserId._id === currentUserId;

  // Owner Form State
  const [wallpaper, setWallpaper] = useState(match.verificationQuestions?.wallpaper || '');
  const [phoneCase, setPhoneCase] = useState(match.verificationQuestions?.phoneCase || '');
  const [uniqueStickers, setUniqueStickers] = useState(match.verificationQuestions?.uniqueStickers || '');
  const [serialNumber, setSerialNumber] = useState(match.verificationQuestions?.serialNumber || '');
  const [customDetails, setCustomDetails] = useState(match.verificationQuestions?.customDetails || '');
  
  // Finder Form State
  const [notes, setNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await matchesApi.verifyOwnership(match._id, {
        wallpaper,
        phoneCase,
        uniqueStickers,
        serialNumber,
        customDetails,
      });
      toast.success('Ownership verification details submitted! Finder notified.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit verification details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinderVerify = async (verified: boolean) => {
    setSubmitting(true);
    try {
      await matchesApi.finderVerify(match._id, { verified, notes });
      if (verified) {
        toast.success('Ownership verified! The item can now be marked returned.');
      } else {
        toast.error('Marked as not verified.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit verification status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl overflow-hidden rounded-[22px] shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Ownership Verification</h3>
              <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>Verify item identity before handover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Item Banner */}
          <div className="rounded-2xl p-4 flex items-center gap-4 border" style={{ borderColor: 'var(--glass-border)', background: 'rgba(99,102,241,0.04)' }}>
            {match.lostItemId.imageUrl && (
              <img
                src={match.lostItemId.imageUrl}
                alt="item preview"
                className="h-14 w-14 rounded-xl object-cover border"
                style={{ borderColor: 'var(--glass-border)' }}
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>{match.lostItemId.itemName}</h4>
              <p className="text-xs line-clamp-1" style={{ color: 'var(--dash-text-secondary)' }}>{match.lostItemId.description}</p>
            </div>
          </div>

          {/* Owner workflow */}
          {isOwner && (
            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                Provide specific details that only the true owner would know:
              </p>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Wallpaper / Lock Screen</label>
                <input
                  type="text"
                  value={wallpaper}
                  onChange={(e) => setWallpaper(e.target.value)}
                  placeholder="e.g. Photo of a sunset with trees"
                  className="glass-input h-10 w-full px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Case / Cover Style</label>
                <input
                  type="text"
                  value={phoneCase}
                  onChange={(e) => setPhoneCase(e.target.value)}
                  placeholder="e.g. Black silicone with card holder"
                  className="glass-input h-10 w-full px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Unique Stickers / Scratches</label>
                <input
                  type="text"
                  value={uniqueStickers}
                  onChange={(e) => setUniqueStickers(e.target.value)}
                  placeholder="e.g. Small scratch on bottom right corner"
                  className="glass-input h-10 w-full px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Serial Number / IMEI (Optional)</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. Last 4 digits of IMEI / Serial"
                  className="glass-input h-10 w-full px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Additional Proof Details</label>
                <textarea
                  rows={2}
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g. Inside pocket contains a blue flash drive"
                  className="glass-input w-full p-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="dash-btn-secondary py-2 px-5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="dash-btn-primary py-2 px-6 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>{submitting ? 'Submitting...' : 'Submit Verification'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Finder review workflow */}
          {isFinder && (
            <div className="space-y-4">
              <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                Review the answers provided by the owner below to confirm if they match the item:
              </p>

              <div className="rounded-2xl p-4 space-y-2 border" style={{ borderColor: 'var(--glass-border)', background: 'rgba(99,102,241,0.04)' }}>
                {match.verificationQuestions ? (
                  Object.entries(match.verificationQuestions)
                    .filter(([_, v]) => Boolean(v))
                    .map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="font-bold capitalize" style={{ color: 'var(--dash-text-primary)' }}>{k.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                        <span style={{ color: 'var(--dash-text-secondary)' }}>{v as string}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>No verification answers submitted yet.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Verification Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any verification comments..."
                  className="glass-input w-full p-3 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleFinderVerify(false)}
                  disabled={submitting}
                  className="dash-btn-secondary flex-1 py-2 text-xs font-bold"
                  style={{ color: '#e11d48', borderColor: 'rgba(244,63,94,0.3)' }}
                >
                  <XCircle size={14} />
                  <span>Reject Ownership</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFinderVerify(true)}
                  disabled={submitting}
                  className="dash-btn-primary flex-1 py-2 text-xs font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Verify & Approve</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
