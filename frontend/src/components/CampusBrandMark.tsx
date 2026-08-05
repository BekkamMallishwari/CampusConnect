import { Sparkles } from 'lucide-react';

type CampusBrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export default function CampusBrandMark({ compact = false, className = '' }: CampusBrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_14px_34px_rgba(37,99,235,0.28)] ring-1 ring-white/40">
        <Sparkles size={22} className="fill-white" />
      </div>
      <div className={`min-w-0 ${compact ? 'block' : 'block'}`}>
        <div className="truncate text-[1.05rem] font-black tracking-tight text-slate-950 dark:text-white sm:text-[1.1rem]">
          Campus<span className="text-blue-600 dark:text-blue-400">Connect</span>
        </div>
        <div className="truncate text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 sm:text-[0.68rem]">
          University Portal
        </div>
      </div>
    </div>
  );
}
