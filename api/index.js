import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import mmiRouter from '../Backend/routehandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount MapmyIndia router
app.use('/mmi', mmiRouter);

const KEY = process.env.VITE_MAPMYINDIA_KEY;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Geocode endpoint
app.get('/api/geocode', async (req, res) => {
  try {
    const q = (req.query.q || '').toString();
    if (!q) return res.status(400).json({ error: 'q required' });

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

    // Nominatim fallback
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    const nResp = await fetch(nominatimUrl, { headers: { 'User-Agent': 'EcoNav360/1.0 (contact: dev@example.com)' } });
    if (nResp.ok) {
      let arr;
      try { arr = await nResp.json(); } catch { arr = []; }
      if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
        return res.json({ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
      }
    }

    // MapmyIndia fallback
    if (!KEY) return res.status(404).json({ error: 'no results' });
    const mmiUrl = `https://apis.mapmyindia.com/advancedmaps/v1/${KEY}/geo_code?addr=${encodeURIComponent(q)}`;
    const mResp = await fetch(mmiUrl);
    if (!mResp.ok) return res.status(404).json({ error: 'no results' });
    let data;
    try { data = await mResp.json(); } catch {
      return res.status(404).json({ error: 'no results' });
    }
    const lat = data?.results?.[0]?.lat ? parseFloat(data.results[0].lat) : undefined;
    const lng = data?.results?.[0]?.lng ? parseFloat(data.results[0].lng) : undefined;
    if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(404).json({ error: 'no results' });
    return res.json({ lat, lng });
  } catch (e) {
    console.error('Geocode error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

// Parking stats
app.get('/api/parking/stats', (req, res) => {
  const stats = {
    totalSpots: 230,
    availableNow: 70,
    occupancyRate: 70,
    activeCameras: 18,
    lastUpdate: new Date().toISOString()
  };
  res.json(stats);
});

app.get('/api/parking/lots', (req, res) => {
  const lots = [
    { id: "A", name: "Main Gate Parking", total: 50, occupied: 38, cameras: 4, lastUpdate: "2 min ago" },
    { id: "B", name: "Library Parking", total: 80, occupied: 56, cameras: 6, lastUpdate: "1 min ago" },
    { id: "C", name: "Sports Complex", total: 40, occupied: 12, cameras: 3, lastUpdate: "just now" },
    { id: "D", name: "Academic Block", total: 60, occupied: 54, cameras: 5, lastUpdate: "3 min ago" }
  ];
  res.json(lots);
});

app.post('/api/parking/reserve', (req, res) => {
  const { lotId, spotId } = req.body;
  res.json({ success: true, reservationId: `RES-${Date.now()}`, lotId, spotId });
});

app.post('/api/parking/simulate', (req, res) => {
  const { scenario } = req.body;
  res.json({ success: true, scenario, message: `Simulating ${scenario}` });
});

app.get('/api/parking/export', (req, res) => {
  const report = {
    timestamp: new Date().toISOString(),
    totalSpots: 230,
    occupancyRate: 70,
    lots: [
      { id: "A", occupancy: 76 },
      { id: "B", occupancy: 70 },
      { id: "C", occupancy: 30 },
      { id: "D", occupancy: 90 }
    ]
  };
  res.json(report);
});

// Route endpoint
app.get('/api/route', async (req, res) => {
  try {
    const from = (req.query.from || '').toString();
    const to = (req.query.to || '').toString();
    if (!from || !to) return res.status(400).json({ error: 'from & to required' });
    const [fromLat, fromLng] = from.split(',').map((v) => parseFloat(v.trim()));
    const [toLat, toLng] = to.split(',').map((v) => parseFloat(v.trim()));
    if (![fromLat, fromLng, toLat, toLng].every((n) => Number.isFinite(n))) {
      return res.status(400).json({ error: 'invalid coords' });
    }

    // OSRM routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const osrmResp = await fetch(osrmUrl, { headers: { 'User-Agent': 'EcoNav360/1.0' } });
    if (!osrmResp.ok) return res.status(osrmResp.status).json({ error: 'route failed (osrm)' });
    const osrmData = await osrmResp.json();
    const osrmRoute = osrmData?.routes?.[0];
    if (!osrmRoute?.geometry?.coordinates) return res.status(404).json({ error: 'no route' });
    const coords = osrmRoute.geometry.coordinates.map((c) => [c[1], c[0]]);
    return res.json({ routes: [{ coords, distance: osrmRoute.distance, duration: osrmRoute.duration }] });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

export default app;

