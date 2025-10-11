import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';

// Utility to ignore tiny location changes
function isSignificantMove(prev: [number, number], next: [number, number], threshold = 0.0001) {
  const [lat1, lng1] = prev;
  const [lat2, lng2] = next;
  return Math.abs(lat1 - lat2) > threshold || Math.abs(lng1 - lng2) > threshold;
}

// Small debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 200) {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, wait);
  };
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  destination?: string;
}

const MapComponent: React.FC<MapComponentProps> = React.memo(({
  center = [28.6139, 77.2090],
  zoom = 13,
  destination,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [resolvedDest, setResolvedDest] = useState<[number, number] | null>(null);

  const lastCoordsRef = useRef<[number, number] | null>(null);
  const lastUpdateTsRef = useRef<number>(0);
  const MIN_UPDATE_INTERVAL_MS = 1000; // don't update marker more than once a second
  const MIN_MOVE_METERS = 15; // ignore tiny jitters under ~15m

  function distanceMeters(a: [number, number], b: [number, number]): number {
    const R = 6371000;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);
    const aa = s1 * s1 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * s2 * s2;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasFitOnceRef = useRef<boolean>(false);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Memoize icons so they are not recreated on every render
  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    []
  );

  const destIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-dest-marker',
        html: '<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    []
  );

  // Debounced function to update the polyline on the map
  const updateRouteDebounced = useRef(
    debounce((points: [number, number][]) => {
      if (!mapRef.current) return;
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(points, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.9,
        }).addTo(mapRef.current!);
      } else {
        routeLineRef.current.setLatLngs(points);
      }
    }, 250)
  ).current;

  // Initialize map - only once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    if (el.offsetWidth === 0 || el.offsetHeight === 0) {
      el.style.width = '100%';
      el.style.height = '300px';
    }

    try {
      const map = L.map(el, {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true, // Use canvas for better performance
        renderer: L.canvas(), // Use canvas renderer to prevent flickering
      }).setView(center as [number, number], zoom);
      mapRef.current = map;

      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });

      osmLayer.addTo(map);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        userMarkerRef.current = null;
        destMarkerRef.current = null;
        routeLineRef.current = null;
        lastCoordsRef.current = null;
        hasFitOnceRef.current = false;
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      mapRef.current = null;
    }
  }, []); // Remove dependencies to prevent re-initialization

  // Separate effect for geolocation - only start after map is initialized
  useEffect(() => {
    if (!mapRef.current || !navigator.geolocation || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const next: [number, number] = [latitude, longitude];

        // Use lastCoordsRef to decide whether to update
        const last = lastCoordsRef.current;
        const now = Date.now();
        const movedEnough = !last || distanceMeters(last, next) > MIN_MOVE_METERS;
        const intervalEnough = now - lastUpdateTsRef.current > MIN_UPDATE_INTERVAL_MS;
        
        if (movedEnough && intervalEnough) {
          lastCoordsRef.current = next;
          lastUpdateTsRef.current = now;
          setUserCoords(next);

          // Place or move user marker
          if (!userMarkerRef.current) {
            userMarkerRef.current = L.marker(next, { icon: userIcon }).addTo(mapRef.current!);
            userMarkerRef.current.bindPopup('You are here');
            // center first time user appears
            mapRef.current!.setView(next, 15);
          } else {
            // Move marker and pan smoothly
            userMarkerRef.current.setLatLng(next);
            // Only pan if user moved significantly to avoid constant re-centering
            const currentCenter = mapRef.current!.getCenter();
            const centerDist = distanceMeters([currentCenter.lat, currentCenter.lng], next);
            if (centerDist > 30) {
              try {
                mapRef.current!.panTo(next, { animate: true, duration: 0.5 });
              } catch {
                mapRef.current!.setView(next);
              }
            }
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [userIcon]); // Only depend on userIcon

  // Geocode destination only when destination string changes
  useEffect(() => {
    if (!destination || !mapRef.current) return;

    async function geocodePlace(place: string): Promise<[number, number] | null> {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(place)}`);
        if (!res.ok) {
          console.error(`Geocoding failed with status: ${res.status}`);
          return null;
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', contentType);
          return null;
        }
        const data = await res.json();
        if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
          return [data.lat, data.lng];
        }
        return null;
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    }

    (async () => {
      const destCoords = await geocodePlace(destination);
      if (!destCoords) {
        console.error('Destination not found - server may not be running');
        if (mapRef.current) {
          const c = mapRef.current.getCenter();
          L.popup()
            .setLatLng(c)
            .setContent(
              `<div style="padding: 10px; text-align: center;">
                <p style="margin: 0; color: #ef4444; font-weight: bold;">⚠️ Server Error</p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">Please ensure the backend server is running</p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">Destination: ${destination}</p>
              </div>`
            )
            .openOn(mapRef.current);
        }
        return;
      }

      // Save resolved destination and reset fit flag so we re-fit to new destination once
      setResolvedDest(destCoords);
      hasFitOnceRef.current = false;
    })();
  }, [destination]);

  // Create/move destination marker and draw/update route when coords available
  useEffect(() => {
    if (!mapRef.current || !resolvedDest) return;

    // Place or move destination marker
    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker(resolvedDest, { icon: destIcon }).addTo(mapRef.current!);
      destMarkerRef.current.bindPopup('Destination');
    } else {
      destMarkerRef.current.setLatLng(resolvedDest);
    }

    // If we have user coords, fetch a routed path from backend and draw it
    if (userCoords) {
      (async () => {
        try {
          const from = `${userCoords[0]},${userCoords[1]}`;
          const to = `${resolvedDest[0]},${resolvedDest[1]}`;
          const res = await fetch(`/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
          if (!res.ok) throw new Error(`route ${res.status}`);
          const data = await res.json();
          const coords: [number, number][]= Array.isArray(data?.routes) && data.routes[0]?.coords ? data.routes[0].coords : [userCoords, resolvedDest];

          // Use debounced update to prevent frequent route redraws
          updateRouteDebounced(coords);

          if (!hasFitOnceRef.current) {
            const bounds = L.latLngBounds(coords);
            mapRef.current!.fitBounds(bounds.pad(0.15));
            hasFitOnceRef.current = true;
          }
        } catch {
          // Fallback to simple straight line if routing fails
          const fallback: [number, number][]= [userCoords, resolvedDest];
          updateRouteDebounced(fallback);
        }
      })();
    }
  }, [resolvedDest, userCoords, destIcon, updateRouteDebounced]);

  return (
    <div className="w-full h-[75vh] rounded-lg overflow-hidden border border-border/50 shadow-lg">
      <div ref={containerRef} className="w-full h-full" id="leaflet-root" />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.center?.[0] === nextProps.center?.[0] &&
    prevProps.center?.[1] === nextProps.center?.[1] &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.destination === nextProps.destination
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
