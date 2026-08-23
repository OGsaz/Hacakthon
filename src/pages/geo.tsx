async function geocodePlace(place: string): Promise<[number, number] | null> {
  try {
    // First try local coordinates for common places
    const localPlaces: { [key: string]: [number, number] } = {
      // Common cities
      "delhi": [28.6139, 77.2090],
      "dehradun": [30.3165, 78.0322],
      "mumbai": [19.0760, 72.8777],
      "chennai": [13.0827, 80.2707],
      "kolkata": [22.5726, 88.3639],
      "bangalore": [12.9716, 77.5946],
      "hyderabad": [17.3850, 78.4867],
      "pune": [18.5204, 73.8567],
      "ahmedabad": [23.0225, 72.5714],
      "jaipur": [26.9124, 75.7873],
      "lucknow": [26.8467, 80.9462],
      "kanpur": [26.4499, 80.3319],
      "nagpur": [21.1458, 79.0882],
      "surat": [21.1702, 72.8311],
      "patna": [25.5941, 85.1376],
      "indore": [22.7196, 75.8577],
      "thane": [19.2183, 72.9781],
      "bhopal": [23.2599, 77.4126],
      "visakhapatnam": [17.6868, 83.2185],
      "chandigarh": [30.7333, 76.7794],
      
      // Main campus areas
      "iit roorkee": [29.8645, 77.8966],
      "iit roorkee main gate": [29.8645, 77.8966],
      "iit roorkee guest house": [29.8652, 77.8959],
      
      // Academic departments (more accurate coordinates)
      "department of paper technology": [29.8658, 77.8947],
      "department of chemical engineering": [29.8659, 77.8961],
      "department of biosciences": [29.8657, 77.8963],
      "department of electrical engineering": [29.8660, 77.8965],
      "department of civil engineering": [29.8662, 77.8968],
      "department of mechanical engineering": [29.8664, 77.8970],
      "department of computer science": [29.8666, 77.8972],
      "department of mathematics": [29.8668, 77.8974],
      "department of physics": [29.8670, 77.8976],
      "department of chemistry": [29.8672, 77.8978],
      "department of architecture": [29.8674, 77.8980],
      "department of management studies": [29.8676, 77.8982],
      "department of earthquake engineering": [29.8678, 77.8984],
      "department of water resources": [29.8680, 77.8986],
      "department of metallurgical engineering": [29.8682, 77.8988],
      
      // Facilities
      "mahatma gandhi central library": [29.8654, 77.8958],
      "iit basketball court": [29.8661, 77.8952],
      "cricket and football ground": [29.8665, 77.8954],
      
      // Alternative names for easier matching
      "paper technology": [29.8658, 77.8947],
      "chemical engineering": [29.8659, 77.8961],
      "biosciences": [29.8657, 77.8963],
      "electrical engineering": [29.8660, 77.8965],
      "civil engineering": [29.8662, 77.8968],
      "mechanical engineering": [29.8664, 77.8970],
      "computer science": [29.8666, 77.8972],
      "mathematics": [29.8668, 77.8974],
      "physics": [29.8670, 77.8976],
      "chemistry": [29.8672, 77.8978],
      "architecture": [29.8674, 77.8980],
      "management studies": [29.8676, 77.8982],
      "earthquake engineering": [29.8678, 77.8984],
      "water resources": [29.8680, 77.8986],
      "metallurgical engineering": [29.8682, 77.8988],
      "library": [29.8654, 77.8958]
    };

    const normalizedPlace = place.toLowerCase().trim();
    
    // First try exact match
    if (localPlaces[normalizedPlace]) {
      return localPlaces[normalizedPlace];
    }
    
    // Try partial matches for places
    for (const [placeName, coords] of Object.entries(localPlaces)) {
      if (placeName.includes(normalizedPlace) || normalizedPlace.includes(placeName)) {
        return coords;
      }
    }

    // Try API geocoding as fallback
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(place)}`);
      if (!res.ok) return null;
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Geocoding API returned non-JSON response");
        return null;
      }
      
      const data = await res.json();
      if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
        return [data.lat, data.lng];
      }
    } catch (fetchError) {
      console.error("Fetch error in geocoding:", fetchError);
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
export default geocodePlace;