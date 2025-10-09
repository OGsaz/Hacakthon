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

    // Prefer MapmyIndia raster tiles. Replace key with yours if needed.
    const mapplsUrl = 'https://apis.mappls.com/advancedmaps/v1/a04db67121fe3664027530b21cf43575/map/{z}/{x}/{y}.png';
    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const mapplsLayer = L.tileLayer(mapplsUrl, {
      attribution: '&copy; MapmyIndia',
      maxZoom: 19,
    });

    mapplsLayer.on('tileerror', () => {
      // Fallback to OSM if MapmyIndia tiles fail (invalid key/domain not whitelisted)
      const fallback = L.tileLayer(osmUrl, {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
      fallback.addTo(map);
    });

    mapplsLayer.addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

  return <div ref={containerRef} style={{     width: "70%",
    height: "70%",
    position: "absolute",
    top: "6rem",
    left: "19rem"}} id="leaflet-root" />;
};

export default MapComponent;
