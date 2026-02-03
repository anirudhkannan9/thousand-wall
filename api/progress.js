import { Redis } from '@upstash/redis';

const PROGRESS_KEY = 'thousand-wall-progress';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Initialize Redis (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars)
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (req.method === 'GET') {
    try {
      const progress = await redis.get(PROGRESS_KEY);
      return res.status(200).json({ progress: progress ?? 10 });
    } catch (error) {
      console.error('Redis GET error:', error);
      return res.status(200).json({ progress: 10 }); // fallback
    }
  }

  if (req.method === 'POST') {
    const password = req.headers.authorization?.replace('Bearer ', '');

    if (password !== process.env.EDIT_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const { progress } = req.body;

    if (typeof progress !== 'number' || progress < 0 || progress > 1000) {
      return res.status(400).json({ error: 'Invalid progress value' });
    }

    try {
      await redis.set(PROGRESS_KEY, progress);
      return res.status(200).json({ success: true, progress });
    } catch (error) {
      console.error('Redis SET error:', error);
      return res.status(500).json({ error: 'Failed to save progress' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
