export default async function handler(req, res) {
  const stats = {
    totalSpots: 230,
    availableNow: 70,
    occupancyRate: 70,
    activeCameras: 18,
    lastUpdate: new Date().toISOString()
  };
  return res.json(stats);
}

