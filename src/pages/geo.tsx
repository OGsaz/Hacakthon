async function geocodePlace(place: string): Promise<[number, number] | null> {
  try {
    // First try local IIT Roorkee department coordinates
    const iitDepartments: { [key: string]: [number, number] } = {
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
    if (iitDepartments[normalizedPlace]) {
      return iitDepartments[normalizedPlace];
    }
    
    // Try partial matches for department names
    for (const [deptName, coords] of Object.entries(iitDepartments)) {
      if (deptName.includes(normalizedPlace) || normalizedPlace.includes(deptName)) {
        return coords;
      }
    }

    // Try API geocoding as fallback
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(place)}`);
    const data = await res.json();
    if (!res.ok) return null;
    if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
      return [data.lat, data.lng];
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
export default geocodePlace;