const TMDB_API_KEY =
  process.env.TMDB_API_KEY ||
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MmU4YmMyYjRkZjgwZDY2NDYyYjM2MjU1MzE0MWU1MiIsIm5iZiI6MTc3ODk3OTA4MC42NjYsInN1YiI6IjZhMDkxMTA4ZmUyMmMwN2ZiMDdhOGM0YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.mHG9fpj7__YNBUkflalGOZH4sHqr2WWsvktjdBpCOZ8';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getTmdbPath(pathname, searchParams) {
  if (pathname === '/api/public/health') return { isHealth: true };
  if (pathname === '/api/public/movies/popular')
    return { path: '/movie/popular?language=fr-FR&page=1' };
  if (pathname === '/api/public/series/popular')
    return { path: '/tv/popular?language=fr-FR&page=1' };
  if (pathname === '/api/public/trending/today')
    return { path: '/trending/all/day?language=fr-FR' };
  if (pathname === '/api/public/trending/movies')
    return { path: '/trending/movie/day?language=fr-FR' };
  if (pathname === '/api/public/trending/series')
    return { path: '/trending/tv/day?language=fr-FR' };
  if (pathname === '/api/public/movies/top-rated')
    return { path: '/movie/top_rated?language=fr-FR&page=1' };
  if (pathname === '/api/public/series/top-rated')
    return { path: '/tv/top_rated?language=fr-FR&page=1' };
  if (pathname === '/api/public/movies/now-playing')
    return { path: '/movie/now_playing?language=fr-FR&page=1' };
  if (pathname === '/api/public/search') {
    const q = searchParams.get('query') || '';
    return { path: '/search/multi?language=fr-FR&query=' + encodeURIComponent(q) };
  }

  let m = pathname.match(/^\/api\/public\/movies\/(\d+)\/credits$/);
  if (m) return { path: '/movie/' + m[1] + '/credits?language=fr-FR' };

  m = pathname.match(/^\/api\/public\/series\/(\d+)\/credits$/);
  if (m) return { path: '/tv/' + m[1] + '/credits?language=fr-FR' };

  m = pathname.match(/^\/api\/public\/movies\/(\d+)\/videos$/);
  if (m)
    return {
      path: '/movie/' + m[1] + '/videos?language=fr-FR&include_video_language=fr,en,null',
    };

  m = pathname.match(/^\/api\/public\/series\/(\d+)\/videos$/);
  if (m)
    return {
      path: '/tv/' + m[1] + '/videos?language=fr-FR&include_video_language=fr,en,null',
    };

  m = pathname.match(/^\/api\/public\/movies\/(\d+)\/watch-providers$/);
  if (m) return { path: '/movie/' + m[1] + '/watch/providers' };

  m = pathname.match(/^\/api\/public\/series\/(\d+)\/watch-providers$/);
  if (m) return { path: '/tv/' + m[1] + '/watch/providers' };

  m = pathname.match(/^\/api\/public\/movies\/(\d+)$/);
  if (m) return { path: '/movie/' + m[1] + '?language=fr-FR&append_to_response=external_ids' };

  m = pathname.match(/^\/api\/public\/series\/(\d+)$/);
  if (m) return { path: '/tv/' + m[1] + '?language=fr-FR&append_to_response=external_ids' };

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const mapping = getTmdbPath(url.pathname, url.searchParams);

    if (!mapping) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    if (mapping.isHealth) {
      return res.status(200).send('OK');
    }

    const tmdbUrl = `${TMDB_BASE_URL}${mapping.path}`;
    const tmdbResponse = await fetch(tmdbUrl, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        Accept: 'application/json',
      },
    });

    const data = await tmdbResponse.json();
    return res.status(tmdbResponse.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Serverless TMDB Proxy error', message: err.message });
  }
}
