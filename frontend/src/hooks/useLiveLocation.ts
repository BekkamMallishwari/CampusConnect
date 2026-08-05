import { useState, useEffect, useCallback, useRef } from 'react';

export interface UserLocationData {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  speed: number | null; // in m/s (or null)
  heading: number | null; // degrees 0-360 relative to North
  timestamp: number; // epoch ms
}

export type LocationStatus = 'requesting' | 'active' | 'denied' | 'error' | 'unsupported';

const DEFAULT_CAMPUS_CENTER: [number, number] = [12.9716, 77.5946];

export function useLiveLocation() {
  const [location, setLocation] = useState<UserLocationData | null>(null);
  const [status, setStatus] = useState<LocationStatus>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMocking, setIsMocking] = useState<boolean>(false);
  const [recenterCount, setRecenterCount] = useState<number>(0);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Clear existing geolocation watcher
  const clearCurrentWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Request & Watch Position
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      setErrorMessage('Geolocation API is not supported by your browser.');
      return;
    }

    clearCurrentWatch();
    setStatus('requesting');
    setErrorMessage(null);
    setIsMocking(false);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 15,
          speed: speed !== null && !isNaN(speed) ? speed : null,
          heading: heading !== null && !isNaN(heading) ? heading : null,
          timestamp: position.timestamp || Date.now(),
        });
        setStatus('active');
        setErrorMessage(null);
      },
      (error) => {
        clearCurrentWatch();
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMessage('Location access was denied. Please enable location permissions in your browser settings to view your live location.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus('error');
          setErrorMessage('Location information is currently unavailable. Ensure device GPS is turned on.');
        } else if (error.code === error.TIMEOUT) {
          setStatus('error');
          setErrorMessage('Location request timed out. Retrying...');
        } else {
          setStatus('error');
          setErrorMessage(error.message || 'An unknown location error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }, [clearCurrentWatch]);

  // Handle fallback mock campus location if browser permission is blocked or unavailable
  const enableMockLocation = useCallback(() => {
    clearCurrentWatch();
    setIsMocking(true);
    setStatus('active');
    setErrorMessage(null);
    setLocation({
      lat: DEFAULT_CAMPUS_CENTER[0] + 0.0005,
      lng: DEFAULT_CAMPUS_CENTER[1] + 0.0005,
      accuracy: 12,
      speed: 1.2, // ~4.3 km/h walking speed mock
      heading: 45,
      timestamp: Date.now(),
    });
  }, [clearCurrentWatch]);

  // Recenter trigger helper
  const recenter = useCallback(() => {
    setRecenterCount((prev) => prev + 1);
  }, []);

  // Listen for device orientation for compass if coords.heading is absent
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let compass: number | null = null;

      // WebkitCompassHeading for iOS Safari
      const webkitEvent = event as unknown as { webkitCompassHeading?: number };
      if (typeof webkitEvent.webkitCompassHeading === 'number') {
        compass = webkitEvent.webkitCompassHeading;
      } else if (event.alpha !== null && event.alpha !== undefined) {
        compass = (360 - event.alpha) % 360;
      }

      if (compass !== null && !isNaN(compass)) {
        setDeviceHeading(Math.round(compass));
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Start watching on mount
  useEffect(() => {
    startWatching();
    return () => {
      clearCurrentWatch();
    };
  }, [startWatching, clearCurrentWatch]);

  const effectiveHeading = location?.heading !== null && location?.heading !== undefined
    ? location.heading
    : deviceHeading;

  return {
    location,
    status,
    errorMessage,
    isMocking,
    recenterCount,
    effectiveHeading,
    recenter,
    retry: startWatching,
    enableMockLocation,
  };
}
