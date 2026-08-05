import { Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { UserLocationData } from '../../hooks/useLiveLocation';


interface UserLocationMarkerProps {
  location: UserLocationData;
  heading: number | null;
  isMocking?: boolean;
}

// Generate Custom Blue User Icon with "You are here" label and pulsating animation
const createUserMarkerIcon = (heading: number | null, isMocking?: boolean) => {
  const rotationTransform = heading !== null ? `transform: rotate(${heading}deg);` : '';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <!-- Pulsating outer ring -->
      <div class="user-location-pulse" style="background-color: ${isMocking ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.4)'};"></div>
      
      <!-- Direction Cone / Arrow if heading exists -->
      ${heading !== null ? `
        <div style="
          position: absolute;
          top: -16px;
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 14px solid ${isMocking ? '#eab308' : '#3b82f6'};
          ${rotationTransform}
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        "></div>
      ` : ''}

      <!-- Center Glowing Blue Dot -->
      <div style="
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background-color: ${isMocking ? '#eab308' : '#3b82f6'};
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 15px ${isMocking ? 'rgba(234, 179, 8, 0.9)' : 'rgba(59, 130, 246, 0.9)'}, 0 4px 10px rgba(0,0,0,0.5);
      ">
        <div style="width: 7px; height: 7px; background-color: #ffffff; border-radius: 50%;"></div>
      </div>

      <!-- Badge "You are here" -->
      <div style="
        margin-top: 4px;
        white-space: nowrap;
        background: rgba(255, 255, 255, 0.96);
        color: #111827;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 9999px;
        border: 1px solid ${isMocking ? '#f59e0b' : '#3b82f6'};
        box-shadow: 0 4px 12px rgba(15,23,42,0.12);
        letter-spacing: 0.02em;
        text-transform: uppercase;
        pointer-events: none;
      ">
        ${isMocking ? 'Mock Location' : 'You are here'}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'user-location-marker-container',
    iconSize: [28, 48],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  });
};

export default function UserLocationMarker({ location, heading, isMocking }: UserLocationMarkerProps) {
  const position: [number, number] = [location.lat, location.lng];

  return (
    <>
      {/* Dynamic Accuracy Circle around User Location */}
      <Circle
        center={position}
        radius={location.accuracy}
        pathOptions={{
          color: isMocking ? '#eab308' : '#3b82f6',
          fillColor: isMocking ? '#eab308' : '#3b82f6',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4',
        }}
      />

      {/* User Location Marker */}
      <Marker position={position} icon={createUserMarkerIcon(heading, isMocking)}>
        <Popup>
          <div className="space-y-1 rounded-xl bg-white p-2 text-xs font-sans text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-1.5 font-extrabold text-slate-950">
              <span className={`h-2 w-2 rounded-full ${isMocking ? 'bg-amber-400' : 'bg-blue-500'} animate-ping`}></span>
              <span>{isMocking ? 'Mock Campus Position' : 'Your Live Location'}</span>
            </div>
            <p className="font-mono text-[11px] text-slate-600">
              {location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°
            </p>
            <p className="text-[10px] text-slate-600">
              Accuracy: <strong className="text-slate-950">±{Math.round(location.accuracy)}m</strong>
            </p>
            <p className="text-[10px] text-slate-600">
              Updated: <strong className="text-slate-950">{new Date(location.timestamp).toLocaleTimeString()}</strong>
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
