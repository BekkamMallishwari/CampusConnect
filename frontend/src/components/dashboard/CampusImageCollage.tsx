import { motion, useReducedMotion } from 'framer-motion';
import campus1 from '../../assets/campus/campus-01.jpg';
import campus2 from '../../assets/campus/campus-02.jpg';
import campus3 from '../../assets/campus/campus-03.jpg';
import campus4 from '../../assets/campus/campus-04.jpg';
import campus5 from '../../assets/campus/campus-05.jpg';

type CollageImage = {
  src: string;
  alt: string;
  objectPosition?: string;
};

// Select 5 high-quality campus images for the collage
const COLLAGE_IMAGES: CollageImage[] = [
  { src: campus1, alt: 'University main building & quad', objectPosition: 'center 35%' },
  { src: campus2, alt: 'Modern university lecture hall & commons', objectPosition: 'center 35%' },
  { src: campus3, alt: 'Campus greenery and walkways', objectPosition: 'center 45%' },
  { src: campus4, alt: 'Campus library & student quad plaza', objectPosition: 'center 40%' },
  { src: campus5, alt: 'University entrance arch & courtyard', objectPosition: 'center 38%' },
];

function CollageImage({
  src,
  alt,
  index,
  reduceMotion,
  className,
  objectPosition = 'center center',
}: {
  src: string;
  alt: string;
  index: number;
  reduceMotion: boolean;
  className: string;
  objectPosition?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group relative overflow-hidden rounded-[1.2rem] border border-white/80 bg-slate-100 shadow-[0_14px_32px_rgba(15,23,42,0.1)] ${className}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[1.1rem]">
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
          animate={
            reduceMotion
              ? { opacity: 1, scale: 1 }
              : {
                  opacity: 1,
                  scale: [1, 1.04, 1],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.3 }
              : {
                  opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 8 + (index % 3), repeat: Infinity, ease: 'easeInOut' },
                }
          }
          style={{ objectPosition }}
          className="h-full w-full object-cover will-change-transform"
        />
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/8" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%)]" />
    </motion.div>
  );
}

export default function CampusImageCollage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full h-full">
      {/* Desktop Grid: 3 small on top, 1 large wide at bottom, 1 tall on right */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:grid-rows-3 lg:gap-3 h-full">
        {/* Top left small */}
        <CollageImage
          src={COLLAGE_IMAGES[0].src}
          alt={COLLAGE_IMAGES[0].alt}
          index={0}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-4 row-span-1 min-h-[120px]"
          objectPosition={COLLAGE_IMAGES[0].objectPosition}
        />

        {/* Top center small */}
        <CollageImage
          src={COLLAGE_IMAGES[1].src}
          alt={COLLAGE_IMAGES[1].alt}
          index={1}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-4 row-span-1 min-h-[120px]"
          objectPosition={COLLAGE_IMAGES[1].objectPosition}
        />

        {/* Top right small */}
        <CollageImage
          src={COLLAGE_IMAGES[2].src}
          alt={COLLAGE_IMAGES[2].alt}
          index={2}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-4 row-span-1 min-h-[120px]"
          objectPosition={COLLAGE_IMAGES[2].objectPosition}
        />

        {/* Bottom left large horizontal (spans 2 rows, 8 cols) */}
        <CollageImage
          src={COLLAGE_IMAGES[4].src}
          alt={COLLAGE_IMAGES[4].alt}
          index={4}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-8 row-span-2 min-h-[160px]"
          objectPosition={COLLAGE_IMAGES[4].objectPosition}
        />

        {/* Bottom right tall */}
        <CollageImage
          src={COLLAGE_IMAGES[3].src}
          alt={COLLAGE_IMAGES[3].alt}
          index={3}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-4 row-span-2 min-h-[160px]"
          objectPosition={COLLAGE_IMAGES[3].objectPosition}
        />
      </div>

      {/* Tablet Grid: 2 columns */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-3 h-full">
        <CollageImage
          src={COLLAGE_IMAGES[0].src}
          alt={COLLAGE_IMAGES[0].alt}
          index={0}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-1 aspect-[4/3]"
          objectPosition={COLLAGE_IMAGES[0].objectPosition}
        />
        <CollageImage
          src={COLLAGE_IMAGES[1].src}
          alt={COLLAGE_IMAGES[1].alt}
          index={1}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-1 aspect-[4/3]"
          objectPosition={COLLAGE_IMAGES[1].objectPosition}
        />
        <CollageImage
          src={COLLAGE_IMAGES[4].src}
          alt={COLLAGE_IMAGES[4].alt}
          index={4}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-2 aspect-[2/1]"
          objectPosition={COLLAGE_IMAGES[4].objectPosition}
        />
        <CollageImage
          src={COLLAGE_IMAGES[2].src}
          alt={COLLAGE_IMAGES[2].alt}
          index={2}
          reduceMotion={Boolean(reduceMotion)}
          className="col-span-2 aspect-[2/1]"
          objectPosition={COLLAGE_IMAGES[2].objectPosition}
        />
      </div>

      {/* Mobile: Stack vertically */}
      <div className="grid md:hidden grid-cols-1 gap-3 h-full">
        <CollageImage
          src={COLLAGE_IMAGES[0].src}
          alt={COLLAGE_IMAGES[0].alt}
          index={0}
          reduceMotion={Boolean(reduceMotion)}
          className="aspect-[4/3]"
          objectPosition={COLLAGE_IMAGES[0].objectPosition}
        />
        <CollageImage
          src={COLLAGE_IMAGES[4].src}
          alt={COLLAGE_IMAGES[4].alt}
          index={4}
          reduceMotion={Boolean(reduceMotion)}
          className="aspect-[16/9]"
          objectPosition={COLLAGE_IMAGES[4].objectPosition}
        />
        <CollageImage
          src={COLLAGE_IMAGES[1].src}
          alt={COLLAGE_IMAGES[1].alt}
          index={1}
          reduceMotion={Boolean(reduceMotion)}
          className="aspect-[4/3]"
          objectPosition={COLLAGE_IMAGES[1].objectPosition}
        />
      </div>
    </div>
  );
}
