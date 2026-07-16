import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, Edit, Trash2 } from 'lucide-react';
import type { LostItemType, FoundItemType } from '../lib/api';

type ItemCardProps = {
  item: LostItemType | FoundItemType;
  type: 'lost' | 'found';
  isOwner?: boolean;
  onDelete?: (id: string) => void;
};

export default function ItemCard({ item, type, isOwner = false, onDelete }: ItemCardProps) {
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://picsum.photos/seed/placeholder/600/400';
  const itemDate = type === 'lost' ? (item as LostItemType).lostDate : (item as FoundItemType).foundDate;
  const itemLocation = type === 'lost' ? (item as LostItemType).lostLocation : (item as FoundItemType).foundLocation;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Returned':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Matched':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Waiting':
      case 'Pending':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const formattedDate = new Date(itemDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:border-slate-800 hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-cyan-950/10">
      <Link to={type === 'lost' ? `/lost-items/${item._id}` : `/found-items/${item._id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            src={imageUrl}
            alt={item.itemName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${getStatusStyle(item.status)}`}>
              {item.status}
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-950/75 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
              {type === 'lost' ? 'Lost' : 'Found'}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <Link to={type === 'lost' ? `/lost-items/${item._id}` : `/found-items/${item._id}`}>
          <h3 className="text-lg font-bold text-white transition hover:text-cyan-400 line-clamp-1">{item.itemName}</h3>
        </Link>
        <p className="mt-2 text-sm text-slate-400 line-clamp-2">{item.description}</p>

        <div className="mt-4 space-y-2 border-t border-slate-900/60 pt-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Tag size={13} className="text-cyan-400/80" />
            <span className="truncate">{item.category}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Calendar size={13} className="text-cyan-400/80" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <MapPin size={13} className="text-cyan-400/80" />
            <span className="truncate">{itemLocation}</span>
          </div>
        </div>

        {isOwner && (
          <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-900/60 pt-4">
            <Link
              to={type === 'lost' ? `/lost-items/edit/${item._id}` : `/found-items/edit/${item._id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-1.5 text-xs font-semibold text-slate-350 transition hover:border-slate-700 hover:text-white"
            >
              <Edit size={12} />
              Edit
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(item._id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-950/30 bg-rose-950/10 px-3.5 py-1.5 text-xs font-semibold text-rose-455 transition hover:border-rose-900/40 hover:bg-rose-950/30 hover:text-rose-400"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
