import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  Navigation,
  BookOpen,
  Building2,
  Utensils,
  HeartPulse,
  Bus,
  Trophy,
  ArrowRight,
  PlusCircle,
  X,
  Compass,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useLiveLocation } from '../hooks/useLiveLocation';
import UserLocationMarker from '../components/map/UserLocationMarker';
import LocationInfoCard from '../components/map/LocationInfoCard';
import FloatingMapControls from '../components/map/FloatingMapControls';
import LocationErrorAlert from '../components/map/LocationErrorAlert';

// Helper component to smoothly animate map center to selected coordinates or live position
function MapViewController({
  target,
  zoom = 17,
  autoRotate,
  heading,
}: {
  target: [number, number] | null;
  zoom?: number;
  autoRotate?: boolean;
  heading?: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo(target, zoom, { duration: 1.2 });
    }
  }, [target, zoom, map]);

  useEffect(() => {
    if (autoRotate && heading !== null && heading !== undefined) {
      // Rotate Leaflet map view container smoothly if supported
      const container = map.getContainer();
      const mapPane = container.querySelector('.leaflet-map-pane') as HTMLElement;
      if (mapPane) {
        mapPane.style.transform = `rotate(${-heading}deg)`;
        mapPane.style.transition = 'transform 0.5s ease-out';
      }
    } else {
      const container = map.getContainer();
      const mapPane = container.querySelector('.leaflet-map-pane') as HTMLElement;
      if (mapPane) {
        mapPane.style.transform = 'none';
      }
    }
  }, [autoRotate, heading, map]);

  return null;
}

export type BuildingCategory = 'Academic' | 'Amenities' | 'Facilities' | 'Sports' | 'Transit' | 'Health';

export type CampusBuilding = {
  id: string;
  name: string;
  category: BuildingCategory;
  description: string;
  coords: [number, number];
  image: string;
  hours: string;
  code: string;
};

const CAMPUS_CENTER: [number, number] = [12.9716, 77.5946];

const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: 'lib',
    name: 'Central Library',
    category: 'Academic',
    description: '4-story digital & printed resource hub with silent study spaces and research labs.',
    coords: [12.9722, 77.5942],
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80',
    hours: '08:00 AM - 11:00 PM',
    code: 'LIB-01',
  },
  {
    id: 'acad',
    name: 'Academic Blocks A & B',
    category: 'Academic',
    description: 'Primary lecture halls, engineering laboratories, and department faculty offices.',
    coords: [12.9728, 77.5952],
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80',
    hours: '08:00 AM - 06:00 PM',
    code: 'AB-10',
  },
  {
    id: 'cafe',
    name: 'Student Cafeteria & Food Court',
    category: 'Amenities',
    description: 'Multi-cuisine dining area, coffee lounges, and quick-grab food outlets.',
    coords: [12.9712, 77.5938],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    hours: '07:30 AM - 10:00 PM',
    code: 'CAF-04',
  },
  {
    id: 'hostel',
    name: 'Campus Hostel Complex',
    category: 'Amenities',
    description: 'Residential blocks for undergraduate & postgraduate students with laundry & common rooms.',
    coords: [12.9705, 77.5960],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
    hours: '24/7 Access',
    code: 'HST-08',
  },
  {
    id: 'admin',
    name: 'Admin Block & Registrar',
    category: 'Facilities',
    description: 'University administrative headquarters, admissions office, and student services desk.',
    coords: [12.9732, 77.5935],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    hours: '09:00 AM - 05:00 PM',
    code: 'ADM-01',
  },
  {
    id: 'audit',
    name: 'Grand Auditorium',
    category: 'Facilities',
    description: '1,500-seat multi-purpose hall for convocations, cultural fests, and guest seminars.',
    coords: [12.9708, 77.5925],
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    hours: 'Event Schedule',
    code: 'AUD-02',
  },
  {
    id: 'park',
    name: 'Main Parking Plaza',
    category: 'Transit',
    description: 'Multi-level parking structure for two-wheelers, faculty vehicles, and visitor parking.',
    coords: [12.9738, 77.5948],
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
    hours: '06:00 AM - 11:30 PM',
    code: 'PKG-01',
  },
  {
    id: 'med',
    name: 'Campus Medical Center',
    category: 'Health',
    description: 'Fully equipped 24/7 emergency clinic with resident doctors, nursing staff, and pharmacy.',
    coords: [12.9701, 77.5945],
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    hours: '24/7 Emergency',
    code: 'MED-01',
  },
  {
    id: 'bus',
    name: 'Main Gate Bus Terminal',
    category: 'Transit',
    description: 'Campus shuttle drop-off point and city transit connection hub.',
    coords: [12.9740, 77.5930],
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    hours: '06:00 AM - 10:00 PM',
    code: 'BUS-01',
  },
  {
    id: 'sports',
    name: 'Sports Complex & Gym',
    category: 'Sports',
    description: 'Indoor basketball court, badminton arenas, swimming pool, and fitness center.',
    coords: [12.9698, 77.5955],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    hours: '06:00 AM - 09:30 PM',
    code: 'SPT-05',
  },
];

// Custom HTML DivIcon generator for campus building markers
const createCustomMarkerIcon = (category: BuildingCategory, isSelected: boolean) => {
  const iconSymbol = {
    Academic: '📚',
    Amenities: '☕',
    Facilities: '🏛️',
    Sports: '🏆',
    Transit: '🚌',
    Health: '🏥',
  }[category];

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${isSelected ? '44px' : '36px'};
      height: ${isSelected ? '44px' : '36px'};
      background-color: ${isSelected ? '#2563eb' : '#ffffff'};
      color: ${isSelected ? '#ffffff' : '#111827'};
      border: 2px solid ${isSelected ? '#1d4ed8' : '#cbd5e1'};
      border-radius: 50%;
      box-shadow: 0 10px 24px rgba(15,23,42,0.14);
      font-size: ${isSelected ? '18px' : '15px'};
      transition: all 0.3s ease;
      cursor: pointer;
    ">
      ${iconSymbol}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [isSelected ? 44 : 36, isSelected ? 44 : 36],
    iconAnchor: [isSelected ? 22 : 18, isSelected ? 22 : 18],
    popupAnchor: [0, isSelected ? -24 : -20],
  });
};

// Calculate distance in meters using Haversine formula
function calculateDistance(coord1: [number, number], coord2: [number, number]) {
  const R = 6371e3; // metres
  const φ1 = (coord1[0] * Math.PI) / 180;
  const φ2 = (coord2[0] * Math.PI) / 180;
  const Δφ = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const Δλ = ((coord2[1] - coord1[1]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

export default function CampusMapPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [routeDestination, setRouteDestination] = useState<CampusBuilding | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  // Live Location Hook (watchPosition continuously)
  const {
    location,
    status,
    errorMessage,
    isMocking,
    recenterCount,
    effectiveHeading,
    recenter,
    retry,
    enableMockLocation,
  } = useLiveLocation();

  const initialCenteredRef = useRef(false);

  // Auto-center map on user's live position when first location fix arrives
  useEffect(() => {
    if (location && !initialCenteredRef.current) {
      initialCenteredRef.current = true;
      setFlyTarget([location.lat, location.lng]);
    }
  }, [location]);

  // Handle recenter count changes
  useEffect(() => {
    if (recenterCount > 0) {
      if (location) {
        setFlyTarget([location.lat, location.lng]);
      } else {
        recenter();
      }
    }
  }, [recenterCount, location, recenter]);

  const categories = ['All', 'Academic', 'Amenities', 'Facilities', 'Sports', 'Transit', 'Health'];

  const categoryIcons: Record<string, React.ElementType> = {
    Academic: BookOpen,
    Amenities: Utensils,
    Facilities: Building2,
    Sports: Trophy,
    Transit: Bus,
    Health: HeartPulse,
  };

  const filteredBuildings = CAMPUS_BUILDINGS.filter((building) => {
    const matchesCategory = selectedCategory === 'All' || building.category === selectedCategory;
    const matchesSearch =
      building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectBuilding = (building: CampusBuilding) => {
    setSelectedBuilding(building);
    setFlyTarget(building.coords);
  };

  const handleRecenterToUser = () => {
    if (location) {
      setFlyTarget([location.lat, location.lng]);
    } else {
      retry();
    }
  };

  const handleStartRoute = (building: CampusBuilding) => {
    if (!location) {
      retry();
    }
    setRouteDestination(building);
    setSelectedBuilding(building);
    setFlyTarget(building.coords);
  };

  const userCoords: [number, number] | null = location
    ? [location.lat, location.lng]
    : null;

  const routeDistance = userCoords && routeDestination
    ? calculateDistance(userCoords, routeDestination.coords)
    : null;

  const walkingMinutes = routeDistance ? Math.max(1, Math.round(routeDistance / 75)) : null;

  return (
    <PageTransition className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
            <Compass size={12} className="text-blue-600" /> Interactive Directory & Live GPS
          </span>
          <h1 className="text-[clamp(2rem,2vw+1rem,2.75rem)] font-bold tracking-tight text-slate-950">
            Campus Map & Live Navigation
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Real-time live location tracking, building directory, and campus walking directions.
          </p>
        </div>

        <button
          onClick={handleRecenterToUser}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 cursor-pointer"
        >
          <Navigation size={16} className={status === 'requesting' ? 'animate-spin' : ''} />
          {status === 'requesting' ? 'Locating...' : 'My Live Location'}
        </button>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-4 min-h-[640px]">
        {/* Sidebar Controls & Info Cards */}
        <div className="space-y-4 lg:col-span-1 flex flex-col justify-between rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search building name, code..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-900 placeholder-slate-500 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-950"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Location Permission / Error Alert */}
            <LocationErrorAlert
              status={status}
              errorMessage={errorMessage}
              onRetry={retry}
              onUseMock={enableMockLocation}
            />

            {/* Live Location Telemetry Info Card */}
            <LocationInfoCard
              location={location}
              status={status}
              heading={effectiveHeading}
              isMocking={isMocking}
              onRecenter={handleRecenterToUser}
            />

            {/* Category Filter Chips */}
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">Category Filter</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Building Results List */}
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">
                Locations ({filteredBuildings.length})
              </p>
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                {filteredBuildings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-600">
                    No matching buildings found.
                  </div>
                ) : (
                  filteredBuildings.map((building) => {
                    const CategoryIcon = categoryIcons[building.category] || Building2;
                    const isSelected = selectedBuilding?.id === building.id;
                    return (
                      <div
                        key={building.id}
                        onClick={() => handleSelectBuilding(building)}
                        className={`group flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-200 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            <CategoryIcon size={15} />
                          </div>
                          <div className="truncate">
                            <p className="truncate text-sm font-semibold text-slate-950">{building.name}</p>
                            <p className="text-[12px] font-medium text-slate-600">{building.code} • {building.category}</p>
                          </div>
                        </div>
                        <ArrowRight size={14} className={`text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-blue-600' : 'group-hover:translate-x-0.5'}`} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Active Navigation Route Box */}
          {routeDestination && (
            <div className="mt-4 space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
                  <Navigation size={12} className="animate-pulse" /> Active Navigation Route
                </span>
                <button
                  onClick={() => setRouteDestination(null)}
                  className="cursor-pointer text-slate-500 hover:text-slate-950"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="truncate text-sm font-semibold text-slate-950">{routeDestination.name}</p>
              {routeDistance !== null ? (
                <div className="flex items-center gap-3 text-[12px] text-slate-600">
                  <span>Distance: <strong className="text-slate-950">{routeDistance} m</strong></span>
                  <span>Est. Walk: <strong className="text-slate-950">{walkingMinutes} mins</strong></span>
                </div>
              ) : (
                <p className="text-[12px] font-medium text-amber-700">Enable location access to calculate live distance.</p>
              )}
            </div>
          )}
        </div>

        {/* Leaflet Map Display Panel */}
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white lg:col-span-3 min-h-[520px] shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
          {/* Floating Controls Overlay */}
          <FloatingMapControls
            onLocateMe={handleRecenterToUser}
            heading={effectiveHeading}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
            isLocating={status === 'requesting'}
          />

          <MapContainer
            center={CAMPUS_CENTER}
            zoom={16}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', minHeight: '540px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Map Flying Controller */}
            <MapViewController
              target={flyTarget}
              autoRotate={autoRotate}
              heading={effectiveHeading}
            />

            {/* Render Building Markers */}
            {filteredBuildings.map((building) => {
              const isSelected = selectedBuilding?.id === building.id;
              return (
                <Marker
                  key={building.id}
                  position={building.coords}
                  icon={createCustomMarkerIcon(building.category, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedBuilding(building);
                      setFlyTarget(building.coords);
                    },
                  }}
                >
                  <Popup>
                    <div className="space-y-2.5 max-w-[240px]">
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-950">
                        <img
                          src={building.image}
                          alt={building.name}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute top-2 left-2 rounded bg-zinc-950/80 px-2 py-0.5 text-[9px] font-bold uppercase text-white border border-zinc-700">
                          {building.category}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{building.name}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Code: {building.code} • {building.hours}</p>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-normal">{building.description}</p>
                      
                      <div className="pt-2 border-t border-zinc-800 flex gap-2">
                        <button
                          onClick={() => handleStartRoute(building)}
                          className="flex-1 rounded-lg bg-blue-600 py-1.5 text-[10px] font-bold text-white hover:bg-blue-500 transition cursor-pointer"
                        >
                          Directions
                        </button>
                        <button
                          onClick={() => navigate('/lost-items/new')}
                          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 py-1.5 text-[10px] font-semibold text-white hover:bg-zinc-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <PlusCircle size={10} /> Report Item
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Render Live User Location Marker & Accuracy Circle */}
            {location && (
              <UserLocationMarker
                location={location}
                heading={effectiveHeading}
                isMocking={isMocking}
              />
            )}

            {/* Render Animated Polyline Navigation Route */}
            {userCoords && routeDestination && (
              <Polyline
                positions={[userCoords, routeDestination.coords]}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.9,
                  className: 'route-polyline-animated',
                }}
              />
            )}
          </MapContainer>

          {/* Map Category Legend Overlay (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-20 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur-md sm:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">Category Legend</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <span>📚</span> Academic
              </div>
              <div className="flex items-center gap-1.5">
                <span>☕</span> Amenities
              </div>
              <div className="flex items-center gap-1.5">
                <span>🏛️</span> Facilities
              </div>
              <div className="flex items-center gap-1.5">
                <span>🏆</span> Sports
              </div>
              <div className="flex items-center gap-1.5">
                <span>🚌</span> Transit
              </div>
              <div className="flex items-center gap-1.5">
                <span>🏥</span> Health
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
