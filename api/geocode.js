export default async function handler(req, res) {
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

    // Check for IIT Roorkee departments
    const iitDepartments = {
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
    
    if (iitDepartments[normalizedQuery]) {
      return res.json(iitDepartments[normalizedQuery]);
    }
    
    for (const [deptName, coords] of Object.entries(iitDepartments)) {
      if (deptName.includes(normalizedQuery) || normalizedQuery.includes(deptName)) {
        return res.json(coords);
      }
    }

    // Try Nominatim (OpenStreetMap)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    const fetch = (await import('node-fetch')).default;
    
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

