export default async function handler(req, res) {
  const lots = [
    { id: "A", name: "Main Gate Parking", total: 50, occupied: 38, cameras: 4, lastUpdate: "2 min ago" },
    { id: "B", name: "Library Parking", total: 80, occupied: 56, cameras: 6, lastUpdate: "1 min ago" },
    { id: "C", name: "Sports Complex", total: 40, occupied: 12, cameras: 3, lastUpdate: "just now" },
    { id: "D", name: "Academic Block", total: 60, occupied: 54, cameras: 5, lastUpdate: "3 min ago" }
  ];
  return res.json(lots);
}

