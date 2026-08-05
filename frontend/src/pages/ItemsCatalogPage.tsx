import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Search, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { foundItemsApi, lostItemsApi, type LostItemType, type FoundItemType } from '../lib/api';
import ItemCard from '../components/ItemCard';
import PageTransition from '../components/PageTransition';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

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
    <PageTransition className="space-y-8 py-4 pb-16">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {isLost ? 'Lost Items Catalog' : 'Found Items Catalog'}
          </span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {isLost ? 'Reported Lost Items' : 'Reported Found Items'}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-semibold text-slate-600 dark:text-slate-300">
            {isLost
              ? 'Browse items reported lost across campus. Search by keyword, category, or location.'
              : 'Browse items found by campus members. Search to claim your missing belongings.'}
          </p>
        </div>

        <Link
          to={isLost ? '/lost-items/new' : '/found-items/new'}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <Plus size={18} />
          <span>{isLost ? 'Report Lost Item' : 'Report Found Item'}</span>
        </Link>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase text-slate-500">Total Items</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{reportCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase text-slate-500">Active Category</p>
          <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">{category}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase text-slate-500">Sort Order</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {sort === 'newest' ? 'Newest First' : 'Oldest First'}
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, category, brand, location..."
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500 dark:text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 transition outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-slate-500 dark:text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-12 min-w-[160px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 transition outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid or Empty State */}
      {isLoading ? (
        <GridSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title={isLost ? 'No Lost Items Found' : 'No Found Items'}
          description={
            search || category !== 'All'
              ? 'No items match your search filters. Try clearing your search or changing the category.'
              : isLost
                ? 'There are no lost items reported yet. Report a lost item to get started.'
                : 'There are no found items reported yet. Report a found item to help return it to its owner.'
          }
          action={
            <Link
              to={isLost ? '/lost-items/new' : '/found-items/new'}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>{isLost ? 'Report Lost Item' : 'Report Found Item'}</span>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
