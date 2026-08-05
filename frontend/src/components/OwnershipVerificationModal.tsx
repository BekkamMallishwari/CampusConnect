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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#F8FAFC] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#1E3A8A]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Ownership Verification</h3>
              <p className="text-xs text-[#64748B]">Verify item identity before handover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Item Banner */}
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 flex items-center gap-4">
            {match.lostItemId.imageUrl && (
              <img
                src={match.lostItemId.imageUrl}
                alt={match.lostItemId.itemName}
                className="h-14 w-14 rounded-lg object-cover border border-slate-200"
              />
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">Matched Item</span>
              <h4 className="text-sm font-bold text-[#0F172A]">{match.lostItemId.itemName}</h4>
              <p className="text-xs text-[#64748B]">Lost by {match.lostUserId.name} • Found by {match.foundUserId.name}</p>
            </div>
          </div>

          {isOwner && (
            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              <p className="text-xs text-[#64748B] leading-relaxed">
                Please answer the following verification questions so the finder can verify your ownership:
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Wallpaper / Screen Lock details
                </label>
                <input
                  type="text"
                  value={wallpaper}
                  onChange={(e) => setWallpaper(e.target.value)}
                  placeholder="e.g. Sunset photo with mountain skyline"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Phone Case / Cover description
                </label>
                <input
                  type="text"
                  value={phoneCase}
                  onChange={(e) => setPhoneCase(e.target.value)}
                  placeholder="e.g. Matte black silicone case with card holder"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Unique Stickers / Scratches / Marks
                </label>
                <input
                  type="text"
                  value={uniqueStickers}
                  onChange={(e) => setUniqueStickers(e.target.value)}
                  placeholder="e.g. Small sticker of NASA logo on back bottom corner"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Serial Number / IMEI (Optional)
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN-8942104"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Other Unique Features / Secret Identifying Details
                </label>
                <textarea
                  rows={2}
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g. Contains 3 college ID cards inside case"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#2563EB] transition disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit Verification Details
                </button>
              </div>
            </form>
          )}

          {isFinder && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Owner's Verification Submission</h4>

              {match.verificationQuestions && match.verificationQuestions.submittedAt ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs">
                  {match.verificationQuestions.wallpaper && (
                    <div>
                      <span className="font-semibold text-[#64748B]">Wallpaper / Screen Lock: </span>
                      <span className="text-[#0F172A]">{match.verificationQuestions.wallpaper}</span>
                    </div>
                  )}
                  {match.verificationQuestions.phoneCase && (
                    <div>
                      <span className="font-semibold text-[#64748B]">Phone Case: </span>
                      <span className="text-[#0F172A]">{match.verificationQuestions.phoneCase}</span>
                    </div>
                  )}
                  {match.verificationQuestions.uniqueStickers && (
                    <div>
                      <span className="font-semibold text-[#64748B]">Unique Stickers / Marks: </span>
                      <span className="text-[#0F172A]">{match.verificationQuestions.uniqueStickers}</span>
                    </div>
                  )}
                  {match.verificationQuestions.serialNumber && (
                    <div>
                      <span className="font-semibold text-[#64748B]">Serial Number: </span>
                      <span className="text-[#0F172A]">{match.verificationQuestions.serialNumber}</span>
                    </div>
                  )}
                  {match.verificationQuestions.customDetails && (
                    <div>
                      <span className="font-semibold text-[#64748B]">Other Details: </span>
                      <span className="text-[#0F172A]">{match.verificationQuestions.customDetails}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  The item owner has not submitted verification details yet. You can still inspect their statements or verify directly.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Finder Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Stickers matched perfectly with item in hand"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleFinderVerify(false)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-[#EF4444] hover:bg-red-100 transition disabled:opacity-50"
                >
                  <XCircle size={14} /> Not Verified
                </button>
                <button
                  type="button"
                  onClick={() => handleFinderVerify(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#10B981] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Verified
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
