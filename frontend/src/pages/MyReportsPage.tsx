import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, BadgeInfo, Layers3 } from 'lucide-react';
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
    <PageTransition className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_28px_100px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                <Layers3 size={12} />
                Personal workspace
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                <BadgeInfo size={12} />
                Manage your reports
              </span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-slate-950">My reports</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Keep track of the lost and found items you have published, edit details, or remove posts when they’re no longer needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/lost-items/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus size={14} /> Report Lost
            </Link>
            <Link
              to="/found-items/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950"
            >
              <Plus size={14} /> Report Found
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
        <button
          onClick={() => setActiveTab('lost')}
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'lost' ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.16)]' : 'text-slate-500 hover:text-slate-950'
          }`}
        >
          Lost Reports ({lostItems.length})
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'found' ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.16)]' : 'text-slate-500 hover:text-slate-950'
          }`}
        >
          Found Reports ({foundItems.length})
        </button>
      </div>

      {loading ? (
        <GridSkeleton count={6} />
      ) : activeTab === 'lost' ? (
        lostItems.length === 0 ? (
          <EmptyState
            title="No lost reports yet"
            description="Create a lost item report to start receiving campus-wide AI matches."
            action={
            <Link to="/lost-items/new" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
              <Plus size={14} /> Report Lost
            </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
          title="No found reports yet"
          description="Share a found item report so CampusConnect can help reunite it with the owner."
          action={
            <Link to="/found-items/new" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
              <Plus size={14} /> Report Found
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
