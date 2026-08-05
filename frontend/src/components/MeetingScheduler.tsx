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

const CAMPUS_CENTER = { lat: 28.70406, lng: 77.10249 }; // Example campus center, adjust as needed

// Fix leaflet icon issue
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
    <div className="border-t border-slate-100 bg-violet-50/60 p-4 space-y-3 rounded-xl animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-violet-800 flex items-center gap-1.5">
          <CalendarClock size={14} /> Schedule Meeting Location & Time
        </p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
          <X size={14} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-bold text-violet-700 mb-1">Campus Location</label>
          <select
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
            className="w-full rounded-xl border border-violet-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-violet-400 transition text-[#0F172A]"
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
              className="mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-violet-400 transition text-[#0F172A]"
            />
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-violet-700 mb-1">Meeting Time</label>
          <input
            type="datetime-local"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="w-full rounded-xl border border-violet-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-violet-400 transition text-[#0F172A]"
          />
        </div>
      </div>

      {(meetingLocation === 'Custom...' || meetingLocation === 'Share Current Location') && (
        <div className="rounded-xl overflow-hidden border border-violet-200 relative z-0 h-48">
          {gettingLocation && (
            <div className="absolute inset-0 bg-white/80 z-[2000] flex items-center justify-center">
              <Loader2 className="animate-spin text-violet-600" size={24} />
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
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-violet-700 shadow-sm border border-violet-200">
              Tap map to pin exact location
            </div>
          )}
        </div>
      )}

      <button
        disabled={schedulingMeeting || gettingLocation || !meetingTime || !meetingLocation || (meetingLocation === 'Custom...' && (!customLocationName || !mapPosition))}
        onClick={handleSchedule}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition disabled:opacity-50"
      >
        {schedulingMeeting ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
        {schedulingMeeting ? 'Scheduling...' : 'Send Meeting Request'}
      </button>
    </div>
  );
}
