import { Sparkles } from 'lucide-react';

type CampusBrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export default function CampusBrandMark({ compact = false, className = '' }: CampusBrandMarkProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md ring-1 ring-white/30">
        <Sparkles size={compact ? 18 : 20} className="fill-white" />
      </div>
      <div className={`min-w-0 ${compact ? 'hidden sm:block' : 'block'}`}>
        <div className="truncate text-[1rem] font-black tracking-tight text-slate-950 dark:text-white leading-none">
          Campus<span className="text-blue-600 dark:text-blue-400">Connect</span>
        </div>
        <div className="truncate text-[9.5px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mt-1 leading-none">
          University Portal
        </div>
      </div>
    </div>
  );
}


