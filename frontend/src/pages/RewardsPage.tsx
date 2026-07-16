import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Gift, Clock, CreditCard } from 'lucide-react';
import { paymentsApi, type PaymentType } from '../lib/api';

export default function RewardsPage() {
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await paymentsApi.getAll();
      setPayments(res.data.payments);
    } catch (err) {
      toast.error('Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Gift className="text-cyan-400" />
            Reward System & Payments
          </h1>
          <p className="mt-2 text-sm text-slate-400">Escrow history, payout transactions, and receipts</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-20 text-center text-slate-400">
          No reward payments found.
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((pmt) => (
            <div
              key={pmt._id}
              className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">${pmt.amount} USD</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    pmt.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {pmt.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  From owner <span className="font-semibold text-slate-350">{pmt.lostUserId.name}</span> to finder <span className="font-semibold text-slate-350">{pmt.foundUserId.name}</span>
                </p>
                <div className="flex items-center gap-2.5 text-[10px] text-slate-500 pt-1">
                  <Clock size={11} />
                  <span>{new Date(pmt.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/matches/${pmt.matchId}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs font-bold text-slate-300 hover:border-slate-700 transition"
                >
                  View Match Details
                </Link>
                {pmt.status === 'Completed' && (
                  <Link
                    to={pmt.receiptUrl || '#'}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                  >
                    <CreditCard size={12} />
                    Receipt
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
