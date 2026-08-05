import { Navigation, Compass, RotateCw } from 'lucide-react';

interface FloatingMapControlsProps {
  onLocateMe: () => void;
  heading: number | null;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  isLocating?: boolean;
}

export default function FloatingMapControls({
  onLocateMe,
  heading,
  autoRotate,
  onToggleAutoRotate,
  isLocating = false,
}: FloatingMapControlsProps) {
  const rotationDeg = heading !== null ? heading : 0;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      {/* Floating "Locate Me" Button */}
      <button
        onClick={onLocateMe}
        disabled={isLocating}
        title="Locate Me - Recenter map on live location"
        className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 backdrop-blur-md shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 active:scale-95 disabled:opacity-50"
      >
        <Navigation
          size={20}
          className={`text-blue-600 transition-transform group-hover:scale-110 ${
            isLocating ? 'animate-spin' : ''
          }`}
        />
      </button>

      {/* Floating Compass Indicator */}
      <div
        title={heading !== null ? `Compass Heading: ${Math.round(heading)}°` : 'Compass (North up)'}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 backdrop-blur-md shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
      >
        <div
          style={{ transform: `rotate(${rotationDeg}deg)`, transition: 'transform 0.4s ease-out' }}
          className="relative flex items-center justify-center"
        >
          <Compass size={22} className="text-slate-500" />
          <div className="absolute top-0.5 h-2 w-1 rounded-full bg-red-500"></div>
        </div>
      </div>

      {/* Auto-Rotate Map Toggle */}
      <button
        onClick={onToggleAutoRotate}
        title={autoRotate ? 'Auto-Rotate Map ON (Direction of movement)' : 'Auto-Rotate Map OFF'}
        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition backdrop-blur-md shadow-2xl cursor-pointer ${
          autoRotate
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-white/95 text-slate-500 hover:border-blue-200 hover:text-blue-700'
        }`}
      >
        <RotateCw size={18} className={autoRotate ? 'animate-spin-slow text-blue-600' : ''} />
      </button>
    </div>
  );
}
