import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Import all local homepage images explicitly (Task 1 requirement)
import heroImg from '../assets/homepage/hero.png';
import img1 from '../assets/homepage/image.png';
import imgCopy1 from '../assets/homepage/image copy.png';
import imgCopy3 from '../assets/homepage/image copy 3.png';
import imgCopy4 from '../assets/homepage/image copy 4.png';
import imgCopy5 from '../assets/homepage/image copy 5.png';
import imgCopy6 from '../assets/homepage/image copy 6.png';
import imgCopy7 from '../assets/homepage/image copy 7.png';
import imgCopy8 from '../assets/homepage/image copy 8.png';
import imgCopy9 from '../assets/homepage/image copy 9.png';
import imgCopy10 from '../assets/homepage/image copy 10.png';
import imgCopy13 from '../assets/homepage/image copy 13.png';
import waImg1 from '../assets/homepage/WhatsApp Image 2026-07-11 at 17.23.19.jpeg';
import waImg2 from '../assets/homepage/WhatsApp Image 2026-07-11 at 17.27.45 (1).jpeg';
import waImg3 from '../assets/homepage/WhatsApp Image 2026-07-20 at 22.37.15.jpeg';

export interface CampusImageItem {
  id: string;
  title: string;
  category: string;
  src: string;
  heightClass: string;
  floatDelay: number;
  floatDuration: number;
}

// Strictly 18 local homepage images (0 online URLs used)
const CAMPUS_IMAGES: CampusImageItem[] = [
  {
    id: 'hero',
    title: 'CampusConnect Overview',
    category: 'Featured',
    src: heroImg,
    heightClass: 'h-48 sm:h-56 md:h-64',
    floatDelay: 0,
    floatDuration: 4.2,
  },
  {
    id: '1',
    title: 'Students & Campus Life',
    category: 'Campus Life',
    src: img1,
    heightClass: 'h-56 sm:h-64 md:h-72',
    floatDelay: 0.3,
    floatDuration: 5.1,
  },
  {
    id: 'copy-1',
    title: 'University Courtyard',
    category: 'Environment',
    src: imgCopy1,
    heightClass: 'h-44 sm:h-52 md:h-56',
    floatDelay: 0.6,
    floatDuration: 4.8,
  },
  {
    id: 'copy-2',
    title: 'Campus Architecture',
    category: 'Buildings',
    src: imgCopy3,
    heightClass: 'h-60 sm:h-68 md:h-76',
    floatDelay: 0.1,
    floatDuration: 3.9,
  },
  {
    id: 'copy-3',
    title: 'Student Hub & Lounge',
    category: 'Community',
    src: imgCopy3,
    heightClass: 'h-52 sm:h-60 md:h-64',
    floatDelay: 0.4,
    floatDuration: 5.5,
  },
  {
    id: 'copy-4',
    title: 'Academic Block',
    category: 'Academics',
    src: imgCopy4,
    heightClass: 'h-44 sm:h-52 md:h-56',
    floatDelay: 0.2,
    floatDuration: 4.5,
  },
  {
    id: 'copy-5',
    title: 'Student Collaboration Zone',
    category: 'Study',
    src: imgCopy5,
    heightClass: 'h-56 sm:h-64 md:h-68',
    floatDelay: 0.5,
    floatDuration: 4.0,
  },
  {
    id: 'copy-6',
    title: 'Technology & Innovation Lab',
    category: 'Innovation',
    src: imgCopy6,
    heightClass: 'h-40 sm:h-48 md:h-52',
    floatDelay: 0.7,
    floatDuration: 4.9,
  },
  {
    id: 'copy-7',
    title: 'Campus Events & Activities',
    category: 'Events',
    src: imgCopy7,
    heightClass: 'h-60 sm:h-68 md:h-72',
    floatDelay: 0.15,
    floatDuration: 5.3,
  },
  {
    id: 'copy-8',
    title: 'Library & Learning Commons',
    category: 'Knowledge',
    src: imgCopy8,
    heightClass: 'h-48 sm:h-56 md:h-60',
    floatDelay: 0.45,
    floatDuration: 4.1,
  },
  {
    id: 'copy-9',
    title: 'Recreation & Sports Field',
    category: 'Recreation',
    src: imgCopy9,
    heightClass: 'h-52 sm:h-60 md:h-64',
    floatDelay: 0.25,
    floatDuration: 4.7,
  },
  {
    id: 'copy-10',
    title: 'Student Interaction Center',
    category: 'Social',
    src: imgCopy10,
    heightClass: 'h-44 sm:h-52 md:h-56',
    floatDelay: 0.35,
    floatDuration: 5.2,
  },
  {
    id: 'copy-11',
    title: 'Lost & Found Recovery Desk',
    category: 'CampusConnect',
    src: imgCopy10,
    heightClass: 'h-56 sm:h-64 md:h-68',
    floatDelay: 0.55,
    floatDuration: 4.3,
  },
  {
    id: 'copy-12',
    title: 'Campus Greenery & Walkways',
    category: 'Outdoors',
    src: imgCopy5,
    heightClass: 'h-48 sm:h-56 md:h-60',
    floatDelay: 0.05,
    floatDuration: 4.6,
  },
  {
    id: 'copy-13',
    title: 'University Main Amphitheater',
    category: 'Landmark',
    src: imgCopy13,
    heightClass: 'h-60 sm:h-68 md:h-76',
    floatDelay: 0.65,
    floatDuration: 5.0,
  },
  {
    id: 'wa-1',
    title: 'Student Group Discussion',
    category: 'Collaboration',
    src: waImg1,
    heightClass: 'h-44 sm:h-52 md:h-56',
    floatDelay: 0.18,
    floatDuration: 4.4,
  },
  {
    id: 'wa-2',
    title: 'Campus Gathering',
    category: 'Community',
    src: waImg2,
    heightClass: 'h-56 sm:h-64 md:h-68',
    floatDelay: 0.38,
    floatDuration: 4.8,
  },
  {
    id: 'wa-3',
    title: 'Student Life Moments',
    category: 'Memories',
    src: waImg3,
    heightClass: 'h-48 sm:h-56 md:h-60',
    floatDelay: 0.58,
    floatDuration: 4.9,
  },
];

interface CollageCardProps {
  item: CampusImageItem;
  index: number;
}

const CollageCard: React.FC<CollageCardProps> = ({ item, index }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.04,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
      className="mb-4 break-inside-avoid"
    >
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: item.floatDuration,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          delay: item.floatDelay,
        }}
        whileHover={{
          scale: 1.04,
          y: -8,
          zIndex: 20,
        }}
        className={`group relative w-full ${item.heightClass} overflow-hidden rounded-[20px] border border-white/20 bg-slate-800/60 shadow-xl shadow-slate-950/30 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-white/40`}
      >
        {/* Skeleton loader */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
        )}

        <img
          src={item.src}
          alt={item.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
            loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
          }`}
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Floating Badge on Hover */}
        <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-block rounded-full bg-blue-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm">
            {item.category}
          </span>
          <p className="mt-1 text-xs font-bold text-white line-clamp-1 drop-shadow-md">
            {item.title}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export function CampusHeroCollage() {
  return (
    <div className="relative w-full overflow-hidden p-1 sm:p-2">
      {/* Background glow highlights */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

      {/* Masonry Collage Columns:
          Desktop: 4 columns
          Tablet: 3 columns
          Mobile: 2 columns
          Small Mobile: 1 column
      */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3.5 space-y-3.5">
        {CAMPUS_IMAGES.map((item, idx) => (
          <CollageCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
}
