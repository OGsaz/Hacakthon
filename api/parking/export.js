export default async function handler(req, res) {
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
  return res.json(report);
}

