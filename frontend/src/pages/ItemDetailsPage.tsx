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
  Edit,
  Gift,
} from 'lucide-react';
import { chatsApi, foundItemsApi, lostItemsApi, matchesApi, type LostItemType, type FoundItemType, type MatchType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import { AvatarBadge, PortalBadge, PortalProgress, getPrimaryImage, formatCampusDate, getStatusTone } from '../components/portal';

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

        const primary = getPrimaryImage(fetchedItem) || fetchedItem.images?.find(Boolean) || '';
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
      <div className="glass-panel py-20 text-center" style={{ color: 'var(--dash-text-muted)' }}>
        Item report not found.
      </div>
    );
  }

  const gallery = Array.from(new Set([item.imageUrl, ...(item.images || [])].filter(Boolean) as string[]));
  const locationLabel = isLost ? (item as LostItemType).lostLocation : (item as FoundItemType).foundLocation;
  const dateLabel = isLost ? (item as LostItemType).lostDate : (item as FoundItemType).foundDate;
  const itemRoute = isLost ? `/lost-items/edit/${item._id}` : `/found-items/edit/${item._id}`;
  const rewardAmount = (item as any).rewardAmount;

  return (
    <PageTransition className="mx-auto max-w-6xl space-y-6 py-4 pb-20 px-2 sm:px-4">
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition"
          >
            <X size={22} />
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
          to={isLost ? '/lost-items' : '/found-items'}
          className="dash-btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold"
        >
          <ArrowLeft size={14} /> Back to Catalog
        </Link>

        {isOwner && (
          <Link
            to={itemRoute}
            className="dash-btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-bold"
          >
            <Edit size={13} /> Edit Report
          </Link>
        )}
      </div>

      {/* Main Details Grid */}
      <section className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Image Media Viewer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel overflow-hidden p-3.5">
            <div className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-slate-950/80 flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={item.itemName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="text-slate-400 text-xs font-semibold">No photo attached</div>
              )}
              {selectedImage && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/70 text-white backdrop-blur-md opacity-0 transition group-hover:opacity-100"
                >
                  <Maximize2 size={15} />
                </button>
              )}
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
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={item.itemName} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Item Information & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <PortalBadge tone={statusTone}>{item.status}</PortalBadge>
              <PortalBadge tone={isLost ? 'danger' : 'success'}>
                {isLost ? 'Lost Item' : 'Found Item'}
              </PortalBadge>
              <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
                {item.category}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                {item.itemName}
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
                {item.description}
              </p>
            </div>

            {rewardAmount && rewardAmount > 0 && (
              <div className="flex items-center gap-2 rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Gift size={16} className="shrink-0" />
                <span className="text-xs font-bold">Reward Offered: ₹{rewardAmount}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <div className="flex items-center gap-1.5 text-indigo-500">
                  <MapPinned size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                </div>
                <p className="mt-1 text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{locationLabel}</p>
              </div>

              <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <div className="flex items-center gap-1.5 text-rose-500">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Date</span>
                </div>
                <p className="mt-1 text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>
                  {formatCampusDate(dateLabel)}
                </p>
              </div>
            </div>

            {/* AI Match Badge */}
            {activeMatch && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      AI Similarity Score
                    </span>
                    <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--dash-text-primary)' }}>
                      Status: {activeMatch.matchStatus}
                    </p>
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                    <Sparkles size={11} className="inline mr-1" />
                    {activeMatch.matchPercentage}% match
                  </span>
                </div>
                <div className="mt-2.5">
                  <PortalProgress value={activeMatch.matchPercentage} tone="primary" />
                </div>
              </div>
            )}

            {/* Action CTAs */}
            <div className="flex flex-wrap gap-3 pt-2">
              {canContact && (
                <button
                  type="button"
                  onClick={handleContactOwner}
                  disabled={contactLoading}
                  className="dash-btn-primary py-2.5 px-6 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  <MessageSquare size={14} />
                  {contactLoading ? 'Opening Chat...' : 'Contact Reporter'}
                </button>
              )}
              {isOwner && item.status !== 'Returned' && (
                <button
                  type="button"
                  onClick={handleMarkReturned}
                  disabled={returnLoading}
                  className="dash-btn-secondary inline-flex items-center gap-1.5 py-2.5 px-5 text-xs font-bold disabled:opacity-50"
                  style={{ color: '#059669', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}
                >
                  <CheckCircle2 size={14} />
                  {returnLoading ? 'Updating...' : 'Mark as Returned'}
                </button>
              )}
            </div>
          </div>

          {/* Reporter Profile Box */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
                  Reported By
                </span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>Campus Member</h3>
              </div>
              <PortalBadge tone={isOwner ? 'primary' : 'accent'}>
                <UserRound size={11} />
                {isOwner ? 'Your Post' : 'Verified Student'}
              </PortalBadge>
            </div>

            <div className="mt-3.5 flex items-center gap-3.5">
              <AvatarBadge name={item.postedBy.name} avatar={item.postedBy.avatar} size="md" />
              <div>
                <h4 className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{item.postedBy.name}</h4>
                <p className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{item.postedBy.email}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
