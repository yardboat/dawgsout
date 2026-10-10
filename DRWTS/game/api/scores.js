// Global leaderboard. Each score is its own tiny blob whose pathname encodes time + name,
// so writes never collide and reads are a single list() call.
import { put, list } from '@vercel/blob';

const PREFIX = 'scores/';
const clean = s => String(s || '').toUpperCase().replace(/[^A-Z0-9 .'!?-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);

async function all() {
  const out = []; let cursor;
  do {
    const r = await list({ prefix: PREFIX, cursor, limit: 1000 });
    out.push(...r.blobs); cursor = r.hasMore ? r.cursor : null;
  } while (cursor && out.length < 10000);
  return out.map(b => {
    const [ms, name, at] = b.pathname.slice(PREFIX.length).replace(/\.txt$/, '').split('_');
    return { ms: +ms, name: decodeURIComponent(name || ''), at: parseInt(at, 36) || 0 };
  }).filter(s => s.ms > 0 && s.name).sort((a, b) => a.ms - b.ms || a.at - b.at);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'leaderboard storage not connected' });
  try {
    if (req.method === 'GET') {
      const scores = await all();
      return res.status(200).json({ scores: scores.slice(0, 10), total: scores.length });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const name = clean(body.name), ms = Math.round(Number(body.ms));
      if (!name) return res.status(400).json({ error: 'name required' });
      if (!(ms >= 10000 && ms <= 3600000)) return res.status(400).json({ error: 'time out of range' });
      const at = Date.now();
      await put(`${PREFIX}${String(ms).padStart(8, '0')}_${encodeURIComponent(name)}_${at.toString(36)}.txt`, '1',
        { access: 'public', addRandomSuffix: false, contentType: 'text/plain' });
      const scores = await all();
      const rank = scores.findIndex(s => s.at === at && s.name === name && s.ms === ms) + 1;
      return res.status(200).json({ scores: scores.slice(0, 10), total: scores.length, rank, me: { ms, name, at } });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
