import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Search, ArrowUpDown, PackageSearch, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { foundItemsApi, lostItemsApi, type LostItemType, type FoundItemType } from '../lib/api';
import ItemCard from '../components/ItemCard';
import PageTransition from '../components/PageTransition';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { AnimatedCount } from '../components/dashboard/DashboardMotion';

const CATEGORIES = ['All', 'Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];

type ItemsCatalogPageProps = {
  type: 'lost' | 'found';
};

export default function ItemsCatalogPage({ type }: ItemsCatalogPageProps) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sort, setSort] = useState('newest');

  const isLost = type === 'lost';

  const { data: items = [], isLoading } = useQuery<Array<LostItemType | FoundItemType>>({
    queryKey: ['items', type, search, category, sort],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (sort) params.sort = sort;

      const res = isLost ? await lostItemsApi.getAll(params) : await foundItemsApi.getAll(params);
      return res.data.items || [];
    },
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return isLost ? lostItemsApi.delete(id) : foundItemsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted successfully.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete item.');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteMutation.mutate(id);
    }
  };

  const reportCount = useMemo(() => items.length, [items.length]);

  return (
    <PageTransition className="space-y-6 py-2 pb-20">
      {/* 1. Modern Glass Hero Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8 overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs"
                style={{
                  background: isLost
                    ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                }}
              >
                {isLost ? <Search size={12} /> : <PackageSearch size={12} />}
                {isLost ? 'Lost Items Catalog' : 'Found Items Catalog'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              {isLost ? 'Reported Lost Items' : 'Reported Found Items'}
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              {isLost
                ? 'Browse items reported lost across campus. Search by keyword, filter by category, or review match statuses.'
                : 'Browse items found by campus community members. Search here to locate and reclaim your missing belongings.'}
            </p>
          </div>

          <Link
            to={isLost ? '/lost-items/new' : '/found-items/new'}
            className="dash-btn-primary shrink-0 py-3 px-6 text-sm font-bold shadow-md"
          >
            <Plus size={16} />
            <span>{isLost ? 'Report Lost Item' : 'Report Found Item'}</span>
          </Link>
        </div>
      </div>

      {/* 2. Glass Stat KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="glass-stat-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
              Total {isLost ? 'Lost Reports' : 'Found Reports'}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>
              <AnimatedCount value={reportCount} />
            </p>
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
            style={{
              background: isLost
                ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                : 'linear-gradient(135deg, #10b981, #059669)',
            }}
          >
            <Layers size={20} />
          </div>
        </div>

        <div className="glass-stat-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
              Active Category
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-bold truncate max-w-[180px]" style={{ color: 'var(--dash-text-primary)' }}>
              {category}
            </p>
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Filter size={20} />
          </div>
        </div>

        <div className="glass-stat-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
              Sort Ordering
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-bold" style={{ color: 'var(--dash-text-primary)' }}>
              {sort === 'newest' ? 'Newest First' : 'Oldest First'}
            </p>
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          >
            <ArrowUpDown size={20} />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="glass-panel p-4 sm:p-5 space-y-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
          <div className="relative min-w-0">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--dash-text-muted)' }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item title, brand, location, description..."
              className="glass-input h-11 w-full pl-10 pr-4 text-xs sm:text-sm font-medium outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="shrink-0" style={{ color: 'var(--dash-text-muted)' }} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input h-11 px-3.5 text-xs sm:text-sm font-semibold outline-none transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="shrink-0" style={{ color: 'var(--dash-text-muted)' }} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="glass-input h-11 px-3.5 text-xs sm:text-sm font-semibold outline-none transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Category quick-pill row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`glass-tab-pill text-xs py-1.5 px-3 rounded-xl ${category === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Items Grid or Empty State */}
      {isLoading ? (
        <GridSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title={isLost ? 'No Lost Items Found' : 'No Found Items'}
          description={
            search || category !== 'All'
              ? 'No items match your active search filters. Try clearing your search keyword or switching category.'
              : isLost
                ? 'There are no lost items reported yet. Report a lost item to get started.'
                : 'There are no found items reported yet. Report a found item to help return it to its owner.'
          }
          action={
            <Link
              to={isLost ? '/lost-items/new' : '/found-items/new'}
              className="dash-btn-primary py-2.5 px-5 text-xs font-bold"
            >
              <Plus size={15} />
              <span>{isLost ? 'Report Lost Item' : 'Report Found Item'}</span>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              type={type}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
