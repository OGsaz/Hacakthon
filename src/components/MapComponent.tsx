import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  destination?: string; // 🆕 Add destination prop
}

const MapComponent: React.FC<MapComponentProps> = ({ center = [28.6139, 77.2090], zoom = 13, destination }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  // 🧭 Initialize map
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    // Ensure the container has proper dimensions
    if (el.offsetWidth === 0 || el.offsetHeight === 0) {
      el.style.width = '100%';
      el.style.height = '300px';
    }

    try {
      const map = L.map(el, {
        zoomControl: true,
        attributionControl: true
      }).setView(center, zoom);
      mapRef.current = map;

      // Use OpenStreetMap as primary tile layer (more reliable)
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });

      osmLayer.addTo(map);

      // Try to get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserCoords([latitude, longitude]);

            // Create custom icon to avoid CDN issues
            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            const userMarker = L.marker([latitude, longitude], {
              icon: customIcon
            }).addTo(map);

            userMarker.bindPopup("You are here").openPopup();
            map.setView([latitude, longitude], 15);
          },
          (error) => {
            console.error("Geolocation error:", error);
            // Continue with default view if geolocation fails
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error("Map initialization error:", error);
      mapRef.current = null;
    }
  }, [center, zoom]);

  // 📍 Geocode destination and add marker
  useEffect(() => {
    if (!destination || !mapRef.current || !userCoords) return;
    console.log("Adding destination marker for:", destination);

    async function geocodePlace(place: string): Promise<[number, number] | null> {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(place)}`);
        const data = await res.json();
        if (!res.ok) return null;
        if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
          return [data.lat, data.lng];
        }
        return null;
      } catch (error) {
        console.error("Geocoding error:", error);
        return null;
      }
    }

    (async () => {
      const destCoords = await geocodePlace(destination);
      if (!destCoords) {
        console.error("Destination not found");
        return;
      }

      // Create custom destination icon
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const destMarker = L.marker(destCoords, {
        icon: destIcon
      }).addTo(mapRef.current!);
      destMarker.bindPopup(`Destination: ${destination}`).openPopup();

      // Fit map to show both markers
      const bounds = L.latLngBounds([userCoords, destCoords]);
      mapRef.current!.fitBounds(bounds.pad(0.1));
    })();
  }, [destination, userCoords]);

  return (
    <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-border/50 shadow-lg">
      <div
        ref={containerRef}
        className="w-full h-full"
        id="leaflet-root"
      />
    </div>
  );
};

export default MapComponent;
