import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { motion, type MotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ComponentPropsWithoutRef<'button'> &
  MotionProps & {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
  };

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--primary),var(--secondary))] text-white shadow-[0_18px_40px_rgba(79,70,229,0.24)] hover:translate-y-[-1px] active:bg-[var(--primary-hover)]',
  secondary:
    'border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-[var(--surface)] active:bg-[var(--surface)]',
  danger:
    'bg-[var(--danger)] text-white shadow-[0_18px_36px_rgba(239,68,68,0.22)] hover:-translate-y-0.5 hover:bg-[#DC2626] active:bg-[#DC2626]',
  success:
    'bg-[var(--success)] text-white shadow-[0_18px_36px_rgba(34,197,94,0.22)] hover:-translate-y-0.5 hover:bg-[#059669] active:bg-[#059669]',
  ghost:
    'text-[var(--secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5 rounded-full',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-full',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[1rem]',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
