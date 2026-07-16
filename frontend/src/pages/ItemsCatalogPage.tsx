import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { lostItemsApi, foundItemsApi, type LostItemType, type FoundItemType } from '../lib/api';
import ItemCard from '../components/ItemCard';

const CATEGORIES = ['All', 'Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];

type ItemsCatalogPageProps = {
  type: 'lost' | 'found';
};

export default function ItemsCatalogPage({ type }: ItemsCatalogPageProps) {
  const [items, setItems] = useState<Array<LostItemType | FoundItemType>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');

  const isLost = type === 'lost';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (sort) params.sort = sort;

      const res = isLost
        ? await lostItemsApi.getAll(params)
        : await foundItemsApi.getAll(params);
        
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, sort, type]);

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            {isLost ? 'Browse Lost Items' : 'Browse Found Items'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isLost ? 'Check items currently missing on campus' : 'Discover items found and reported by others'}
          </p>
        </div>

        <Link
          to={isLost ? '/lost-items/new' : '/found-items/new'}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
        >
          <Plus size={16} />
          {isLost ? 'Report Lost Item' : 'Report Found Item'}
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-900 bg-slate-900/30 p-6 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-2.5">
            <SlidersHorizontal size={15} className="text-slate-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-sm text-slate-300 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-350 outline-none focus:border-cyan-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-20 text-center text-slate-400">
          No items found matching the selected filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}
