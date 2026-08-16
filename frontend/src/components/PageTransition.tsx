import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`min-w-0 ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={`min-w-0 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export * from './animations/MotionComponents';

