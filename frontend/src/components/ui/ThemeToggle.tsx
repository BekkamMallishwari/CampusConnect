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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${className}`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Light mode' : 'Dark mode'}
    >
      {darkMode ? <SunMedium size={18} className="text-amber-400" /> : <Moon size={18} />}
    </button>
  );
}
