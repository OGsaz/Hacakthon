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
import geocodePlace from '@/pages/geo';

// Debounce hook to delay API calls until user stops typing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function haversineDistance(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


async function getPlaceName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://apis.mapmyindia.com/advancedmaps/v1/95efd4844bc0945df76b5aca082c54bc/rev_geocode?lat=${lat}&lng=${lng}`
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
  const [haversineKm, setHaversineKm] = useState<number | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<
  { label: string; value: [number, number] }[]
>([]);

  // keep currentLocation in sync with geolocation hook
  useEffect(() => {
    if (location) {
      setCurrentLocation([location.lat, location.lng]);
    }
  }, [location]);

  // Handle input change and fetch suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationInput(value);
    fetchCitySuggestions(value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: {label: string, value: [number, number]}) => {
    setDestinationInput(suggestion.label);
    setDestinationCoords(suggestion.value);
    setShowDropdown(false);
    setSuggestions([]);
    
    // Calculate distance immediately when suggestion is selected
    if (currentLocation) {
      const distance = haversineDistance(currentLocation, suggestion.value);
      setDisplayedDistance(distance);
      console.log("Distance calculated from suggestion:", distance.toFixed(2), "km");
    }
  };

  const [destinationInput, setDestinationInput] = useState<string>('');
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [displayedDistance, setDisplayedDistance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<{label: string, value: [number, number]}[]>([]);
const debouncedQuery = useDebounce(destinationInput, 300);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch city suggestions for dropdown
  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      // Common Indian cities that start with the query
      const commonCities = [
        { name: "Delhi", lat: 28.6139, lng: 77.2090 },
        { name: "Dehradun", lat: 30.3165, lng: 78.0322 },
        { name: "Dharamshala", lat: 32.2190, lng: 76.3234 },
        { name: "Dharwad", lat: 15.4589, lng: 75.0078 },
        { name: "Durgapur", lat: 23.5204, lng: 87.3119 },
        { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
        { name: "Mysore", lat: 12.2958, lng: 76.6394 },
        { name: "Madurai", lat: 9.9252, lng: 78.1198 },
        { name: "Chennai", lat: 13.0827, lng: 80.2707 },
        { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
        { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
        { name: "Kochi", lat: 9.9312, lng: 76.2673 },
        { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
        { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
        { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
        { name: "Pune", lat: 18.5204, lng: 73.8567 },
        { name: "Patna", lat: 25.5941, lng: 85.1376 },
        { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
        { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
        { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
      ];

      const filteredCities = commonCities.filter(city => 
        city.name.toLowerCase().startsWith(query.toLowerCase())
      );

      const citySuggestions = filteredCities.map(city => ({
        label: city.name,
        value: [city.lat, city.lng] as [number, number]
      }));

      setSuggestions(citySuggestions);
      setShowDropdown(citySuggestions.length > 0);
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  // Handle Enter key press to calculate distance immediately
  const handleDestinationKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && destinationInput.trim()) {
      e.preventDefault();
      setShowDropdown(false);
      try {
        const coords = await geocodePlace(destinationInput.trim());
        if (coords && currentLocation) {
          const distance = haversineDistance(currentLocation, coords);
          setDisplayedDistance(distance);
          setDestinationCoords(coords);
          console.log("Distance calculated on Enter:", distance.toFixed(2), "km");
        }
      } catch (error) {
        console.error("Error calculating distance on Enter:", error);
      }
    }
  };

  const [preferences, setPreferences] = useState({
    speed: 50,
    cleanAir: 50,
    quiet: 50,
    avoidDark: 50,
  });
   const handleDestinationChange = async (query: string) => {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    const suggestions = data.suggestedLocations;
    if (suggestions?.length) {
      setDropdownOptions(
        suggestions.map(loc => ({
          label: loc.placeName,
          value: [loc.latitude, loc.longitude]
        }))
      );
    }
  };
  
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
  useEffect(() => {
    async function fetchDestinationCoords() {
      if (debouncedQuery.trim()) {
        const coords = await geocodePlace(debouncedQuery);
        setDestinationCoords(coords);
        console.log("Destination coordinates:", coords);
      }
    }
    fetchDestinationCoords();
  }, [debouncedQuery]);
  
  useEffect(() => {
  if (currentLocation && destinationCoords) {
    const distance = haversineDistance(currentLocation, destinationCoords);
    setHaversineKm(distance);
    setDisplayedDistance(distance); // Also update the displayed distance
    console.log("Distance (km):", distance.toFixed(2));
    
  }
}, [currentLocation, destinationCoords]);
useEffect(() => {
  console.log("Debounced query:", debouncedQuery);
  if (debouncedQuery.trim().length > 2) {
    handleDestinationChange(debouncedQuery);
  }
}, [debouncedQuery]);


  
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
                
        <select
          onChange={(e) => setUseCurrent(e.target.value === 'current')}
          className="mt-2 mb-2 p-2 border rounded w-full"
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
  className="mt-2"
/>

      
              </div>
              <div>
   <Label htmlFor="to">To</Label>
   <div className="relative dropdown-container">
     <Input
       id="to"
       placeholder="Enter destination"
       value={destinationInput}
       onChange={handleInputChange}
       onKeyPress={handleDestinationKeyPress}
       className={`mt-2 border ${submitted && destinationInput.trim() === "" ? "border-red-500" : "border-gray-300"}`}
     />
     
     {/* City Suggestions Dropdown */}
     {showDropdown && suggestions.length > 0 && (
       <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
         {suggestions.map((suggestion, index) => (
           <div
             key={index}
             className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
             onClick={() => handleSuggestionSelect(suggestion)}
           >
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
               <span className="text-sm font-medium text-gray-900">{suggestion.label}</span>
             </div>
           </div>
         ))}
       </div>
     )}
   </div>
<select onChange={e =>  setDestinationCoords(JSON.parse(e.target.value))}>
  {dropdownOptions.map((opt, idx) => (
    <option key={idx} value={JSON.stringify(opt.value)}>
      {opt.label}
    </option>
  ))}
</select>

{/* Distance Display */}
{displayedDistance && (
  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span className="text-sm font-medium text-green-800">Distance Calculated!</span>
    </div>
    <div className="text-lg font-bold text-green-900 mt-1">
      {displayedDistance.toFixed(2)} km
    </div>
    <div className="text-xs text-green-600 mt-1">
      Direct distance to {destinationInput}
    </div>
  </div>
)}

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

            <Button className="w-full" size="lg">
              <Navigation className="w-4 h-4 mr-2" />
              Find Routes
            </Button>
          </Card>

          {/* Route Cards */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
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
                  <span className="font-bold text-foreground">
  {haversineKm !== null ? `${haversineKm.toFixed(2)} km` : routes.eco.distance}
</span>

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

              <Button className="w-full" variant="default">
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

              <Button className="w-full" variant="secondary">
                Follow Safe Route
              </Button>
            </Card>
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
