import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, BadgeInfo, Layers3, Search, PackageSearch } from 'lucide-react';
import { lostItemsApi, foundItemsApi, type LostItemType, type FoundItemType } from '../lib/api';
import ItemCard from '../components/ItemCard';
import PageTransition from '../components/PageTransition';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function MyReportsPage() {
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [lostItems, setLostItems] = useState<LostItemType[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItemType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [lostRes, foundRes] = await Promise.all([
        lostItemsApi.getMyItems(),
        foundItemsApi.getMyItems(),
      ]);
      setLostItems(lostRes.data.items);
      setFoundItems(foundRes.data.items);
    } catch {
      toast.error('Failed to load your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteLost = async (id: string) => {
    if (!confirm('Are you sure you want to remove this lost item report?')) return;
    try {
      await lostItemsApi.delete(id);
      toast.success('Report removed.');
      setLostItems(lostItems.filter((i) => i._id !== id));
    } catch {
      toast.error('Failed to remove report.');
    }
  };

  const handleDeleteFound = async (id: string) => {
    if (!confirm('Are you sure you want to remove this found item report?')) return;
    try {
      await foundItemsApi.delete(id);
      toast.success('Report removed.');
      setFoundItems(foundItems.filter((i) => i._id !== id));
    } catch {
      toast.error('Failed to remove report.');
    }
  };

  return (
    <PageTransition className="space-y-6 py-2 pb-20">
      {/* Hero Glass Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/70 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60">
                <Layers3 size={13} />
                Personal Workspace
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100/80 dark:bg-slate-800/80 dark:text-slate-400">
                <BadgeInfo size={13} />
                Manage Reports
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              My Published Reports
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              Track all lost and found item reports you have published across campus. Edit details, verify AI match updates, or remove posts when returned.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/lost-items/new"
              className="dash-btn-primary py-2.5 px-5 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
            >
              <Plus size={15} /> Report Lost
            </Link>
            <Link
              to="/found-items/new"
              className="dash-btn-primary py-2.5 px-5 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <Plus size={15} /> Report Found
            </Link>
          </div>
        </div>
      </div>

      {/* Segmented Glass Tabs */}
      <div className="glass-panel p-1.5 flex gap-1.5 max-w-md">
        <button
          onClick={() => setActiveTab('lost')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition ${
            activeTab === 'lost'
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={{ color: activeTab === 'lost' ? '#ffffff' : 'var(--dash-text-secondary)' }}
        >
          <Search size={14} />
          <span>Lost Reports</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${activeTab === 'lost' ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700'}`}>
            {lostItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition ${
            activeTab === 'found'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={{ color: activeTab === 'found' ? '#ffffff' : 'var(--dash-text-secondary)' }}
        >
          <PackageSearch size={14} />
          <span>Found Reports</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${activeTab === 'found' ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700'}`}>
            {foundItems.length}
          </span>
        </button>
      </div>

      {/* Main Reports Grid */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : activeTab === 'lost' ? (
        lostItems.length === 0 ? (
          <EmptyState
            title="No lost item reports yet"
            description="Create a lost item report to begin receiving real-time campus AI matches and alerts."
            action={
              <Link to="/lost-items/new" className="dash-btn-primary py-2 px-5 text-xs font-bold">
                <Plus size={14} /> Report Lost
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {lostItems.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                type="lost"
                isOwner={true}
                onDelete={handleDeleteLost}
              />
            ))}
          </div>
        )
      ) : foundItems.length === 0 ? (
        <EmptyState
          title="No found item reports yet"
          description="Log any found item report to help return lost possessions to campus members."
          action={
            <Link to="/found-items/new" className="dash-btn-primary py-2 px-5 text-xs font-bold" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Plus size={14} /> Report Found
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {foundItems.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              type="found"
              isOwner={true}
              onDelete={handleDeleteFound}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
