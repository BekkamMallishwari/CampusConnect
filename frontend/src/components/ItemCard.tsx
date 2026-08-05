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
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div>
        <Link to={itemRoute} className="block">
          <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
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
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Package size={44} />
                <span className="mt-2 text-xs font-bold">No photo attached</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <PortalBadge tone={statusTone}>{item.status}</PortalBadge>
              <PortalBadge tone={type === 'lost' ? 'danger' : 'success'}>
                {type === 'lost' ? 'Lost' : 'Found'}
              </PortalBadge>
            </div>

            {confidence !== undefined && (
              <PortalBadge tone="accent" className="absolute right-3 top-3 shadow-xs">
                {confidence}% Match
              </PortalBadge>
            )}

            {rewardAmount && rewardAmount > 0 && (
              <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-xl bg-amber-500/95 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-xs">
                <Gift size={13} />
                <span>₹{rewardAmount} Reward</span>
              </div>
            )}

            <div className="absolute bottom-3 left-3 right-3">
              <span className="inline-block rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-200 backdrop-blur-xs">
                {item.category}
              </span>
              <h3 className="mt-1 line-clamp-1 text-lg font-extrabold text-white">{item.itemName}</h3>
            </div>
          </div>
        </Link>

        <div className="space-y-3.5 p-4 sm:p-5">
          <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {item.description}
          </p>

          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs font-bold dark:border-slate-800 dark:bg-slate-800/60 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="truncate">{formatCampusDate(itemDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin size={14} className="text-rose-600 dark:text-rose-400" />
              <span className="truncate">{itemLocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="border-t border-slate-200 px-4 py-3.5 dark:border-slate-800 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          {/* Posted By User info */}
          <div className="flex min-w-0 items-center gap-2">
            <AvatarBadge name={item.postedBy?.name} avatar={item.postedBy?.avatar} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                {item.postedBy?.name || 'Campus Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={itemRoute}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <ExternalLink size={13} />
              <span>View Details</span>
            </Link>
          </div>
        </div>

        {isOwner && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
            <PortalBadge tone="primary">
              <BadgeCheck size={12} />
              Your Post
            </PortalBadge>

            <div className="flex items-center gap-2">
              <Link
                to={type === 'lost' ? `/lost-items/edit/${item._id}` : `/found-items/edit/${item._id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <Edit size={12} />
                Edit
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item._id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400"
                >
                  <Trash2 size={12} />
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
