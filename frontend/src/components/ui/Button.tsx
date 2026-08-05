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
    'bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)] active:bg-[var(--primary-hover)]',
  secondary:
    'border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm hover:bg-[var(--surface)] active:bg-[var(--surface)]',
  danger:
    'bg-[var(--danger)] text-white shadow-sm hover:bg-[#DC2626] active:bg-[#DC2626]',
  success:
    'bg-[var(--success)] text-white shadow-sm hover:bg-[#059669] active:bg-[#059669]',
  ghost:
    'text-[var(--secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-[13px] gap-2 rounded-lg',
  lg: 'h-10 px-5 text-sm gap-2 rounded-xl',
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
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
