import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  MapPinned,
  MessageSquare,
  Sparkles,
  UserRound,
  CheckCircle2,
  Maximize2,
  X,
} from 'lucide-react';
import { chatsApi, foundItemsApi, lostItemsApi, matchesApi, type LostItemType, type FoundItemType, type MatchType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import { AvatarBadge, PortalBadge, PortalCard, PortalProgress, getPrimaryImage, formatCampusDate, getStatusTone } from '../components/portal';

type ItemDetailsPageProps = {
  type: 'lost' | 'found';
};

export default function ItemDetailsPage({ type }: ItemDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<LostItemType | FoundItemType | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  const isLost = type === 'lost';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [itemRes, matchRes] = await Promise.all([
          isLost ? lostItemsApi.getById(id) : foundItemsApi.getById(id),
          matchesApi.getAll(),
        ]);

        const fetchedItem = itemRes.data.item;
        const itemMatches = (matchRes.data.matches || []).filter((match) =>
          isLost ? match.lostItemId?._id === id : match.foundItemId?._id === id,
        );

        setItem(fetchedItem);
        setMatches(itemMatches);

        const primary = getPrimaryImage(fetchedItem) || fetchedItem.images?.find(Boolean) || '/campus_hero_bg.png';
        setSelectedImage(primary);
      } catch {
        toast.error('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isLost]);

  const activeMatch = useMemo(
    () => matches.find((match) => match.matchStatus !== 'Rejected') || null,
    [matches],
  );

  const isOwner = item?.postedBy._id === user?.id;
  const canContact = item && !isOwner && item.status !== 'Returned';
  const statusTone = getStatusTone(item?.status);

  const handleContactOwner = async () => {
    if (!item || !canContact) return;
    setContactLoading(true);
    try {
      const res = await chatsApi.contactOwner({
        itemId: item._id,
        ownerId: item.postedBy._id,
        itemType: type,
      });
      toast.success(res.data.created ? 'Conversation started.' : 'Conversation opened.');
      navigate(`/chats/${res.data.chat._id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to contact owner.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!item || !isOwner || item.status === 'Returned') return;
    if (!confirm('Mark this item as returned?')) return;
    setReturnLoading(true);
    try {
      const res = isLost ? await lostItemsApi.markReturned(item._id) : await foundItemsApi.markReturned(item._id);
      toast.success(res.data.message || 'Item marked as returned.');
      const refreshed = isLost ? await lostItemsApi.getById(item._id) : await foundItemsApi.getById(item._id);
      setItem(refreshed.data.item);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update item status.');
    } finally {
      setReturnLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!item) {
    return (
      <div className="py-20 text-center text-slate-500 dark:text-slate-300">
        Item report not found.
      </div>
    );
  }

  const gallery = Array.from(new Set([item.imageUrl, ...(item.images || [])].filter(Boolean) as string[]));
  const locationLabel = isLost ? (item as LostItemType).lostLocation : (item as FoundItemType).foundLocation;
  const dateLabel = isLost ? (item as LostItemType).lostDate : (item as FoundItemType).foundDate;
  const itemRoute = isLost ? `/lost-items/edit/${item._id}` : `/found-items/edit/${item._id}`;

  return (
    <PageTransition className="mx-auto max-w-7xl space-y-8 py-6 pb-20 px-4 sm:px-6">
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
          >
            <X size={24} />
          </button>
          <img
            src={selectedImage}
            alt={item.itemName}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {isOwner && (
          <Link
            to={itemRoute}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            Edit Report
          </Link>
        )}
      </div>

      {/* Main Grid */}
      <section className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Image Gallery & Lightbox */}
        <div className="lg:col-span-6 space-y-4">
          <PortalCard className="relative overflow-hidden p-3">
            <div className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-slate-950">
              <img
                src={selectedImage}
                alt={item.itemName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/70 text-white backdrop-blur-md opacity-0 transition group-hover:opacity-100"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {gallery.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === img
                        ? 'border-blue-600 ring-2 ring-blue-600/20'
                        : 'border-slate-200 opacity-70 hover:opacity-100 dark:border-slate-800'
                    }`}
                  >
                    <img src={img} alt={item.itemName} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </PortalCard>
        </div>

        {/* Right Column: Item Information & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <PortalCard className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <PortalBadge tone={statusTone}>{item.status}</PortalBadge>
              <PortalBadge tone={isLost ? 'danger' : 'success'}>
                {isLost ? 'Lost Item' : 'Found Item'}
              </PortalBadge>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {item.category}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              {item.itemName}
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {item.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPinned size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{locationLabel}</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Date</span>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  {formatCampusDate(dateLabel)}
                </p>
              </div>
            </div>

            {/* AI Match Badge */}
            {activeMatch && (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      AI Similarity Score
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Status: {activeMatch.matchStatus}
                    </p>
                  </div>
                  <PortalBadge tone="primary">
                    <Sparkles size={12} />
                    {activeMatch.matchPercentage}% match
                  </PortalBadge>
                </div>
                <div className="mt-3">
                  <PortalProgress value={activeMatch.matchPercentage} tone="primary" />
                </div>
              </div>
            )}

            {/* Action CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              {canContact && (
                <button
                  type="button"
                  onClick={handleContactOwner}
                  disabled={contactLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] disabled:opacity-50"
                >
                  <MessageSquare size={16} />
                  {contactLoading ? 'Opening Chat...' : 'Contact Owner'}
                </button>
              )}
              {isOwner && item.status !== 'Returned' && (
                <button
                  type="button"
                  onClick={handleMarkReturned}
                  disabled={returnLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <CheckCircle2 size={16} />
                  {returnLoading ? 'Updating...' : 'Mark as Returned'}
                </button>
              )}
            </div>
          </PortalCard>

          {/* Owner Card */}
          <PortalCard className="p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reported By
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Campus Contact</h3>
              </div>
              <PortalBadge tone={isOwner ? 'primary' : 'accent'}>
                <UserRound size={12} />
                {isOwner ? 'Your Post' : 'Verified Member'}
              </PortalBadge>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <AvatarBadge name={item.postedBy.name} avatar={item.postedBy.avatar} size="lg" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.postedBy.name}</h4>
                <p className="text-xs text-slate-500">{item.postedBy.email}</p>
              </div>
            </div>
          </PortalCard>
        </div>
      </section>
    </PageTransition>
  );
}
