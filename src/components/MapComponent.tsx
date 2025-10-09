import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ center = [28.6139, 77.2090], zoom = 13 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (mapRef.current) return; // already initialized

    const map = L.map(el).setView(center, zoom);
    mapRef.current = map;

    // MapmyIndia raster tiles
    const mapplsUrl = 'https://apis.mappls.com/advancedmaps/v1/a04db67121fe3664027530b21cf43575/map/{z}/{x}/{y}.png';
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

    // 🧭 Add current location marker
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

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
      (error) => {
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

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
