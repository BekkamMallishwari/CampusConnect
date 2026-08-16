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
import EmptyState from '../components/ui/EmptyState';
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
    <PageTransition className="space-y-6 py-2 pb-24">
      {/* 1. Hero Search Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Search size={12} /> University Directory Search
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
            {query ? `Results for "${query}"` : 'Explore CampusConnect Directory'}
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
            Search lost items, found items, campus buildings, and chat messages in real time.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative mt-4 max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--dash-text-muted)' }} />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, description, category, location..."
              className="glass-input h-12 w-full pl-11 pr-28 text-xs font-semibold"
            />
            <button
              type="submit"
              className="dash-btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 py-2 px-4 text-xs font-bold shadow-xs"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
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
            className={`glass-tab-pill px-4 py-2 text-xs font-bold ${
              activeTab === tab.id ? 'active' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-2 text-xs" style={{ color: 'var(--dash-text-muted)' }}>Searching university database...</p>
        </div>
      ) : totalResults === 0 ? (
        <EmptyState
          title="No search matches found"
          description={searchInput ? `No records matched "${searchInput}". Try adjusting your keywords.` : 'Enter keywords above to start searching.'}
        />
      ) : (
        <div className="space-y-8">
          {/* Lost Items */}
          {(activeTab === 'all' || activeTab === 'lost') && filteredLost.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>
                <TriangleAlert size={18} className="text-rose-500" /> Lost Items ({filteredLost.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLost.map((item) => (
                  <Link
                    key={item._id}
                    to={`/lost-items/${item._id}`}
                    className="glass-panel p-5 space-y-3 transition hover:shadow-lg block"
                    style={{ borderColor: 'rgba(244,63,94,0.2)' }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-600 border border-rose-500/20">
                        {item.category}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{new Date(item.lostDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>{item.itemName}</h3>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--dash-text-secondary)' }}>{item.description}</p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--dash-text-muted)' }}>
                      <MapPin size={13} className="text-rose-500" />
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
              <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>
                <CheckCircle size={18} className="text-emerald-500" /> Found Items ({filteredFound.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFound.map((item) => (
                  <Link
                    key={item._id}
                    to={`/found-items/${item._id}`}
                    className="glass-panel p-5 space-y-3 transition hover:shadow-lg block"
                    style={{ borderColor: 'rgba(16,185,129,0.2)' }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600 border border-emerald-500/20">
                        {item.category}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{new Date(item.foundDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>{item.itemName}</h3>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--dash-text-secondary)' }}>{item.description}</p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--dash-text-muted)' }}>
                      <MapPin size={13} className="text-emerald-500" />
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
              <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>
                <Building2 size={18} className="text-indigo-500" /> Campus Landmarks ({filteredBuildings.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBuildings.map((building) => (
                  <div key={building.id} className="glass-panel p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-600 border border-indigo-500/20">
                        {building.category}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{building.location}</span>
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>{building.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>{building.desc}</p>
                    <Link
                      to="/campus-map"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500 hover:underline pt-1"
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
              <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>
                <MessageSquare size={18} className="text-indigo-500" /> Chat Messages ({filteredMessages.length})
              </h2>
              <div className="space-y-2">
                {filteredMessages.map((msg) => (
                  <Link
                    key={msg._id}
                    to="/messages"
                    className="glass-action-card p-4 flex items-center justify-between block"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-bold text-indigo-500">{msg.chatLabel}</p>
                      <p className="text-xs font-medium truncate mt-0.5" style={{ color: 'var(--dash-text-primary)' }}>{msg.text}</p>
                    </div>
                    <span className="shrink-0 text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageTransition>
  );
}
