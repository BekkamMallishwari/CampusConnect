import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { matchesApi, type MatchType } from '../lib/api';

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const res = await matchesApi.getAll();
      setMatches(res.data.matches);
    } catch (err) {
      toast.error('Failed to load matching records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await matchesApi.accept(id);
      toast.success('Match accepted!');
      fetchMatches();
    } catch (err) {
      toast.error('Failed to accept match.');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to dismiss this match?')) return;
    try {
      await matchesApi.reject(id);
      toast.success('Match dismissed.');
      fetchMatches();
    } catch (err) {
      toast.error('Failed to decline match.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="text-cyan-400" />
            Detected Matches
          </h1>
          <p className="mt-2 text-sm text-slate-400">Potential item overlaps detected by similarity scans</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-20 text-center text-slate-400">
          No matches detected yet. Scans run automatically on report uploads.
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <div
              key={match._id}
              className="rounded-3xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm space-y-6"
            >
              {/* Top summary line */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                    {match.matchPercentage}% Confidence Match
                  </span>
                  <span className="text-xs text-slate-500">
                    Status: <span className="font-semibold text-slate-300">{match.matchStatus}</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  {match.matchStatus === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleVerify(match._id)}
                        className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                      >
                        Accept Match
                      </button>
                      <button
                        onClick={() => handleReject(match._id)}
                        className="rounded-xl border border-rose-950/30 bg-rose-950/10 px-4 py-2 text-xs font-bold text-rose-455 hover:bg-rose-950/30 transition"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {(match.matchStatus === 'Accepted' || match.matchStatus === 'Verified') && (
                    <Link
                      to="/chats"
                      className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-400 transition"
                    >
                      Open Chat
                    </Link>
                  )}
                </div>
              </div>

              {/* Grid comparison */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Lost Item Details */}
                <div className="rounded-2xl bg-slate-950/40 p-4 border border-slate-900/50">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">🔴 Lost Item Details</span>
                  <Link to={`/lost-items/${match.lostItemId._id}`}>
                    <h3 className="mt-2 text-lg font-bold text-white hover:text-cyan-400 transition">{match.lostItemId.itemName}</h3>
                  </Link>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-3">{match.lostItemId.description}</p>
                </div>

                {/* Found Item Details */}
                <div className="rounded-2xl bg-slate-950/40 p-4 border border-slate-900/50">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">🟢 Found Item Details</span>
                  <Link to={`/found-items/${match.foundItemId._id}`}>
                    <h3 className="mt-2 text-lg font-bold text-white hover:text-cyan-400 transition">{match.foundItemId.itemName}</h3>
                  </Link>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-3">{match.foundItemId.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
