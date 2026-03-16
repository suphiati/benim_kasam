import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://finans.truncgil.com/v4/today.json');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error' });
    }
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch rates' });
  }
}
