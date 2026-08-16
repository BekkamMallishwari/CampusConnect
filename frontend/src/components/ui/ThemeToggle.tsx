import { SunMedium, Moon } from 'lucide-react';

type ThemeToggleProps = {
  darkMode: boolean;
  onToggle: () => void;
  className?: string;
};

export function ThemeToggle({ darkMode, onToggle, className = '' }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/75 bg-white/75 text-[var(--secondary)] shadow-[0_10px_22px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:bg-white/90 hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${className}`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Light mode' : 'Dark mode'}
    >
      {darkMode ? <SunMedium size={18} className="text-amber-400" /> : <Moon size={18} />}
    </button>
  );
}
