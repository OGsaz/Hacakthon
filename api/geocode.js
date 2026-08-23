export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'q required' });
  }

  try {
    // If lat,lng format, return as-is
    const parts = q.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return res.json({ lat: parts[0], lng: parts[1] });
    }

    // Check for common cities and IIT Roorkee departments
    const commonPlaces = {
      // Common Indian cities
      "delhi": { lat: 28.6139, lng: 77.2090 },
      "dehradun": { lat: 30.3165, lng: 78.0322 },
      "mumbai": { lat: 19.0760, lng: 72.8777 },
      "chennai": { lat: 13.0827, lng: 80.2707 },
      "kolkata": { lat: 22.5726, lng: 88.3639 },
      "bangalore": { lat: 12.9716, lng: 77.5946 },
      "hyderabad": { lat: 17.3850, lng: 78.4867 },
      "pune": { lat: 18.5204, lng: 73.8567 },
      "ahmedabad": { lat: 23.0225, lng: 72.5714 },
      "jaipur": { lat: 26.9124, lng: 75.7873 },
      "lucknow": { lat: 26.8467, lng: 80.9462 },
      "kanpur": { lat: 26.4499, lng: 80.3319 },
      "nagpur": { lat: 21.1458, lng: 79.0882 },
      "surat": { lat: 21.1702, lng: 72.8311 },
      "patna": { lat: 25.5941, lng: 85.1376 },
      "indore": { lat: 22.7196, lng: 75.8577 },
      "thane": { lat: 19.2183, lng: 72.9781 },
      "bhopal": { lat: 23.2599, lng: 77.4126 },
      "visakhapatnam": { lat: 17.6868, lng: 83.2185 },
      "chandigarh": { lat: 30.7333, lng: 76.7794 },
      
      // IIT Roorkee locations
      "iit roorkee": { lat: 29.8645, lng: 77.8966 },
      "iit roorkee main gate": { lat: 29.8645, lng: 77.8966 },
      "iit roorkee guest house": { lat: 29.8652, lng: 77.8959 },
      "department of paper technology": { lat: 29.8658, lng: 77.8947 },
      "department of chemical engineering": { lat: 29.8659, lng: 77.8961 },
      "department of biosciences": { lat: 29.8657, lng: 77.8963 },
      "department of electrical engineering": { lat: 29.8660, lng: 77.8965 },
      "department of civil engineering": { lat: 29.8662, lng: 77.8968 },
      "department of mechanical engineering": { lat: 29.8664, lng: 77.8970 },
      "department of computer science": { lat: 29.8666, lng: 77.8972 },
      "department of mathematics": { lat: 29.8668, lng: 77.8974 },
      "department of physics": { lat: 29.8670, lng: 77.8976 },
      "department of chemistry": { lat: 29.8672, lng: 77.8978 },
      "department of architecture": { lat: 29.8674, lng: 77.8980 },
      "department of management studies": { lat: 29.8676, lng: 77.8982 },
      "department of earthquake engineering": { lat: 29.8678, lng: 77.8984 },
      "department of water resources": { lat: 29.8680, lng: 77.8986 },
      "department of metallurgical engineering": { lat: 29.8682, lng: 77.8988 },
      "mahatma gandhi central library": { lat: 29.8654, lng: 77.8958 },
      "iit basketball court": { lat: 29.8661, lng: 77.8952 },
      "cricket and football ground": { lat: 29.8665, lng: 77.8954 },
      "paper technology": { lat: 29.8658, lng: 77.8947 },
      "chemical engineering": { lat: 29.8659, lng: 77.8961 },
      "biosciences": { lat: 29.8657, lng: 77.8963 },
      "electrical engineering": { lat: 29.8660, lng: 77.8965 },
      "civil engineering": { lat: 29.8662, lng: 77.8968 },
      "mechanical engineering": { lat: 29.8664, lng: 77.8970 },
      "computer science": { lat: 29.8666, lng: 77.8972 },
      "mathematics": { lat: 29.8668, lng: 77.8974 },
      "physics": { lat: 29.8670, lng: 77.8976 },
      "chemistry": { lat: 29.8672, lng: 77.8978 },
      "architecture": { lat: 29.8674, lng: 77.8980 },
      "management studies": { lat: 29.8676, lng: 77.8982 },
      "earthquake engineering": { lat: 29.8678, lng: 77.8984 },
      "water resources": { lat: 29.8680, lng: 77.8986 },
      "metallurgical engineering": { lat: 29.8682, lng: 77.8988 },
      "library": { lat: 29.8654, lng: 77.8958 }
    };

    const normalizedQuery = q.toLowerCase().trim();
    
    // First check exact match
    if (commonPlaces[normalizedQuery]) {
      return res.json(commonPlaces[normalizedQuery]);
    }
    
    // Then check partial matches
    for (const [placeName, coords] of Object.entries(commonPlaces)) {
      if (placeName.includes(normalizedQuery) || normalizedQuery.includes(placeName)) {
        return res.json(coords);
      }
    }

    // Try Nominatim (OpenStreetMap)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    
    const nResp = await fetch(nominatimUrl, { 
      headers: { 'User-Agent': 'EcoNav360/1.0 (contact: dev@example.com)' } 
    });
    
    if (nResp.ok) {
      let arr;
      try { 
        arr = await nResp.json(); 
      } catch { 
        arr = []; 
      }
      if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
        return res.json({ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
      }
    }

    // Fallback: return error
    return res.status(404).json({ error: 'no results' });
  } catch (e) {
    console.error('Geocode error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

