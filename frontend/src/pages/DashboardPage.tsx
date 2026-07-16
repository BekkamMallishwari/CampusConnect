import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { lostItemsApi, foundItemsApi, matchesApi, chatsApi, type LostItemType, type FoundItemType, type MatchType, type ChatType } from '../lib/api';
import ItemCard from '../components/ItemCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [lostItems, setLostItems] = useState<LostItemType[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemType[]>([]);
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lostRes, foundRes, matchesRes, chatsRes] = await Promise.all([
          lostItemsApi.getAll({ limit: 4 }),
          foundItemsApi.getAll({ limit: 4 }),
          matchesApi.getAll(),
          chatsApi.getAll(),
        ]);
        setLostItems(lostRes.data.items.slice(0, 4));
        setFoundItems(foundRes.data.items.slice(0, 4));
        setMatches(matchesRes.data.matches.filter(m => m.matchStatus === 'Pending'));
        setChats(chatsRes.data.chats);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { name: 'My Posts', value: lostItems.filter(i => i.postedBy._id === user?.id).length + foundItems.filter(i => i.postedBy._id === user?.id).length, icon: FileText, color: 'from-cyan-500 to-blue-500' },
    { name: 'Pending Matches', value: matches.length, icon: Sparkles, color: 'from-amber-500 to-orange-500' },
    { name: 'Active Chats', value: chats.length, icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/10 p-8 md:p-12 shadow-2xl shadow-cyan-950/10">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
            <Sparkles size={12} />
            Smart Matching Active
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Welcome back, {user?.name.split(' ')[0]}.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-350">
            CampusConnect Lost & Found is tracking reported items. If similarity scores overlap, you'll be notified of possible matches instantly.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/lost-items/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/15"
            >
              <PlusCircle size={16} />
              Report Lost Item
            </Link>
            <Link
              to="/found-items/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              <Search size={16} />
              Report Found Item
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="flex items-center justify-between rounded-3xl border border-slate-900 bg-slate-900/35 p-6 backdrop-blur-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-405">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${stat.color} text-slate-950 shadow-md`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of matches and posts */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Items feed */}
        <div className="lg:col-span-2 space-y-10">
          {/* Lost Items feed */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Recent Lost Reports</h2>
                <p className="text-sm text-slate-400">Items recently reported missing by campus students</p>
              </div>
              <Link to="/lost-items" className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition">
                View All <ArrowRight size={13} />
              </Link>
            </div>

            {lostItems.length === 0 ? (
              <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-12 text-center text-slate-400">
                No items lost yet.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {lostItems.map((item) => (
                  <ItemCard key={item._id} item={item} type="lost" isOwner={item.postedBy._id === user?.id} />
                ))}
              </div>
            )}
          </div>

          {/* Found Items feed */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Recent Found Reports</h2>
                <p className="text-sm text-slate-400">Items discovered around campus waiting for owners</p>
              </div>
              <Link to="/found-items" className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition">
                View All <ArrowRight size={13} />
              </Link>
            </div>

            {foundItems.length === 0 ? (
              <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-12 text-center text-slate-400">
                No items found yet.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {foundItems.map((item) => (
                  <ItemCard key={item._id} item={item} type="found" isOwner={item.postedBy._id === user?.id} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Active matches & chats */}
        <div className="space-y-8">
          {/* Matches Panel */}
          <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">Pending Matches</h3>
            <p className="text-xs text-slate-400">Requires verification to open chat channels</p>

            <div className="mt-6 space-y-4">
              {matches.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-405">
                  No pending matches to verify.
                </div>
              ) : (
                matches.slice(0, 4).map((match) => (
                  <Link
                    key={match._id}
                    to={`/matches/${match._id}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-850 bg-slate-950/40 p-4 transition hover:bg-slate-900/40"
                  >
                    <div className="space-y-1 truncate">
                      <p className="text-sm font-semibold text-white truncate">
                        {match.lostItemId.itemName} ⟷ {match.foundItemId.itemName}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> Confidence: {match.matchPercentage}%
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                      View
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Chats Panel */}
          <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">Active Handovers</h3>
            <p className="text-xs text-slate-400">Private communication lines with other students</p>

            <div className="mt-6 space-y-4">
              {chats.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-405">
                  No active chats.
                </div>
              ) : (
                chats.slice(0, 4).map((chat) => {
                  const counterpart = chat.participants.find((p) => p.id !== user?.id);
                  return (
                    <Link
                      key={chat._id}
                      to={`/chats/${chat._id}`}
                      className="flex items-center gap-3.5 rounded-2xl border border-slate-850 bg-slate-950/40 p-4 transition hover:bg-slate-900/40"
                    >
                      {counterpart?.avatar ? (
                        <img src={counterpart.avatar} alt={counterpart.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-950 text-xs font-semibold text-indigo-400 uppercase">
                          {counterpart?.name.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{counterpart?.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {chat.lastMessage?.text || 'Sent an attachment.'}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
