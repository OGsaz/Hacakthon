export default async function handler(req, res) {
  const { from, to } = req.query;
  
  if (!from || !to) {
    return res.status(400).json({ error: 'from & to required' });
  }
  
  try {
    const [fromLat, fromLng] = from.split(',').map((v) => parseFloat(v.trim()));
    const [toLat, toLng] = to.split(',').map((v) => parseFloat(v.trim()));
    
    if (![fromLat, fromLng, toLat, toLng].every((n) => Number.isFinite(n))) {
      return res.status(400).json({ error: 'invalid coords' });
    }

    // Use OSRM public routing service
    const fetch = (await import('node-fetch')).default;
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    
    const osrmResp = await fetch(osrmUrl, { 
      headers: { 'User-Agent': 'EcoNav360/1.0' } 
    });
    
    if (!osrmResp.ok) {
      return res.status(osrmResp.status).json({ error: 'route failed (osrm)' });
    }
    
    const osrmData = await osrmResp.json();
    const osrmRoute = osrmData?.routes?.[0];
    
    if (!osrmRoute?.geometry?.coordinates) {
      return res.status(404).json({ error: 'no route' });
    }
    
    const coords = osrmRoute.geometry.coordinates.map((c) => [c[1], c[0]]);
    return res.json({ 
      routes: [{ coords, distance: osrmRoute.distance, duration: osrmRoute.duration }] 
    });
  } catch (e) {
    console.error('Route error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}

