import { AlertTriangle, RefreshCw, MapPin, ShieldAlert } from 'lucide-react';
import type { LocationStatus } from '../../hooks/useLiveLocation';

interface LocationErrorAlertProps {
  status: LocationStatus;
  errorMessage: string | null;
  onRetry: () => void;
  onUseMock: () => void;
}

export default function LocationErrorAlert({
  status,
  errorMessage,
  onRetry,
  onUseMock,
}: LocationErrorAlertProps) {
  if (status === 'active' || status === 'requesting') {
    return null;
  }


  const isDenied = status === 'denied';

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
          {isDenied ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-950">
            {isDenied ? 'Location Permission Required' : 'Location Services Unavailable'}
          </h4>
          <p className="text-sm leading-relaxed text-slate-600">
            {errorMessage || 'Unable to access your live GPS position.'}
          </p>
          {isDenied && (
            <p className="mt-1 text-[12px] text-slate-500">
              Tip: Click the padlock/location icon in your browser address bar to allow location access for CampusConnect.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-2">
        <button
          onClick={onRetry}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <RefreshCw size={13} />
          Retry Access
        </button>

        <button
          onClick={onUseMock}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          <MapPin size={13} />
          Use Mock Location
        </button>
      </div>
    </div>
  );
}
