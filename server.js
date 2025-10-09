import express, { json } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
require('dotenv').config();

const app = express();
app.use(cors());
app.use(json());

const KEY = process.env.VITE_MAPMYINDIA_KEY;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Geocode: supports simple address/city string, returns { lat, lng }
app.get('/api/geocode', async (req, res) => {
  try {
    const q = (req.query.q || '').toString();
    if (!q) return res.status(400).json({ error: 'q required' });

    // If lat,lng format, return as-is
    const parts = q.split(',').map((p) => parseFloat(p.trim()))
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return res.json({ lat: parts[0], lng: parts[1] });
    }

    // Prefer public Nominatim for robust city/address lookup (no key required)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    const nResp = await fetch(nominatimUrl, { headers: { 'User-Agent': 'EcoNav360/1.0' } });
    if (nResp.ok) {
      const arr = await nResp.json();
      if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
        return res.json({ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
      }
    }

    // Fallback to MapmyIndia geocode if available
    if (!KEY) return res.status(404).json({ error: 'no results' });
    const mmiUrl = `https://atlas.mapmyindia.com/api/places/geocode?address=${encodeURIComponent(q)}&region=IND`;
    const mResp = await fetch(mmiUrl, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': KEY,
      },
    });
    if (!mResp.ok) return res.status(404).json({ error: 'no results' });
    const data = await mResp.json();
    const lat = data?.copResults?.[0]?.latitude ?? (data?.results?.[0]?.lat ? parseFloat(data.results[0].lat) : undefined);
    const lng = data?.copResults?.[0]?.longitude ?? (data?.results?.[0]?.lng ? parseFloat(data.results[0].lng) : undefined);
    if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(404).json({ error: 'no results' });
    return res.json({ lat, lng });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// Parking endpoints
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
  // Simulate reservation
  res.json({ success: true, reservationId: `RES-${Date.now()}`, lotId, spotId });
});

app.post('/api/parking/simulate', (req, res) => {
  const { scenario } = req.body;
  // Simulate different scenarios
  res.json({ success: true, scenario, message: `Simulating ${scenario}` });
});

app.get('/api/parking/export', (req, res) => {
  // Generate parking report
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

// Route: returns alternatives, each with coords, distance, duration
app.get('/api/route', async (req, res) => {
  try {
    const from = (req.query.from || '').toString();
    const to = (req.query.to || '').toString();
    if (!from || !to) return res.status(400).json({ error: 'from & to required' });
    if (!KEY) return res.status(500).json({ error: 'Missing VITE_MAPMYINDIA_KEY' });

    const [fromLat, fromLng] = from.split(',').map((v) => parseFloat(v.trim()));
    const [toLat, toLng] = to.split(',').map((v) => parseFloat(v.trim()));
    if (![fromLat, fromLng, toLat, toLng].every((n) => Number.isFinite(n))) {
      return res.status(400).json({ error: 'invalid coords' });
    }

    const url = `https://apis.mapmyindia.com/advancedmaps/v1/${KEY}/route?start=${fromLat},${fromLng}&dest=${toLat},${toLng}&alternatives=true&rtype=0`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'route failed' });
    }
    const data = await resp.json();

    const decodePolyline = (encoded) => {
      let index = 0, lat = 0, lng = 0;
      const coordinates = [];
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

    const routes = [];
    if (Array.isArray(data?.routes)) {
      for (const r of data.routes) {
        if (r?.geometry?.coordinates && Array.isArray(r.geometry.coordinates)) {
          const coords = r.geometry.coordinates.map((c) => [c[1], c[0]]);
          routes.push({ coords, distance: r?.summary?.distance, duration: r?.summary?.duration });
        } else if (typeof r?.geometry === 'string') {
          routes.push({ coords: decodePolyline(r.geometry), distance: r?.summary?.distance, duration: r?.summary?.duration });
        }
      }
    }

    res.json({ routes });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
