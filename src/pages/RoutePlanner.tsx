import { useState , useEffect} from "react";
import { ArrowLeft, Navigation, Leaf, Shield, Zap, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCurrentLocation } from '@/hooks/usecurrentlocation';
import geocodePlace from '@/pages/geo';
import MapComponent from '@/components/MapComponent';

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
      `https://apis.mapmyindia.com/advancedmaps/v1/138651622f677217c2e720d26f5fce66/rev_geocode?lat=${lat}&lng=${lng}`
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
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    distance: number;
    time: number;
    co2: number;
    calories: number;
    greenIndex: number;
  } | null>(null);

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

  // Handle destination clearing
  const handleDestinationClear = () => {
    setDestinationInput('');
    setDestinationCoords(null);
    setDisplayedDistance(null);
    setShowDropdown(false);
    setSuggestions([]);
    setDropdownOptions([]);
  };

  const [destinationInput, setDestinationInput] = useState<string>('');
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [displayedDistance, setDisplayedDistance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<{label: string, value: [number, number]}[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
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
        { name: "Roorkee", lat: 29.8663, lng: 77.8912 },
        { name: "Manglaur", lat: 29.7430, lng: 77.8912 },
        { name: "Laksar", lat: 29.7583, lng: 78.0417 },
        { name: "Saharanpur", lat: 29.9640, lng: 77.5460 },
        { name: "Chhutmalpur", lat: 30.0030, lng: 77.7090 },
        { name: "Haridwar", lat: 29.9457, lng: 78.1642 },
        { name: "Dehradun", lat: 30.3165, lng: 78.0322 },
        { name: "Muzaffarnagar", lat: 29.4714, lng: 77.6968 },
        { name: "Rishikesh", lat: 30.1033, lng: 78.2944 },
        { name: "Kotdwar", lat: 29.7452, lng: 78.5222 },
  
        { name: "IIT Roorkee Main Gate", lat: 29.8645, lng: 77.8966 },
        { name: "IIT Roorkee Guest House", lat: 29.8652, lng: 77.8959 },
        { name: "IIT Basketball Court", lat: 29.8661, lng: 77.8952 },
        { name: "Department of Paper Technology", lat: 29.8658, lng: 77.8947 },
        { name: "Cricket And Football Ground", lat: 29.8665, lng: 77.8954 },
        { name: "Department of Chemical Engineering", lat: 29.8659, lng: 77.8961 },
        { name: "Mahatma Gandhi Central Library", lat: 29.8654, lng: 77.8958 },
        { name: "Department of Biosciences", lat: 29.8657, lng: 77.8963 },
        { name: "Department of Electrical Engineering", lat: 29.8660, lng: 77.8965 },
        { name: "Department of Civil Engineering", lat: 29.8662, lng: 77.8968 },
        { name: "Department of Mechanical Engineering", lat: 29.8664, lng: 77.8970 },
        { name: "Department of Computer Science", lat: 29.8666, lng: 77.8972 },
        { name: "Department of Mathematics", lat: 29.8668, lng: 77.8974 },
        { name: "Department of Physics", lat: 29.8670, lng: 77.8976 },
        { name: "Department of Chemistry", lat: 29.8672, lng: 77.8978 },
        { name: "Department of Architecture", lat: 29.8674, lng: 77.8980 },
        { name: "Department of Management Studies", lat: 29.8676, lng: 77.8982 },
        { name: "Department of Earthquake Engineering", lat: 29.8678, lng: 77.8984 },
        { name: "Department of Water Resources", lat: 29.8680, lng: 77.8986 },
        { name: "Department of Metallurgical Engineering", lat: 29.8682, lng: 77.8988 },


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

   const handleDestinationChange = async (query: string) => {
    try {
      // Use local geocoding first for IIT Roorkee departments
      const coords = await geocodePlace(query);
      
      if (coords) {
        // If we found coordinates locally, add to dropdown options
        setDropdownOptions([{
          label: query,
          value: coords
        }]);
        
        // Calculate distance immediately if we have current location
        if (currentLocation) {
          const distance = haversineDistance(currentLocation, coords);
          setDisplayedDistance(distance);
          setDestinationCoords(coords);
          console.log("Distance calculated from local geocoding:", distance.toFixed(2), "km");
        }
      } else {
        // Fallback to API if local geocoding fails
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        
        if (!res.ok) {
          console.warn(`Geocoding API returned ${res.status} for query: ${query}`);
          return;
        }
        
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
      }
    } catch (error) {
      console.error("Error in handleDestinationChange:", error);
      // Don't set dropdown options on error - let the local suggestions handle it
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


  
  // Function to calculate metrics
  const calculateEcoMetrics = () => {
    if (haversineKm !== null) {
      const distance = haversineKm;
      const time = Math.round(haversineKm * 5); // 5 minutes per km for walking
      const co2 = haversineKm * 0.05; // 0.05 kg CO2 per km for walking
      const calories = Math.round(haversineKm * 50); // 50 calories per km for walking
      const greenIndex = Math.min(0.95, 0.5 + (haversineKm * 0.1)); // Higher green index for shorter distances
      
      setCalculatedMetrics({
        distance,
        time,
        co2,
        calories,
        greenIndex
      });
    }
  };

  const routes = {
    eco: {
      name: "Eco-Optimized Route",
      icon: Leaf,
      color: "eco-green",
      distance: calculatedMetrics ? `${calculatedMetrics.distance.toFixed(2)} km` : "0.00 km",
      time: calculatedMetrics ? `${calculatedMetrics.time} min` : "0 min",
      co2: calculatedMetrics ? `${calculatedMetrics.co2.toFixed(2)} kg` : "0.00 kg",
      calories: calculatedMetrics ? `${calculatedMetrics.calories} kcal` : "0 kcal",
      greenIndex: calculatedMetrics ? calculatedMetrics.greenIndex.toFixed(2) : "0.00",
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
            <h1 className="text-2xl sm:text-3xl font-bold  bg-gradient-to-r from-foreground to-eco-green bg-clip-text text-transparent">
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
   <Label htmlFor="to">To</Label>
   <div className="relative dropdown-container">
     <div className="relative">
       <Input
         id="to"
         placeholder="Enter destination"
         value={destinationInput}
         onChange={handleInputChange}
         onKeyPress={handleDestinationKeyPress}
         className={`mt-2 pr-10 border ${submitted && destinationInput.trim() === "" ? "border-red-500" : "border-gray-300"}`}
       />
       {destinationInput && (
         <Button
           type="button"
           variant="ghost"
           size="sm"
           onClick={handleDestinationClear}
           className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
         >
           <X className="h-4 w-4 text-gray-500" />
         </Button>
       )}
     </div>
     
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
           

            {/* Preference Sliders removed per request */}

            <Button 
              className="w-full bg-gradient-eco hover:shadow-glow transition-all duration-300 hover:scale-105" 
              size="lg"
              onClick={() => {
                if (destinationInput.trim() && currentLocation) {
                  setShowMap(true);
                  setIsTracking(true);
                  calculateEcoMetrics(); // Calculate metrics when finding routes
                }
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Find Routes
            </Button>
          </Card>

          {/* Route Cards and Map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map Section */}
            {showMap && (
              <Card className="p-4 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-eco flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Live Route Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      {isTracking ? "Tracking your location..." : "Ready to track"}
                    </p>
                  </div>
                </div>
                <MapComponent destination={destinationInput} />
              </Card>
            )}
            
            <div className="grid md:grid-cols-1 gap-4 sm:gap-6">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="font-bold text-foreground">
                    {routes.eco.distance}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Time</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">
                    {routes.eco.time}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">CO₂ Emissions</span>
                  <span className="font-bold text-primary text-sm sm:text-base">
                    {routes.eco.co2}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Calories Burned</span>
                  <span className="font-bold text-foreground text-sm sm:text-base">
                    {routes.eco.calories}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-eco-green/10 rounded-xl hover:bg-eco-green/20 transition-colors">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Green Index</span>
                  <span className="font-bold text-eco-green text-sm sm:text-base">{routes.eco.greenIndex}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-eco hover:shadow-glow transition-all duration-300 hover:scale-105" 
                variant="default"
                onClick={calculateEcoMetrics}
              >
                Follow Eco Route
              </Button>
            </Card>
            
            </div>
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
              { mode: "Walk/Cycle", co2PerKm: 0, costPerKm: 0, color: "eco-green", icon: "🚶" },
              { mode: "EV/Shuttle", co2PerKm: 0.1, costPerKm: 2.20, color: "eco-teal", icon: "🚌" },
              { mode: "Bus", co2PerKm: 0.3, costPerKm: 2.5, color: "eco-amber", icon: "🚍" },
              { mode: "Car", co2PerKm: 0.2, costPerKm: 18, color: "eco-orange", icon: "🚗" },
            ].map((item, index) => {
              const calculatedCo2 = haversineKm !== null ? (haversineKm * item.co2PerKm).toFixed(2) : "0.00";
              const calculatedCost = haversineKm !== null ? (haversineKm * item.costPerKm).toFixed(2) : "0.00";
              
              return (
                <Card 
                  key={item.mode} 
                  className={`p-3 sm:p-4 border-2 border-${item.color}/30 hover:shadow-glow transition-all duration-300 hover:scale-105 bg-gradient-to-br from-${item.color}/5 to-${item.color}/10 animate-fade-in`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="text-center space-y-2">
                    <div className="text-2xl sm:text-3xl mb-2">{item.icon}</div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">{item.mode}</h4>
                    <div className={`text-lg sm:text-2xl font-bold text-${item.color}`}>{calculatedCo2} kg</div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Cost: ₹{calculatedCost}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoutePlanner;
