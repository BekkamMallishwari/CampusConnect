import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from 'framer-motion';

import campus1 from '../../assets/campus/campus-01.jpg';
import campus2 from '../../assets/campus/campus-02.jpg';
import campus3 from '../../assets/campus/campus-03.jpg';
import campus4 from '../../assets/campus/campus-04.jpg';
import campus5 from '../../assets/campus/campus-05.jpg';

type HeroImage = {
  src: string;
  alt: string;
  focal?: string;
  title: string;
};

const HERO_IMAGES: HeroImage[] = [
  { src: campus1, alt: 'University main building with clock tower and green quad', focal: 'center 40%', title: 'University Main Hall & Quad' },
  { src: campus2, alt: 'Modern university lecture hall and study space', focal: 'center 35%', title: 'Academic Learning Commons' },
  { src: campus3, alt: 'Green campus walkway with students and modern facilities', focal: 'center 45%', title: 'Campus Green Walkway' },
  { src: campus4, alt: 'University library and student quad plaza', focal: 'center 40%', title: 'Library & Student Center' },
  { src: campus5, alt: 'University entrance arch and floral courtyard', focal: 'center 38%', title: 'Campus Entrance & Courtyard' },
];

export const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const heroSectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const cardRevealVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};



export function DashboardBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute left-[-10%] top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-sky-200/50 blur-3xl"
        animate={reduceMotion ? { opacity: 0.65 } : { x: [0, 20, 0], y: [0, -14, 0], opacity: [0.52, 0.78, 0.52] }}
        transition={reduceMotion ? { duration: 0.2 } : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-8rem] top-[8rem] h-[30rem] w-[30rem] rounded-full bg-violet-200/45 blur-3xl"
        animate={reduceMotion ? { opacity: 0.55 } : { x: [0, -18, 0], y: [0, 12, 0], opacity: [0.44, 0.72, 0.44] }}
        transition={reduceMotion ? { duration: 0.2 } : { duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/4 top-[18rem] h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl"
        animate={reduceMotion ? { opacity: 0.35 } : { opacity: [0.24, 0.42, 0.24], scale: [1, 1.05, 1] }}
        transition={reduceMotion ? { duration: 0.2 } : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,249,252,0.86),rgba(247,249,252,0.52))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.08),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.18]" />
    </div>
  );
}

export function HeroImageSlideshow() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, [reduceMotion]);

  const currentImage = HERO_IMAGES[activeIndex];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Dynamic image crossfade */}
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={currentImage.src}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            style={{ objectPosition: currentImage.focal || 'center center' }}
            className="h-full w-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtle directional gradient overlay so hero text on left is super crisp and campus photo is vibrant on right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.65) 38%, rgba(15,23,42,0.30) 70%, rgba(15,23,42,0.12) 100%)',
        }}
      />
      {/* Ambient glass glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 25%, rgba(99,102,241,0.22), transparent 36%), radial-gradient(circle at 82% 70%, rgba(34,211,238,0.15), transparent 32%)',
        }}
      />

      {/* Carousel dots indicator at bottom center */}
      <div className="absolute inset-x-0 bottom-2.5 z-20 flex justify-center px-4">
        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/40 px-2.5 py-1 backdrop-blur-md">
          {HERO_IMAGES.map((img, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={`indicator-${img.src}`}
                type="button"
                aria-label={`Show ${img.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-5 bg-gradient-to-r from-indigo-400 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AnimatedCount({
  value,
  duration = 800,
  delay = 0,
  className = '',
}: {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setDisplayValue(value);
      return undefined;
    }

    let timeoutId = 0;
    let rafId = 0;
    let startTime = 0;

    const startAnimation = () => {
      setDisplayValue(0);

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));

        if (progress < 1) {
          rafId = window.requestAnimationFrame(step);
        }
      };

      rafId = window.requestAnimationFrame(step);
    };

    timeoutId = window.setTimeout(startAnimation, delay);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(rafId);
    };
  }, [delay, duration, inView, reduceMotion, value]);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
    }
  }, [reduceMotion, value]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}

export function ImpactBars({
  bars,
  animated = true,
}: {
  bars: number[];
  animated?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-16 items-end gap-1.5">
      {bars.map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          initial={reduceMotion ? false : { height: 0, opacity: 0.35 }}
          animate={animated || reduceMotion ? { height: `${height}%`, opacity: 1 } : { height: `${height}%`, opacity: 1 }}
          transition={{ duration: 0.8, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className={`w-2.5 rounded-full bg-[linear-gradient(180deg,rgba(79,70,229,0.95),rgba(56,189,248,0.9))] shadow-[0_10px_20px_rgba(79,70,229,0.12)] ${
            index % 2 === 0 ? 'opacity-90' : 'opacity-70'
          }`}
        />
      ))}
    </div>
  );
}
