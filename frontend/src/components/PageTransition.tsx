import React from 'react';
import { motion, type Variants } from 'framer-motion';

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 14,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: 'easeInOut',
    },
  },
};

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
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
