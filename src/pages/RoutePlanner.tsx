import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, Navigation, Leaf, Shield, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import React from "react";
import { latLngBounds, Map as LeafletMap } from "leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";

/**
 * RoutePlanner - Dual-route comparison interface
 * Shows eco-optimized route vs safest route with preference sliders
 */
const RoutePlanner = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("walk");
  const [preferences, setPreferences] = useState({
    speed: 50,
    cleanAir: 50,
    quiet: 50,
    avoidDark: 50,
  });
  const [fromText, setFromText] = useState<string>("28.6139,77.2090");
  const [toText, setToText] = useState<string>("28.6350,77.1960");

  const mapRef = useRef<LeafletMap | null>(null);

  // Demo coordinates around Delhi (approx) - replace with routing API later
  const [ecoCoords, setEcoCoords] = useState<LatLngTuple[]>([
    [28.6139, 77.2090],
    [28.6205, 77.2055],
    [28.6285, 77.2000],
    [28.6350, 77.1960],
  ]);

  const [safeCoords, setSafeCoords] = useState<LatLngTuple[]>([
    [28.6139, 77.2090],
    [28.6180, 77.2140],
    [28.6240, 77.2150],
    [28.6310, 77.2100],
  ]);

  const [activeRoute, setActiveRoute] = useState<"eco" | "safe" | null>(null);

  const fitToRoute = (coords: LatLngExpression[]) => {
    if (!mapRef.current || !coords.length) return;
    const bounds = (coords as LatLngTuple[]).reduce(
      (b, pt) => b.extend(pt),
      latLngBounds(coords[0] as LatLngTuple, coords[0] as LatLngTuple)
    );
    mapRef.current.fitBounds(bounds, { padding: [24, 24] });
  };

  const handleFollowEco = () => {
    setActiveRoute("eco");
    fitToRoute(ecoCoords);
  };

  const handleFollowSafe = () => {
    setActiveRoute("safe");
    fitToRoute(safeCoords);
  };

  // Utilities
  const tryParseLatLng = (text: string): LatLngTuple | null => {
    const parts = text.split(",").map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1]] as LatLngTuple;
    }
    return null;
  };

  const geocodePlace = useCallback(async (query: string): Promise<LatLngTuple | null> => {
    // If the user supplied lat,lng already, return that
    const parsed = tryParseLatLng(query);
    if (parsed) return parsed;

    const key = import.meta.env.VITE_MAPMYINDIA_KEY as string | undefined;
    if (!key) return null;
    // MapmyIndia geocoding (Autosuggest)
    const url = `https://atlas.mapmyindia.com/api/places/geocode?address=${encodeURIComponent(query)}&region=IND`;

    // Some deployments need OAuth token; others allow v1 key headers. Try with key header.
    const resp = await fetch(url, {
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": key,
      },
    }).catch(() => null as any);
    if (!resp || !resp.ok) return null;
    const data = await resp.json();
    // Attempt common shapes
    // { copResults: [{ latitude, longitude }] }
    const lat = data?.copResults?.[0]?.latitude;
    const lng = data?.copResults?.[0]?.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      return [lat, lng];
    }
    // { results: [{ lat, lng }] }
    if (data?.results?.[0]?.lat && data?.results?.[0]?.lng) {
      return [parseFloat(data.results[0].lat), parseFloat(data.results[0].lng)];
    }
    return null;
  }, []);

  // Attempt MapmyIndia Directions v1
  const fetchMapmyIndiaRoutes = useCallback(async (
    start: LatLngTuple,
    dest: LatLngTuple
  ) => {
    const key = import.meta.env.VITE_MAPMYINDIA_KEY as string | undefined;
    if (!key) return null;

    // API docs vary; support two common geometries (encoded polyline or GeoJSON)
    // Request alternatives, default rtype=0 (fastest) and we will compute shortest/longest from returned options
    const url = `https://apis.mapmyindia.com/advancedmaps/v1/${key}/route?start=${start[0]},${start[1]}&dest=${dest[0]},${dest[1]}&alternatives=true&rtype=0`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();

    // Try common shapes
    // Case A: data.routes: [{ geometry: { coordinates: [[lng,lat],...] } }]
    // Case B: data.routes: [{ geometry: "encoded_polyline" }]

    const decodePolyline = (encoded: string): LatLngTuple[] => {
      // Basic Google-style polyline decoder; MapmyIndia may return similar encoding
      let index = 0, lat = 0, lng = 0;
      const coordinates: LatLngTuple[] = [];
      while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += dlat;

        shift = 0; result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += dlng;
        coordinates.push([lat / 1e5, lng / 1e5]);
      }
      return coordinates;
    };

    const routes: Array<{ coords: LatLngTuple[]; distance?: number; duration?: number }> = [];
    if (Array.isArray(data?.routes)) {
      for (const r of data.routes) {
        if (r?.geometry?.coordinates && Array.isArray(r.geometry.coordinates)) {
          const coords = r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLngTuple);
          routes.push({ coords, distance: r?.summary?.distance, duration: r?.summary?.duration });
        } else if (typeof r?.geometry === "string") {
          routes.push({ coords: decodePolyline(r.geometry), distance: r?.summary?.distance, duration: r?.summary?.duration });
        }
      }
    }
    if (!routes.length) return null;
    return routes;
  }, []);

  const handleFindRoutes = async () => {
    const start = (await geocodePlace(fromText)) ?? [28.6139, 77.2090];
    const dest = (await geocodePlace(toText)) ?? [28.6350, 77.1960];
    try {
      const routes = await fetchMapmyIndiaRoutes(start, dest);
      if (routes && routes.length) {
        // Choose shortest as Eco, longest as Safe
        const sorted = routes
          .map(r => ({ ...r, d: typeof r.distance === "number" ? r.distance : r.coords.length }))
          .sort((a, b) => (a.d as number) - (b.d as number));
        const eco = sorted[0] ?? routes[0];
        const safe = sorted[sorted.length - 1] ?? routes[routes.length - 1] ?? routes[0];
        setEcoCoords(eco.coords);
        setSafeCoords(safe.coords);
        setActiveRoute(null);
        // Show both routes; fit to both combined
        const combined = [...eco.coords, ...safe.coords];
        fitToRoute(combined);
        return;
      }
    } catch {}
    // Fallback: keep demo coordinates and fit
    setActiveRoute(null);
    fitToRoute([...ecoCoords, ...safeCoords]);
  };

  const routes = {
    eco: {
      name: "Eco-Optimized Route",
      icon: Leaf,
      color: "eco-green",
      distance: "2.4 km",
      time: "18 min",
      co2: "0.05 kg",
      calories: "120 kcal",
      greenIndex: "0.82",
      parking: "Lot B (12 spots)",
    },
    safe: {
      name: "Safest Route",
      icon: Shield,
      color: "eco-teal",
      distance: "2.7 km",
      time: "21 min",
      co2: "0.08 kg",
      calories: "135 kcal",
      greenIndex: "0.68",
      lighting: "98% lit",
      cctv: "95% coverage",
    },
  };

  // Type-safe wrappers to avoid JSX prop inference glitches across versions
  const RMapContainer = MapContainer as unknown as React.FC<any>;
  const RTileLayer = TileLayer as unknown as React.FC<any>;
  const RPolyline = Polyline as unknown as React.FC<any>;
  const RMarker = Marker as unknown as React.FC<any>;
  const RPopup = Popup as unknown as React.FC<any>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Route Planner</h1>
            <p className="text-muted-foreground">Find your perfect path with smart routing</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1 p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  placeholder="lat,lng (e.g. 28.6139,77.2090)"
                  className="mt-2"
                  value={fromText}
                  onChange={(e) => setFromText(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  placeholder="lat,lng (e.g. 28.6350,77.1960)"
                  className="mt-2"
                  value={toText}
                  onChange={(e) => setToText(e.target.value)}
                />
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-3">
              <Label>Travel Mode</Label>
              <RadioGroup value={mode} onValueChange={setMode}>
                {["walk", "cycle", "car", "ev", "shuttle"].map((m) => (
                  <div key={m} className="flex items-center space-x-2">
                    <RadioGroupItem value={m} id={m} />
                    <Label htmlFor={m} className="capitalize cursor-pointer">
                      {m}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Preference Sliders */}
            <div className="space-y-4">
              <Label>Route Preferences</Label>
              {Object.entries(preferences).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="text-foreground font-medium">{value}%</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(vals) =>
                      setPreferences((prev) => ({ ...prev, [key]: vals[0] }))
                    }
                    max={100}
                    step={1}
                  />
                </div>
              ))}
            </div>

            <Button className="w-full" size="lg" onClick={handleFindRoutes}>
              <Navigation className="w-4 h-4 mr-2" />
              Find Routes
            </Button>
          </Card>

          {/* Map + Route Cards */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="h-80 sm:h-96 md:h-[440px] w-full">
                <RMapContainer
                  center={[28.6139, 77.209]}
                  zoom={13}
                  scrollWheelZoom
                  className="h-full w-full"
                  whenCreated={(map) => {
                    mapRef.current = map;
                  }}
                >
                  {import.meta.env.VITE_MAPMYINDIA_KEY ? (
                    <RTileLayer
                      attribution='&copy; MapmyIndia'
                      url={`https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPMYINDIA_KEY}/tile/2/{z}/{x}/{y}.png`}
                    />
                  ) : (
                    <RTileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  )}

                  {/* Eco route */}
                  <RPolyline
                    positions={ecoCoords}
                    pathOptions={{ color: activeRoute === "eco" ? "#16a34a" : "#86efac", weight: activeRoute === "eco" ? 6 : 4 }}
                  />
                  {/* Safe route */}
                  <RPolyline
                    positions={safeCoords}
                    pathOptions={{ color: activeRoute === "safe" ? "#14b8a6" : "#99f6e4", weight: activeRoute === "safe" ? 6 : 4 }}
                  />

                  <RMarker position={ecoCoords[0]}>
                    <RPopup>Start</RPopup>
                  </RMarker>
                  <RMarker position={ecoCoords[ecoCoords.length - 1]}>
                    <RPopup>Destination</RPopup>
                  </RMarker>
                </RMapContainer>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
            {/* Eco Route */}
            <Card className="p-6 space-y-4 border-eco-green hover:shadow-glow transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{routes.eco.name}</h3>
                  <p className="text-sm text-muted-foreground">Lowest carbon footprint</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="font-bold text-foreground">{routes.eco.distance}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="font-bold text-foreground">{routes.eco.time}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">CO₂ Emissions</span>
                  <span className="font-bold text-primary">{routes.eco.co2}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Calories Burned</span>
                  <span className="font-bold text-foreground">{routes.eco.calories}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-eco-green/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">Green Index</span>
                  <span className="font-bold text-eco-green">{routes.eco.greenIndex}</span>
                </div>
              </div>

              <Button className="w-full" variant="default" onClick={handleFollowEco}>
                Follow Eco Route
              </Button>
            </Card>

            {/* Safe Route */}
            <Card className="p-6 space-y-4 border-eco-teal hover:shadow-glow transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{routes.safe.name}</h3>
                  <p className="text-sm text-muted-foreground">Maximum safety priority</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="font-bold text-foreground">{routes.safe.distance}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="font-bold text-foreground">{routes.safe.time}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">CO₂ Emissions</span>
                  <span className="font-bold text-foreground">{routes.safe.co2}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">Lighting</span>
                  <span className="font-bold text-secondary">{routes.safe.lighting}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">CCTV Coverage</span>
                  <span className="font-bold text-secondary">{routes.safe.cctv}</span>
                </div>
              </div>

              <Button className="w-full" variant="secondary" onClick={handleFollowSafe}>
                Follow Safe Route
              </Button>
            </Card>
            </div>
          </div>
        </div>

        {/* Carbon Comparison */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Carbon Impact Comparison</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { mode: "Walk/Cycle", co2: "0 kg", cost: "₹0", color: "eco-green" },
              { mode: "EV/Shuttle", co2: "0.12 kg", cost: "₹8", color: "eco-teal" },
              { mode: "Bus", co2: "0.35 kg", cost: "₹15", color: "eco-amber" },
              { mode: "Car", co2: "0.89 kg", cost: "₹45", color: "eco-orange" },
            ].map((item) => (
              <Card key={item.mode} className={`p-4 border-${item.color}`}>
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-foreground">{item.mode}</h4>
                  <div className={`text-2xl font-bold text-${item.color}`}>{item.co2}</div>
                  <p className="text-sm text-muted-foreground">Cost: {item.cost}</p>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoutePlanner;
