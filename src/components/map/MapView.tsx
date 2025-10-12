import { useEffect, useRef, useState } from "react";
import   { useCurrentLocation}  from  "src/hooks/usecurrentlocation";

// Extend the Window interface to include the mappls property
declare global {
  interface Window {
    mappls: any;
  }
}
import { MapPin, Navigation } from "lucide-react";

/**
 * MapView - Main interactive map component
 * Displays base map with various environmental layers
 * Integrates with MapmyIndia SDK (with fallback simulations)
 */
interface MapViewProps {
  activeLayers: {
    ndvi: boolean;
    carbon: boolean;
    parking: boolean;
    safePath: boolean;
  };
}

const MapView = ({ activeLayers }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null); // MapmyIndia map instance
  const scriptLoadedRef = useRef(false);

  // Simulate parking spots for demo (your original data)
  const parkingSpots = [
    { id: 1, lat: 28.5455, lng: 77.1920, occupied: false },
    { id: 2, lat: 28.5460, lng: 77.1925, occupied: true },
    { id: 3, lat: 28.5465, lng: 77.1915, occupied: false },
    { id: 4, lat: 28.5450, lng: 77.1930, occupied: true },
  ];

  // Simulated data for other layers (replace with real API data)
  const ndviData = [ // Example NDVI points
    { lat: 28.5450, lng: 77.1920, value: 0.8 },
    { lat: 28.5460, lng: 77.1930, value: 0.6 },
  ];

  const carbonZones = [ // Example carbon polygons
    { id: 'zone1', coords: [[28.5450, 77.1915], [28.5460, 77.1915], [28.5460, 77.1925], [28.5450, 77.1925]] },
  ];

  const safePathRoute = [ // Example safe path
    [28.5455, 77.1920],
    [28.5460, 77.1925],
    [28.5465, 77.1930],
  ];

  // Dynamically load MapmyIndia SDK script (once)
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://apis.mappls.com/advancedmaps/api/138651622f677217c2e720d26f5fce66/map_sdk?layer=vector&v=3.0'; // Replace with your key
    script.async = true;
    script.onload = () => {
      console.log('MapmyIndia SDK loaded');
      scriptLoadedRef.current = true;
      setMapLoaded(true); // Now set after load
    };
    script.onerror = () => {
      console.error('Failed to load MapmyIndia SDK. Check your API key.');
      setSdkFailed(true);
      setMapLoaded(true); // Enable fallback
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map after SDK loads
  useEffect(() => {
    if (!mapLoaded || sdkFailed || !mapContainerRef.current || !window.mappls) return;

    try {
      const map = new window.mappls.Map(mapContainerRef.current, {
        center: [28.5455, 77.1920], // Your default center
        zoom: 15,
        // Additional options: https://www.mappls.com/api/product/map-sdk
      });

      setMapInstance(map);
      console.log("MapView: Map initialized with layers", activeLayers);

      // Initial layer update
      updateLayers(map, activeLayers);

    } catch (error) {
      console.error("MapView: Failed to initialize map", error);
      setSdkFailed(true);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
      }
    };
  }, [mapLoaded, sdkFailed]); // Run after SDK load/failure

  // Update layers when activeLayers changes
  useEffect(() => {
    if (mapLoaded && !sdkFailed && mapInstance) {
      console.log("MapView: Update layers", activeLayers);
      updateLayers(mapInstance, activeLayers);
    }
  }, [activeLayers, mapLoaded, sdkFailed, mapInstance]);

  // Helper: Add/remove SDK layers
  const updateLayers = (map: any, layers: typeof activeLayers) => {
    // Clear existing custom layers (preserve base map)
    map.eachLayer((layer: any) => {
      if (layer instanceof window.mappls.GeoJSON || layer instanceof window.mappls.Polyline || layer instanceof window.mappls.CircleMarker || layer instanceof window.mappls.Marker) {
        map.removeLayer(layer);
      }
    });

    // NDVI Heatmap (CircleMarkers)
    if (layers.ndvi) {
      ndviData.forEach(point => {
        const color = point.value > 0.7 ? 'green' : point.value > 0.4 ? 'yellow' : 'red';
        const marker = new window.mappls.CircleMarker([point.lat, point.lng], {
          radius: 10 * point.value,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6
        }).addTo(map);
        marker.bindPopup(`NDVI: ${point.value}`);
      });
    }

    // Carbon Emissions (Polygons)
    if (layers.carbon) {
      carbonZones.forEach(zone => {
        const polygon = new window.mappls.Polygon(zone.coords, {
          color: 'orange',
          weight: 2,
          fillColor: 'rgba(255, 165, 0, 0.3)'
        }).addTo(map);
        polygon.bindPopup(`Carbon Zone: High Emissions`);
      });
    }

    // Parking Spots (Markers)
    if (layers.parking) {
      parkingSpots.forEach(spot => {
        const iconColor = spot.occupied ? 'red' : 'green';
        const marker = new window.mappls.Marker([spot.lat, spot.lng], {
          icon: window.mappls.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [20, 20]
          })
        }).addTo(map);
        marker.bindPopup(`Spot ${spot.id}: ${spot.occupied ? 'Occupied' : 'Available'}`);
      });
    }

    // Safe Path (Polyline)
    if (layers.safePath) {
      const polyline = new window.mappls.Polyline(safePathRoute, {
        color: 'blue',
        weight: 4,
        opacity: 0.7
      }).addTo(map);
      polyline.bindPopup('Safe Walking Path');
    }
  };

  // Loading state
  if (!mapLoaded) {
    return (
      <div ref={mapContainerRef} className="relative w-full h-full bg-gradient-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <Navigation className="w-8 h-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <p className="text-foreground">Loading Map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="relative w-full h-full bg-gradient-dark">
      {/* SDK Failed: Show your original simulations as fallback */}
      {sdkFailed && (
        <>
          {/* NDVI Heatmap Overlay (Simulated) */}
          {activeLayers.ndvi && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full opacity-40">
                <defs>
                  <radialGradient id="ndvi-grad-1" cx="30%" cy="40%">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="ndvi-grad-2" cx="70%" cy="60%">
                    <stop offset="0%" stopColor="hsl(160, 60%, 50%)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="hsl(160, 60%, 50%)" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="30%" cy="40%" r="20%" fill="url(#ndvi-grad-1)" />
                <circle cx="70%" cy="60%" r="25%" fill="url(#ndvi-grad-2)" />
              </svg>
            </div>
          )}

          {/* Carbon Heatmap Overlay (Simulated) */}
          {activeLayers.carbon && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full opacity-30">
                <defs>
                  <radialGradient id="carbon-grad" cx="50%" cy="70%">
                    <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="50%" cy="70%" r="15%" fill="url(#carbon-grad)" />
              </svg>
            </div>
          )}

          {/* Parking Markers (Simulated) */}
          {activeLayers.parking && (
            <div className="absolute inset-0 pointer-events-none">
              {parkingSpots.map((spot) => (
                <div
                  key={spot.id}
                  className="absolute animate-pulse-glow"
                  style={{
                    left: `${45 + spot.id * 8}%`,
                    top: `${40 + spot.id * 5}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      spot.occupied
                        ? "bg-destructive/70 border-2 border-destructive"
                        : "bg-primary/70 border-2 border-primary"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Safe Path Overlay (Simulated) */}
          {activeLayers.safePath && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full">
                <path
                  d="M 20% 80% Q 40% 50%, 60% 40% T 80% 20%"
                  stroke="hsl(173, 80%, 40%)"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            </div>
          )}
        </>
      )}

      {/* Success: Empty container for SDK map (layers added programmatically) */}
      {!sdkFailed && <div className="absolute inset-0" />} {/* Placeholder for map rendering */}
    </div>
  );
};

export default MapView;
