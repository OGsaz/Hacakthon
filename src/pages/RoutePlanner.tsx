import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    mappls?: any;
  }
}

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load script"));
    document.body.appendChild(s);
  });

const RoutePlanner = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_MAPMYINDIA_KEY;
    const sdkUrl = `https://apis.mappls.com/advancedmaps/api/${key}/map_sdk?v=3.0&layer=vector`;

    let mapInstance: any;

    (async () => {
      await loadScript(sdkUrl);
      if (window.mappls && mapRef.current) {
        mapInstance = new window.mappls.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.2090 },
          zoom: 13,
        });
      }
    })();

    return () => {
      mapInstance = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Back</Button>
          <h1 className="text-2xl font-bold">Route Planner</h1>
        </div>
        <div ref={mapRef} style={{ height: "70vh", width: "100%" }} />
      </div>
    </div>
  );
};

export default RoutePlanner;


