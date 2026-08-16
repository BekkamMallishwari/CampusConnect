import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CalendarClock, MapPin, X, Loader2 } from 'lucide-react';
import { matchesApi } from '../lib/api';
import { toast } from 'react-hot-toast';

const CAMPUS_LOCATIONS = [
  'Central Library',
  'Student Activity Center (SAC)',
  'Main Academic Block (AB-1)',
  'Engineering Workshop',
  'Sports Complex',
  'Hostel Block A',
  'Cafeteria',
  'Main Gate',
  'Share Current Location',
  'Custom...',
];

const CAMPUS_CENTER = { lat: 28.70406, lng: 77.10249 };

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({
  position,
  setPosition,
}: {
  position: L.LatLng | null;
  setPosition: (pos: L.LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  );
}

interface MeetingSchedulerProps {
  matchId: string;
  onClose: () => void;
  onSuccess: (updatedMatch: any) => void;
}

export default function MeetingScheduler({ matchId, onClose, onSuccess }: MeetingSchedulerProps) {
  const [meetingLocation, setMeetingLocation] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [mapPosition, setMapPosition] = useState<L.LatLng | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (meetingLocation !== 'Custom...') {
      setMapPosition(null);
    }
    if (meetingLocation === 'Share Current Location') {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        setMeetingLocation('');
        return;
      }
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapPosition(L.latLng(position.coords.latitude, position.coords.longitude));
          setGettingLocation(false);
        },
        (error) => {
          toast.error('Failed to get location: ' + error.message);
          setGettingLocation(false);
          setMeetingLocation('');
        }
      );
    }
  }, [meetingLocation]);

  const handleSchedule = async () => {
    const finalLocation = meetingLocation === 'Custom...' ? customLocationName : meetingLocation;
    if (!finalLocation || !meetingTime) {
      toast.error('Please provide both location and time.');
      return;
    }
    
    if ((meetingLocation === 'Custom...' || meetingLocation === 'Share Current Location') && !mapPosition) {
      toast.error('Please ensure a location is pinned on the map.');
      return;
    }

    setSchedulingMeeting(true);
    try {
      const payload: any = {
        meetingLocation: finalLocation,
        meetingTime: new Date(meetingTime).toISOString(),
      };
      
      if ((meetingLocation === 'Custom...' || meetingLocation === 'Share Current Location') && mapPosition) {
        payload.meetingCoordinates = { lat: mapPosition.lat, lng: mapPosition.lng };
      }

      const res = await matchesApi.scheduleMeeting(matchId, payload);
      toast.success(`Meeting scheduled at ${finalLocation}!`);
      onSuccess(res.data.match);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to schedule meeting.');
    } finally {
      setSchedulingMeeting(false);
    }
  };

  return (
    <div className="glass-panel p-4 space-y-3 rounded-2xl animate-in fade-in zoom-in duration-200" style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--dash-text-primary)' }}>
          <CalendarClock size={15} className="text-indigo-500" /> Schedule Meeting Location & Time
        </p>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition">
          <X size={14} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Campus Location</label>
          <select
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
            className="glass-input h-10 w-full px-3 text-xs font-semibold"
          >
            <option value="">Select location...</option>
            {CAMPUS_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {meetingLocation === 'Custom...' && (
            <input
              type="text"
              value={customLocationName}
              onChange={(e) => setCustomLocationName(e.target.value)}
              placeholder="E.g. Behind Library Cafe"
              className="glass-input mt-1.5 h-10 w-full px-3 text-xs"
            />
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Meeting Time</label>
          <input
            type="datetime-local"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="glass-input h-10 w-full px-3 text-xs font-semibold"
          />
        </div>
      </div>

      {(meetingLocation === 'Custom...' || meetingLocation === 'Share Current Location') && (
        <div className="rounded-xl overflow-hidden border relative z-0 h-48" style={{ borderColor: 'var(--glass-border)' }}>
          {gettingLocation && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-[2000] flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
            </div>
          )}
          <MapContainer center={mapPosition || [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]} zoom={15} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker position={mapPosition} setPosition={setMapPosition} />
          </MapContainer>
          {!mapPosition && !gettingLocation && meetingLocation === 'Custom...' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 shadow-sm border border-indigo-200/50">
              Tap map to pin exact location
            </div>
          )}
        </div>
      )}

      <button
        disabled={schedulingMeeting || gettingLocation || !meetingTime || !meetingLocation || (meetingLocation === 'Custom...' && (!customLocationName || !mapPosition))}
        onClick={handleSchedule}
        className="dash-btn-primary w-full py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
      >
        {schedulingMeeting ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
        <span>{schedulingMeeting ? 'Scheduling...' : 'Send Meeting Request'}</span>
      </button>
    </div>
  );
}
