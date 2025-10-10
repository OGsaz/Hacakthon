import { useState , useEffect} from "react";
import { ArrowLeft, Navigation, Leaf, Shield, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCurrentLocation } from '@/hooks/usecurrentlocation';


async function getPlaceName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://apis.mapmyindia.com/advancedmaps/v1/a04db67121fe3664027530b21cf43575/rev_geocode?lat=${lat}&lng=${lng}`
    );
    const data = await res.json();
    console.log("Reverse geocode response:", data); // ✅ Confirm structure

    const result = data.results?.[0];
    const placeName = result?.formatted_address || "Unknown location";
    return placeName;
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return "Location not available";
  }
}

/**
 const location = useCurrentLocation() as { lat: number; lng: number } | null;
 * Shows eco-optimized route vs safest route with preference sliders
 */
const RoutePlanner = () => {
  const navigate = useNavigate();
  const [startInput, setStartInput] = useState<string>('');
const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
const [useCurrent, setUseCurrent] = useState<boolean>(true);
  const location = useCurrentLocation() as { lat: number; lng: number } | null;
  const [mode, setMode] = useState("walk");
  const [preferences, setPreferences] = useState({
    speed: 50,
    cleanAir: 50,
    quiet: 50,
    avoidDark: 50,
  });
  
useEffect(() => {
  async function fetchPlace() {
    if (location) {
      const placeName = await getPlaceName(location.lat, location.lng);
      setStartInput(placeName);
      console.log(placeName)
    }
  }
  fetchPlace();
}, [location]);

  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-eco-green/5 rounded-full animate-float blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-eco-teal/5 rounded-full animate-float blur-2xl" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="hover:bg-eco-green/10 hover:text-eco-green transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-eco-green bg-clip-text text-transparent">
              Route Planner
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">Find your perfect path with smart routing</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1 p-4 sm:p-6 space-y-4 sm:space-y-6 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl hover:shadow-glow transition-all duration-300">
            <div className="space-y-4">
              <div>
                <Label htmlFor="from" className="text-sm font-semibold text-foreground">From</Label>
                
                <select
                  onChange={(e) => setUseCurrent(e.target.value === 'current')}
                  className="mt-2 mb-2 p-3 border border-border/50 rounded-xl w-full bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                >
                  <option value="current">Use Current Location</option>
                  <option value="manual">Type Location</option>
                </select>

                <Input
                  id="from"
                  placeholder="Start location"
                  value={
                    useCurrent
                      ? `Your Location (${startInput})`
                      : startInput
                  }
                  onChange={(e) => setStartInput(e.target.value)}
                  disabled={useCurrent}
                  className="mt-2 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="to" className="text-sm font-semibold text-foreground">To</Label>
                <Input 
                  id="to" 
                  placeholder="Destination" 
                  className="mt-2 rounded-xl border-border/50 focus:border-primary" 
                />
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Travel Mode</Label>
              <RadioGroup value={mode} onValueChange={setMode} className="grid grid-cols-2 gap-2">
                {["walk", "cycle", "car", "ev", "shuttle"].map((m) => (
                  <div key={m} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={m} id={m} className="text-primary" />
                    <Label htmlFor={m} className="capitalize cursor-pointer text-sm font-medium">
                      {m}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Preference Sliders */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground">Route Preferences</Label>
              {Object.entries(preferences).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize font-medium">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="text-foreground font-bold">{value}%</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(vals) =>
                      setPreferences((prev) => ({ ...prev, [key]: vals[0] }))
                    }
                    max={100}
                    step={1}
                    className="[&_.slider-track]:bg-primary/20 [&_.slider-range]:bg-gradient-eco"
                  />
                </div>
              ))}
            </div>

            <Button className="w-full bg-gradient-eco hover:shadow-glow transition-all duration-300 hover:scale-105" size="lg">
              <Navigation className="w-4 h-4 mr-2" />
              Find Routes
            </Button>
          </Card>

          {/* Route Cards */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Eco Route */}
            <Card className="p-4 sm:p-6 space-y-4 border-2 border-eco-green/30 hover:shadow-glow transition-all duration-300 hover:scale-105 bg-card/95 backdrop-blur-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-eco flex items-center justify-center shadow-lg">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm sm:text-base">{routes.eco.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Lowest carbon footprint</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Distance</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">{routes.eco.distance}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Time</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">{routes.eco.time}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">CO₂ Emissions</span>
                  <span className="font-bold text-primary text-sm sm:text-base">{routes.eco.co2}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Calories Burned</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">{routes.eco.calories}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-eco-green/10 rounded-xl hover:bg-eco-green/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Green Index</span>
                  <span className="font-bold text-eco-green text-sm sm:text-base">{routes.eco.greenIndex}</span>
                </div>
              </div>

              <Button className="w-full bg-gradient-eco hover:shadow-glow transition-all duration-300 hover:scale-105" variant="default">
                Follow Eco Route
              </Button>
            </Card>

            {/* Safe Route */}
            <Card className="p-4 sm:p-6 space-y-4 border-2 border-eco-teal/30 hover:shadow-glow transition-all duration-300 hover:scale-105 bg-card/95 backdrop-blur-xl animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-eco-teal to-secondary flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm sm:text-base">{routes.safe.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Maximum safety priority</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Distance</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">{routes.safe.distance}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Time</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">{routes.safe.time}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">CO₂ Emissions</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">{routes.safe.co2}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-eco-teal/10 rounded-xl hover:bg-eco-teal/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Lighting</span>
                  <span className="font-bold text-eco-teal text-sm sm:text-base">{routes.safe.lighting}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-eco-teal/10 rounded-xl hover:bg-eco-teal/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">CCTV Coverage</span>
                  <span className="font-bold text-eco-teal text-sm sm:text-base">{routes.safe.cctv}</span>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-eco-teal to-secondary hover:shadow-glow transition-all duration-300 hover:scale-105" variant="secondary">
                Follow Safe Route
              </Button>
            </Card>
          </div>
        </div>

        {/* Carbon Comparison */}
        <Card className="p-4 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl hover:shadow-glow transition-all duration-300 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-energy flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">Carbon Impact Comparison</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { mode: "Walk/Cycle", co2: "0 kg", cost: "₹0", color: "eco-green", icon: "🚶" },
              { mode: "EV/Shuttle", co2: "0.12 kg", cost: "₹8", color: "eco-teal", icon: "🚌" },
              { mode: "Bus", co2: "0.35 kg", cost: "₹15", color: "eco-amber", icon: "🚍" },
              { mode: "Car", co2: "0.89 kg", cost: "₹45", color: "eco-orange", icon: "🚗" },
            ].map((item, index) => (
              <Card 
                key={item.mode} 
                className={`p-3 sm:p-4 border-2 border-${item.color}/30 hover:shadow-glow transition-all duration-300 hover:scale-105 bg-gradient-to-br from-${item.color}/5 to-${item.color}/10 animate-fade-in`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl sm:text-3xl mb-2">{item.icon}</div>
                  <h4 className="font-bold text-foreground text-xs sm:text-sm">{item.mode}</h4>
                  <div className={`text-lg sm:text-2xl font-bold text-${item.color}`}>{item.co2}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Cost: {item.cost}</p>
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
