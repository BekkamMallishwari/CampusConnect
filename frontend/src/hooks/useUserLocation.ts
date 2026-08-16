import { useState, useEffect, useCallback, useRef } from 'react';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface CampusLocationInfo {
  name: string;
  category?: string;
  distanceMeters?: number;
  coordinates: LocationCoordinates;
  isCurrentLocation: boolean;
  addressLabel: string;
}

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'unsupported';

export const CAMPUS_LANDMARKS = [
  { name: 'Central Library', coords: [12.9722, 77.5942] as [number, number], category: 'Academic' },
  { name: 'Academic Block A & B (AB-1)', coords: [12.9728, 77.5952] as [number, number], category: 'Academic' },
  { name: 'Student Activity Center (SAC)', coords: [12.9718, 77.5932] as [number, number], category: 'Amenities' },
  { name: 'Student Cafeteria & Food Court', coords: [12.9712, 77.5938] as [number, number], category: 'Amenities' },
  { name: 'Campus Hostel Complex', coords: [12.9705, 77.5960] as [number, number], category: 'Residential' },
  { name: 'Admin Block & Registrar', coords: [12.9732, 77.5935] as [number, number], category: 'Facilities' },
  { name: 'Grand Auditorium', coords: [12.9708, 77.5925] as [number, number], category: 'Facilities' },
  { name: 'Sports Complex & Ground', coords: [12.9698, 77.5950] as [number, number], category: 'Sports' },
  { name: 'Engineering Workshop', coords: [12.9735, 77.5958] as [number, number], category: 'Academic' },
  { name: 'Campus Health Center', coords: [12.9715, 77.5965] as [number, number], category: 'Health' },
  { name: 'Main Campus Gate', coords: [12.9740, 77.5930] as [number, number], category: 'Transit' },
];

// Distance calculation using Haversine formula
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Find nearest campus landmark based on coordinates
export function findNearestCampusLandmark(lat: number, lng: number): { name: string; category?: string; distanceMeters: number } {
  let nearest = CAMPUS_LANDMARKS[0];
  let minDistance = calculateDistanceMeters(lat, lng, nearest.coords[0], nearest.coords[1]);

  for (let i = 1; i < CAMPUS_LANDMARKS.length; i++) {
    const item = CAMPUS_LANDMARKS[i];
    const dist = calculateDistanceMeters(lat, lng, item.coords[0], item.coords[1]);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = item;
    }
  }

  return {
    name: nearest.name,
    category: nearest.category,
    distanceMeters: minDistance,
  };
}

export function useUserLocation() {
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationInfo, setLocationInfo] = useState<CampusLocationInfo | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const updateLocationState = useCallback((coords: LocationCoordinates) => {
    setCoordinates(coords);
    const nearest = findNearestCampusLandmark(coords.lat, coords.lng);
    const addressLabel =
      nearest.distanceMeters <= 250
        ? `Near ${nearest.name}`
        : `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}° (${nearest.distanceMeters}m from ${nearest.name})`;

    setLocationInfo({
      name: nearest.name,
      category: nearest.category,
      distanceMeters: nearest.distanceMeters,
      coordinates: coords,
      isCurrentLocation: true,
      addressLabel,
    });
  }, []);

  const requestLocation = useCallback(
    (watch = false): Promise<CampusLocationInfo> => {
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
          const err = 'Geolocation is not supported by your browser.';
          setStatus('unsupported');
          setErrorMessage(err);
          reject(new Error(err));
          return;
        }

        setStatus('requesting');
        setErrorMessage(null);

        const handleSuccess = (position: GeolocationPosition) => {
          const coords: LocationCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : 10,
            timestamp: position.timestamp || Date.now(),
          };
          setStatus('granted');
          setErrorMessage(null);
          updateLocationState(coords);

          const nearest = findNearestCampusLandmark(coords.lat, coords.lng);
          const addressLabel =
            nearest.distanceMeters <= 250
              ? `Near ${nearest.name}`
              : `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}° (${nearest.distanceMeters}m from ${nearest.name})`;

          const info: CampusLocationInfo = {
            name: nearest.name,
            category: nearest.category,
            distanceMeters: nearest.distanceMeters,
            coordinates: coords,
            isCurrentLocation: true,
            addressLabel,
          };
          resolve(info);
        };

        const handleError = (error: GeolocationPositionError) => {
          clearWatch();
          let msg = 'Failed to get your current location.';
          if (error.code === error.PERMISSION_DENIED) {
            setStatus('denied');
            msg = 'Location permission was denied. Please allow location access in your browser.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setStatus('unavailable');
            msg = 'Location unavailable. Please check GPS settings.';
          } else if (error.code === error.TIMEOUT) {
            setStatus('unavailable');
            msg = 'Location request timed out. Please try again.';
          } else {
            setStatus('unavailable');
          }
          setErrorMessage(msg);
          reject(new Error(msg));
        };

        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        };

        if (watch) {
          clearWatch();
          watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
        } else {
          navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
        }
      });
    },
    [clearWatch, updateLocationState],
  );

  useEffect(() => {
    return () => {
      clearWatch();
    };
  }, [clearWatch]);

  return {
    coordinates,
    status,
    errorMessage,
    locationInfo,
    requestLocation,
    clearWatch,
  };
}
