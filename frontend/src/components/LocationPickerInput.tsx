import { useState, useEffect } from 'react';
import { MapPin, Crosshair, Loader2, Check, Search } from 'lucide-react';
import { useUserLocation, CAMPUS_LANDMARKS } from '../hooks/useUserLocation';
import { toast } from 'react-hot-toast';

interface LocationPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
}

export default function LocationPickerInput({
  value,
  onChange,
  error,
  id = 'location-picker',
}: LocationPickerInputProps) {
  const [manualInput, setManualInput] = useState(value || '');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isCurrentLocationActive, setIsCurrentLocationActive] = useState(false);

  const { status, coordinates, requestLocation } = useUserLocation();

  useEffect(() => {
    setManualInput(value || '');
  }, [value]);

  const handlePresetSelect = (locName: string) => {
    setIsCurrentLocationActive(false);
    setIsCustomMode(false);
    setManualInput(locName);
    onChange(locName);
  };

  const handleCustomChange = (text: string) => {
    setIsCurrentLocationActive(false);
    setManualInput(text);
    onChange(text);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const loc = await requestLocation();
      const locStr = `${loc.name} (${loc.coordinates.lat.toFixed(4)}°, ${loc.coordinates.lng.toFixed(4)}°)`;
      setManualInput(locStr);
      setIsCurrentLocationActive(true);
      onChange(locStr);
      toast.success(`Current location detected: ${loc.name}`);
    } catch (err: any) {
      toast.error(err.message || 'Unable to access current location. Please grant permission or select manually.');
    }
  };

  return (
    <div className="space-y-2">
      {/* Top action row: Mode toggle & Current Location button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              !isCustomMode
                ? 'bg-purple-100 text-purple-700 shadow-2xs dark:bg-purple-950/70 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Campus Landmarks
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              isCustomMode
                ? 'bg-purple-100 text-purple-700 shadow-2xs dark:bg-purple-950/70 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Manual / Custom Spot
          </button>
        </div>

        {/* Use Current Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={status === 'requesting'}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition shadow-xs ${
            isCurrentLocationActive && status === 'granted'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/90 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300'
          }`}
          title="Detect and use your live GPS location"
        >
          {status === 'requesting' ? (
            <Loader2 size={13} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          ) : isCurrentLocationActive ? (
            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Crosshair size={13} className="text-indigo-600 dark:text-indigo-400" />
          )}
          <span>{status === 'requesting' ? 'Locating...' : isCurrentLocationActive ? 'Current Location Active' : 'Use Current Location'}</span>
        </button>
      </div>

      {/* Input or Preset Selection */}
      {!isCustomMode ? (
        <div className="space-y-2">
          <div className="relative">
            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              id={id}
              value={CAMPUS_LANDMARKS.some((l) => l.name === manualInput) ? manualInput : ''}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomMode(true);
                } else if (e.target.value) {
                  handlePresetSelect(e.target.value);
                }
              }}
              className={`glass-input h-11 w-full pl-9 pr-4 text-xs sm:text-sm font-semibold ${
                error ? 'border-rose-500' : ''
              }`}
            >
              <option value="" disabled>
                {manualInput && !CAMPUS_LANDMARKS.some((l) => l.name === manualInput)
                  ? `Selected: ${manualInput}`
                  : '-- Select a Campus Location --'}
              </option>
              {CAMPUS_LANDMARKS.map((landmark) => (
                <option key={landmark.name} value={landmark.name}>
                  {landmark.name} ({landmark.category})
                </option>
              ))}
              <option value="__custom__">➕ Other / Custom Location...</option>
            </select>
          </div>

          {/* Quick chips for most common locations */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {['Central Library', 'Student Cafeteria', 'Academic Block A & B', 'SAC'].map((name) => {
              const matched = CAMPUS_LANDMARKS.find((l) => l.name.includes(name))?.name || name;
              const isSelected = manualInput === matched;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handlePresetSelect(matched)}
                  className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition ${
                    isSelected
                      ? 'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id={id}
              type="text"
              value={manualInput}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="e.g. Room 204 AB-1, 2nd Floor Library Silent Zone, Cafeteria Juice Counter..."
              className={`glass-input h-11 w-full pl-9 pr-4 text-xs sm:text-sm font-medium ${
                error ? 'border-rose-500' : ''
              }`}
            />
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
            Provide specific landmarks, room numbers, or floor details to help locate the item.
          </p>
        </div>
      )}

      {/* Live feedback pill if current location is active */}
      {isCurrentLocationActive && coordinates && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <MapPin size={13} className="shrink-0 text-emerald-600" />
          <span className="truncate text-[11px] font-medium">
            GPS: <span className="font-mono">{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</span> (±{coordinates.accuracy || 10}m accuracy)
          </span>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
    </div>
  );
}
