import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Replace with your actual MapmyIndia API key
const MAPMYINDIA_API_KEY = '8da2e56e635b5b59885b63e8b1a0216f';

router.get('/api/route', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to coordinates' });
  }

  const routeUrl = `https://apis.mapmyindia.com/advancedmaps/v1/${MAPMYINDIA_API_KEY}/route?start=${from}&end=${to}&rtype=1`;

  try {
    const response = await fetch(routeUrl);
    const data = await response.json();

    if (!response.ok || !data.routes?.length) {
      console.error('MapmyIndia error:', data);
      return res.status(500).json({ error: 'Route fetch failed' });
    }

    res.json(data);
  } catch (err) {
    console.error('Backend route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
