import { PackageX } from 'lucide-react';

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export default function EmptyState({ 
  title = 'No items found', 
  description = "We couldn't find any items matching your criteria." 
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-3xl border border-slate-800 border-dashed bg-slate-900/50 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-400">
        <PackageX size={32} />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400">{description}</p>
    </div>
  );
}
