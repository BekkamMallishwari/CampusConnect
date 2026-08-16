import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

export interface MotionProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * RevealOnScroll: subtle entrance when scrolling into the viewport
 * Opacity: 0 -> 1, translateY: 20px -> 0px
 */
export function RevealOnScroll({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
  ...props
}: MotionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeIn: subtle opacity fade in
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.45,
  className = '',
  ...props
}: MotionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer & StaggerItem for grids/lists
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
} & HTMLMotionProps<'div'>) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-20px' }}
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & HTMLMotionProps<'div'>) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
