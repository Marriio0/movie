import http from 'http';
import { parse as parseUrl } from 'url';
import torrentStream from 'torrent-stream';

const PORT = process.env.PORT || 4000;

// In-memory cache of active torrent engines
// key: infoHash, value: { engine, file, lastAccess, clients }
const engines = new Map();

const DEFAULT_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://explodie.org:6969/announce',
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://tracker.leechers-paradise.org:6969/announce',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.webtorrent.dev',
];

function buildMagnet(infoHash, dn) {
  const tr = DEFAULT_TRACKERS.map((t) => `tr=${encodeURIComponent(t)}`).join('&');
  const name = dn ? `&dn=${encodeURIComponent(dn)}` : '';
  return `magnet:?xt=urn:btih:${infoHash}${name}&${tr}`;
}

function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4':
    case 'm4v':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogg':
    case 'ogv':
      return 'video/ogg';
    case 'mkv':
      return 'video/x-matroska';
    case 'avi':
      return 'video/x-msvideo';
    default:
      return 'video/mp4';
  }
}

function getOrCreateEngine(infoHash, dn) {
  const key = infoHash.toLowerCase();
  if (engines.has(key)) {
    const entry = engines.get(key);
    entry.lastAccess = Date.now();
    return Promise.resolve(entry);
  }

  const magnet = buildMagnet(key, dn);

  return new Promise((resolve, reject) => {
    const engine = torrentStream(magnet, {
      connections: 60,
      uploads: 1,
      tmp: './.cache',
    });

    const timeout = setTimeout(() => {
      engine.destroy();
      reject(new Error('Timeout finding torrent metadata after 30 seconds'));
    }, 30000);

    engine.on('ready', () => {
      clearTimeout(timeout);

      // Find largest media file
      const mediaFiles = engine.files.filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['mp4', 'mkv', 'avi', 'webm', 'mov', 'm4v'].includes(ext || '');
      });

      const file = mediaFiles.length > 0
        ? mediaFiles.reduce((prev, curr) => (curr.length > prev.length ? curr : prev))
        : engine.files.reduce((prev, curr) => (curr.length > prev.length ? curr : prev));

      // Select this file for priority downloading
      file.select();

      const entry = {
        engine,
        file,
        lastAccess: Date.now(),
      };

      engines.set(key, entry);
      console.log(`[Streamer] Torrent ready: "${file.name}" (${(file.length / 1024 / 1024).toFixed(1)} MB)`);
      resolve(entry);
    });

    engine.on('error', (err) => {
      clearTimeout(timeout);
      engine.destroy();
      engines.delete(key);
      reject(err);
    });
  });
}

// Clean up idle torrent engines every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxIdleMs = 15 * 60 * 1000; // 15 mins
  for (const [key, entry] of engines.entries()) {
    if (now - entry.lastAccess > maxIdleMs) {
      console.log(`[Streamer] Cleaning up idle torrent: ${key}`);
      entry.engine.destroy();
      engines.delete(key);
    }
  }
}, 5 * 60 * 1000);

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = parseUrl(req.url, true);
  const pathname = parsed.pathname;

  // Health check endpoint
  if (pathname === '/health' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'Netfarjo Torrent-to-HTTP Streamer',
        activeTorrents: engines.size,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Stream endpoint: /stream?hash=...&dn=...
  if (pathname === '/stream') {
    const hash = parsed.query.hash || parsed.query.infoHash;
    const dn = parsed.query.dn || parsed.query.title || 'video';

    if (!hash || typeof hash !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing "hash" query parameter' }));
      return;
    }

    try {
      const { file } = await getOrCreateEngine(hash, dn);
      const total = file.length;
      const range = req.headers.range;
      const mime = getMimeType(file.name);

      if (range) {
        // Range request (e.g. "bytes=0-")
        const parts = range.replace(/bytes=/, '').split('-');
        const partialstart = parts[0];
        const partialend = parts[1];

        const start = parseInt(partialstart, 10);
        const end = partialend ? parseInt(partialend, 10) : total - 1;
        const chunksize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mime,
        });

        const stream = file.createReadStream({ start, end });
        stream.pipe(res);

        req.on('close', () => {
          stream.destroy();
        });
      } else {
        // Full stream request
        res.writeHead(200, {
          'Content-Length': total,
          'Accept-Ranges': 'bytes',
          'Content-Type': mime,
        });

        const stream = file.createReadStream();
        stream.pipe(res);

        req.on('close', () => {
          stream.destroy();
        });
      }
    } catch (err) {
      console.error('[Streamer Error]', err.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to stream torrent', message: err.message }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[Netfarjo Streamer] Ready and listening on http://localhost:${PORT}`);
});
