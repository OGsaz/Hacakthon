export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { lotId, spotId } = req.body;
  return res.json({ 
    success: true, 
    reservationId: `RES-${Date.now()}`, 
    lotId, 
    spotId 
  });
}

