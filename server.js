const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const KEY = process.env.VITE_MAPMYINDIA_KEY;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Geocode: supports simple address string, returns { lat, lng }
app.get('/api/geocode', async (req, res) => {
  try {
    const q = (req.query.q || '').toString();
    if (!q) return res.status(400).json({ error: 'q required' });

    // If lat,lng format, return as-is
    const parts = q.split(',').map((p) => parseFloat(p.trim()))
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return res.json({ lat: parts[0], lng: parts[1] });
    }

    if (!KEY) return res.status(500).json({ error: 'Missing VITE_MAPMYINDIA_KEY' });

    const url = `https://atlas.mapmyindia.com/api/places/geocode?address=${encodeURIComponent(q)}&region=IND`;
    const resp = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': KEY,
      },
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'geocode failed' });
    }
    const data = await resp.json();
    const lat = data?.copResults?.[0]?.latitude ?? (data?.results?.[0]?.lat ? parseFloat(data.results[0].lat) : undefined);
    const lng = data?.copResults?.[0]?.longitude ?? (data?.results?.[0]?.lng ? parseFloat(data.results[0].lng) : undefined);
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(404).json({ error: 'no results' });
    }
    res.json({ lat, lng });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
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
