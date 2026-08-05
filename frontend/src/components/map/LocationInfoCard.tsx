import type { UserLocationData, LocationStatus } from '../../hooks/useLiveLocation';
import { Navigation, Compass, Gauge, Clock, Radio } from 'lucide-react';


interface LocationInfoCardProps {
  location: UserLocationData | null;
  status: LocationStatus;
  heading: number | null;
  isMocking: boolean;
  onRecenter: () => void;
}

export default function LocationInfoCard({
  location,
  status,
  heading,
  isMocking,
  onRecenter,
}: LocationInfoCardProps) {
  if (!location && status !== 'active') return null;

  // Convert speed in m/s to km/h
  const speedKmH = location?.speed !== null && location?.speed !== undefined
    ? (location.speed * 3.6).toFixed(1)
    : '0.0';

  const formattedTime = location
    ? new Date(location.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const getCompassDirection = (deg: number | null) => {
    if (deg === null) return 'N/A';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return `${directions[index]} (${Math.round(deg)}°)`;
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMocking ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isMocking ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
            {isMocking ? 'Mock Campus GPS' : 'Live Location Active'}
          </span>
        </div>

        <button
          onClick={onRecenter}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
        >
          <Navigation size={12} className="text-blue-600" />
          Recenter
        </button>
      </div>

      {/* Primary Coordinates Grid */}
      {location && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Latitude</p>
            <p className="truncate font-mono text-xs font-semibold text-slate-950">{location.lat.toFixed(6)}° N</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Longitude</p>
            <p className="truncate font-mono text-xs font-semibold text-slate-950">{location.lng.toFixed(6)}° E</p>
          </div>
        </div>
      )}

      {/* Telemetry Metrics */}
      {location && (
        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-2 text-[11px]">
          {/* Accuracy */}
          <div className="flex flex-col items-start gap-0.5">
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              <Radio size={11} className="text-slate-500" /> Accuracy
            </span>
            <span className="font-semibold text-slate-950">±{Math.round(location.accuracy)}m</span>
          </div>

          {/* Speed */}
          <div className="flex flex-col items-start gap-0.5">
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              <Gauge size={11} className="text-slate-500" /> Speed
            </span>
            <span className="font-semibold text-slate-950">{speedKmH} km/h</span>
          </div>

          {/* Timestamp */}
          <div className="flex flex-col items-start gap-0.5">
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              <Clock size={11} className="text-slate-500" /> Updated
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-700">{formattedTime}</span>
          </div>
        </div>
      )}

      {/* Compass / Heading telemetry if available */}
      {heading !== null && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Compass size={13} className="text-blue-600" /> Heading
          </span>
          <span className="font-mono font-semibold text-slate-950">{getCompassDirection(heading)}</span>
        </div>
      )}
    </div>
  );
}
