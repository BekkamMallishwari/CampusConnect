import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MessageSquare,
  Search,
  TriangleAlert,
  ArrowRight,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import {
  chatsApi,
  foundItemsApi,
  lostItemsApi,
  type FoundItemType,
  type LostItemType,
  type MessageType,
} from '../lib/api';

type SearchMessage = MessageType & { chatId: string; chatLabel: string };

const CAMPUS_BUILDINGS = [
  { id: 'b1', name: 'Main Academic Block (AB-1)', category: 'Academic', desc: 'Central administration, Computer Science, and Dean offices.', location: 'North Campus' },
  { id: 'b2', name: 'Central Library', category: 'Library', desc: '4-story study hall, digital archives, and quiet research zones.', location: 'Central Plaza' },
  { id: 'b3', name: 'Student Activity Center (SAC)', category: 'Student Hub', desc: 'Clubs, cafeteria, indoor games, and event auditorium.', location: 'South Campus' },
  { id: 'b4', name: 'Engineering Workshop & Labs', category: 'Research', desc: 'Mechanical workshops, AI robotics lab, and 3D printing studio.', location: 'East Campus' },
  { id: 'b5', name: 'Sports Complex & Gymnasium', category: 'Sports', desc: 'Basketball courts, swimming pool, and fitness center.', location: 'West Campus' },
  { id: 'b6', name: 'Science Research Center', category: 'Academic', desc: 'Physics, Chemistry, and Biotechnology research labs.', location: 'North-East Campus' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const [searchInput, setSearchInput] = useState(query);

  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found' | 'buildings' | 'messages'>('all');

  const [lostItems, setLostItems] = useState<LostItemType[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemType[]>([]);
  const [messages, setMessages] = useState<SearchMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const fetchSearchData = async () => {
      setLoading(true);
      try {
        const [lostRes, foundRes, chatRes] = await Promise.all([
          lostItemsApi.getAll().catch(() => ({ data: { items: [] } })),
          foundItemsApi.getAll().catch(() => ({ data: { items: [] } })),
          chatsApi.getAll().catch(() => ({ data: { chats: [] } })),
        ]);

        setLostItems(lostRes.data.items || []);
        setFoundItems(foundRes.data.items || []);

        const chatMessages = await Promise.all(
          (chatRes.data.chats || []).map(async (chat) => {
            try {
              const res = await chatsApi.getMessages(chat._id);
              return (res.data.messages || []).map((message) => ({
                ...message,
                chatId: chat._id,
                chatLabel:
                  chat.participants
                    .map((participant) => participant.name)
                    .filter(Boolean)
                    .join(', ') || 'Conversation',
              }));
            } catch {
              return [];
            }
          }),
        );

        setMessages(chatMessages.flat());
      } catch (error) {
        console.error('Search data load failed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  const normalizedQuery = searchInput.trim().toLowerCase();

  const filteredLost = useMemo(
    () =>
      lostItems.filter((item) =>
        [item.itemName, item.description, item.category, item.lostLocation, item.brand, item.color]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [lostItems, normalizedQuery],
  );

  const filteredFound = useMemo(
    () =>
      foundItems.filter((item) =>
        [item.itemName, item.description, item.category, item.foundLocation, item.condition]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [foundItems, normalizedQuery],
  );

  const filteredBuildings = useMemo(
    () =>
      CAMPUS_BUILDINGS.filter((b) =>
        [b.name, b.category, b.desc, b.location]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  const filteredMessages = useMemo(
    () =>
      messages.filter((msg) =>
        (msg.text || '').toLowerCase().includes(normalizedQuery),
      ),
    [messages, normalizedQuery],
  );

  const totalResults = filteredLost.length + filteredFound.length + filteredBuildings.length + filteredMessages.length;

  return (
    <PageTransition>
      <div className="space-y-8 py-4 pb-16">
        
        {/* Search Header Banner */}
        <section className="rounded-3xl border border-slate-300 bg-blue-900 p-6 text-white shadow-md dark:border-slate-800 sm:p-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Search size={14} /> University Directory Search
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
              {query ? `Search results for "${query}"` : 'Explore CampusConnect Directory'}
            </h1>
            <p className="text-xs font-semibold text-blue-100 sm:text-sm">
              Search lost items, found items, campus buildings, and chat archives in real time across the university.
            </p>

            <form onSubmit={handleSearchSubmit} className="relative mt-4 max-w-xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, description, category, brand, location..."
                className="h-12 w-full rounded-2xl border border-white/30 bg-white/15 pl-12 pr-28 text-sm font-semibold text-white placeholder:text-blue-200/70 focus:bg-blue-800 focus:outline-none focus:border-white/60 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white text-blue-900 px-4 py-2 text-xs font-bold hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-white"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-300 pb-4 dark:border-slate-800">
          {[
            { id: 'all', label: `All Results (${totalResults})` },
            { id: 'lost', label: `Lost Items (${filteredLost.length})` },
            { id: 'found', label: `Found Items (${filteredFound.length})` },
            { id: 'buildings', label: `Buildings (${filteredBuildings.length})` },
            { id: 'messages', label: `Messages (${filteredMessages.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">Searching university database...</p>
          </div>
        ) : totalResults === 0 ? (
          <EmptyState
            title="No search matches found"
            description={searchInput ? `No items or locations matched "${searchInput}". Try changing your search query.` : 'Type a search term above to explore.'}
          />
        ) : (
          <div className="space-y-10">
            {/* Lost Items */}
            {(activeTab === 'all' || activeTab === 'lost') && filteredLost.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <TriangleAlert size={18} className="text-amber-500" /> Lost Items ({filteredLost.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLost.map((item) => (
                    <Link
                      key={item._id}
                      to={`/lost-items/${item._id}`}
                      className="rounded-2xl border border-slate-300 bg-white p-5 space-y-3 shadow-2xs transition hover:border-blue-600 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 block"
                    >
                      <div className="flex items-start justify-between">
                        <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">{new Date(item.lostDate).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{item.itemName}</h3>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <MapPin size={13} className="text-blue-600" />
                        <span className="truncate">{item.lostLocation}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Found Items */}
            {(activeTab === 'all' || activeTab === 'found') && filteredFound.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <CheckCircle size={18} className="text-emerald-500" /> Found Items ({filteredFound.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredFound.map((item) => (
                    <Link
                      key={item._id}
                      to={`/found-items/${item._id}`}
                      className="rounded-2xl border border-slate-300 bg-white p-5 space-y-3 shadow-2xs transition hover:border-emerald-600 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 block"
                    >
                      <div className="flex items-start justify-between">
                        <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">{new Date(item.foundDate).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{item.itemName}</h3>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <MapPin size={13} className="text-emerald-600" />
                        <span className="truncate">{item.foundLocation}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Campus Buildings */}
            {(activeTab === 'all' || activeTab === 'buildings') && filteredBuildings.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <Building2 size={18} className="text-blue-600" /> Campus Buildings & Landmarks ({filteredBuildings.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBuildings.map((building) => (
                    <div key={building.id} className="rounded-2xl border border-slate-300 bg-white p-5 space-y-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {building.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">{building.location}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{building.name}</h3>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{building.desc}</p>
                      <Link
                        to="/campus-map"
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:underline pt-1 dark:text-blue-400"
                      >
                        View on Campus Map <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Messages */}
            {(activeTab === 'all' || activeTab === 'messages') && filteredMessages.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <MessageSquare size={18} className="text-indigo-600" /> Chat Messages ({filteredMessages.length})
                </h2>
                <div className="space-y-2">
                  {filteredMessages.map((msg) => (
                    <Link
                      key={msg._id}
                      to={`/messages`}
                      className="rounded-xl border border-slate-300 bg-white p-4 flex items-center justify-between shadow-2xs transition hover:border-indigo-600 dark:border-slate-800 dark:bg-slate-900 block"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{msg.chatLabel}</p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">{msg.text}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
