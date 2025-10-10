import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { deflateRawSync } from 'zlib';

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
    const script = document.createElement('script');
    script.src = `https://apis.mappls.com/advancedmaps/api/${import.meta.env.VITE_MAPPLS_KEY}/map_sdk?layer=vector&v=3.0`;
     script.async = true;
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el).setView(center, zoom);
    mapRef.current = map;

    const mapplsUrl = `https://apis.mappls.com/advancedmaps/v1/${import.meta.env.VITE_MAPPLS_KEY}/map/{z}/{x}/{y}.png`;
    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const mapplsLayer = L.tileLayer(mapplsUrl, {
      attribution: '&copy; MapmyIndia',
      maxZoom: 19,
    });

    mapplsLayer.on('tileerror', () => {
      const fallback = L.tileLayer(osmUrl, {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
      fallback.addTo(map);
    });

    mapplsLayer.addTo(map);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords([latitude, longitude]);

        const userMarker = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            shadowSize: [41, 41],
          }),
        }).addTo(map);

        userMarker.bindPopup("You are here").openPopup();
        map.setView([latitude, longitude], 15);
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true }
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

  // 📍 Geocode destination and calculate distance
  useEffect(() => {
    if (!destination || !mapRef.current || !userCoords) return;
    console.log(destination);

    async function geocodePlace(place: string): Promise<[number, number] | null> {
      const res = await fetch(
        `https://atlas.mapmyindia.com/api/places/search/json?query=${encodeURIComponent(place)}&auth_token=${import.meta.env.VITE_MAPPLS_KEY}`
      );
      const data = await res.json();
      const result = data.suggestedLocations?.[0];
      return result ? [result.latitude, result.longitude] : null;
    }

    async function getDistance(start: [number, number], end: [number, number]): Promise<number | null> {
    const url = `https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPPLS_KEY}/distance_matrix/driving/${start[1]},${start[0]};${end[1]},${end[0]}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.results?.[0]?.elements?.[0]?.distance?.value ?? null;
    }

    (async () => {
      const destCoords = await geocodePlace(destination);
      if (!destCoords) {
        console.error("Destination not found");
        return;
      }

      const destMarker = L.marker(destCoords).addTo(mapRef.current!);
      destMarker.bindPopup(`Destination: ${destination}`).openPopup();

      const distance = await getDistance(userCoords, destCoords);
      if (distance !== null) {
        console.log(`Distance: ${(distance / 1000).toFixed(2)} km`);
      }
    })();
  }, [destination, userCoords]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "70%",
        height: "70%",
        position: "absolute",
        top: "6rem",
        left: "19rem"
      }}
      id="leaflet-root"
    />
  );
};

export default MapComponent;
