import { kv } from '@vercel/kv';

const STATS_KEY = 'icebreakers:stats';

const defaultStats = {
  totalQuestions: 0,
  totalSessions: 0,
  totalTimeSeconds: 0,
  lastUsed: null,
  categories: {
    icebreakers: 0,
    business: 0,
    leadership: 0,
    executive: 0,
    highstakes: 0
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const stats = await kv.get(STATS_KEY) || defaultStats;
      return res.status(200).json(stats);
    }

    if (req.method === 'POST') {
      const { action, category, sessionSeconds } = req.body;
      let stats = await kv.get(STATS_KEY) || { ...defaultStats };

      if (action === 'question' && category) {
        stats.totalQuestions++;
        if (stats.categories[category] !== undefined) {
          stats.categories[category]++;
        }
        stats.lastUsed = new Date().toISOString();
      }

      if (action === 'session') {
        stats.totalSessions++;
        stats.lastUsed = new Date().toISOString();
      }

      if (action === 'time' && sessionSeconds) {
        stats.totalTimeSeconds += sessionSeconds;
      }

      await kv.set(STATS_KEY, stats);
      return res.status(200).json(stats);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
