export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { scenario } = req.body;
  return res.json({ 
    success: true, 
    scenario, 
    message: `Simulating ${scenario}` 
  });
}

