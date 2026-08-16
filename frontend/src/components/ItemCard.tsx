import { Link } from 'react-router-dom';
import { Calendar, MapPin, Edit, Trash2, BadgeCheck, ExternalLink, Gift, Package } from 'lucide-react';
import type { LostItemType, FoundItemType } from '../lib/api';
import { AvatarBadge, PortalBadge, getPrimaryImage, formatCampusDate, getStatusTone } from './portal';

type ItemCardProps = {
  item: LostItemType | FoundItemType;
  type: 'lost' | 'found';
  isOwner?: boolean;
  onDelete?: (id: string) => void;
  confidence?: number;
};

export default function ItemCard({ item, type, isOwner = false, onDelete, confidence }: ItemCardProps) {
  const imageUrl = getPrimaryImage(item);
  const itemDate = type === 'lost' ? (item as LostItemType).lostDate : (item as FoundItemType).foundDate;
  const itemLocation = type === 'lost' ? (item as LostItemType).lostLocation : (item as FoundItemType).foundLocation;
  const itemRoute = type === 'lost' ? `/lost-items/${item._id}` : `/found-items/${item._id}`;
  const statusTone = getStatusTone(item.status);
  const rewardAmount = type === 'found' ? (item as FoundItemType).rewardAmount : undefined;

  return (
    <article className="glass-panel group flex flex-col justify-between overflow-hidden rounded-[20px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div>
        <Link to={itemRoute} className="block no-underline">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.itemName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Package size={38} />
                <span className="mt-1.5 text-[11px] font-semibold">No photo attached</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <PortalBadge tone={statusTone}>{item.status}</PortalBadge>
              <PortalBadge tone={type === 'lost' ? 'danger' : 'success'}>
                {type === 'lost' ? 'Lost' : 'Found'}
              </PortalBadge>
            </div>

            {confidence !== undefined && (
              <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                {confidence}% Match
              </span>
            )}

            {rewardAmount && rewardAmount > 0 && (
              <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-xs font-black text-white shadow-xs">
                <Gift size={12} />
                <span>₹{rewardAmount} Reward</span>
              </div>
            )}

            <div className="absolute bottom-3 left-3 right-3">
              <span className="inline-block rounded-full bg-slate-900/80 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-200 backdrop-blur-xs">
                {item.category}
              </span>
              <h3 className="mt-1 line-clamp-1 text-lg font-black text-white">{item.itemName}</h3>
            </div>
          </div>
        </Link>

        <div className="space-y-3 p-4 sm:p-4.5">
          <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
            {item.description}
          </p>

          <div className="grid gap-2 rounded-xl p-2.5 text-xs font-semibold sm:grid-cols-2" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--dash-text-primary)' }}>
              <Calendar size={13} className="text-indigo-500 shrink-0" />
              <span className="truncate text-[11.5px]">{formatCampusDate(itemDate)}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--dash-text-primary)' }}>
              <MapPin size={13} className="text-rose-500 shrink-0" />
              <span className="truncate text-[11.5px]">{itemLocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="border-t px-4 py-3 sm:px-4.5" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <AvatarBadge name={item.postedBy?.name} avatar={item.postedBy?.avatar} size="sm" />
            <span className="truncate text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>
              {item.postedBy?.name || 'Campus Member'}
            </span>
          </div>

          <Link
            to={itemRoute}
            className="dash-btn-secondary inline-flex items-center gap-1 py-1.5 px-3 text-[11.5px] font-bold"
          >
            <ExternalLink size={12} />
            <span>Details</span>
          </Link>
        </div>

        {isOwner && (
          <div className="mt-2.5 flex items-center justify-between border-t pt-2.5" style={{ borderColor: 'var(--glass-border)' }}>
            <PortalBadge tone="primary">
              <BadgeCheck size={11} />
              Your Post
            </PortalBadge>

            <div className="flex items-center gap-1.5">
              <Link
                to={type === 'lost' ? `/lost-items/edit/${item._id}` : `/found-items/edit/${item._id}`}
                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-text-primary)' }}
              >
                <Edit size={11} />
                Edit
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item._id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
