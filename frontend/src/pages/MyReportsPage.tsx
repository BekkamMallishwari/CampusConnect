import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { lostItemsApi, foundItemsApi, type LostItemType, type FoundItemType } from '../lib/api';
import ItemCard from '../components/ItemCard';

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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to remove report.');
    }
  };

  const handleDeleteFound = async (id: string) => {
    if (!confirm('Are you sure you want to remove this found item report?')) return;
    try {
      await foundItemsApi.delete(id);
      toast.success('Report removed.');
      setFoundItems(foundItems.filter((i) => i._id !== id));
    } catch (err) {
      toast.error('Failed to remove report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">My Reports</h1>
          <p className="mt-2 text-sm text-slate-400">Manage all lost or found items you have reported</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/lost-items/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus size={14} /> Report Lost
          </Link>
          <Link
            to="/found-items/new"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-700 hover:text-white"
          >
            <Plus size={14} /> Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900">
        <button
          onClick={() => setActiveTab('lost')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'lost' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Lost Reports ({lostItems.length})
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'found' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Found Reports ({foundItems.length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : activeTab === 'lost' ? (
        lostItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-16 text-center text-slate-400">
            You haven't reported any lost items yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-16 text-center text-slate-400">
          You haven't reported any found items yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
