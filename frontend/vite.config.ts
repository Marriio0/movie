import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const TMDB_API_KEY =
  process.env.TMDB_API_KEY ||
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTE2ZTA5YmMyNmYwODYzYjliMDZhMjVjYTFlYTZjMCIsIm5iZiI6MTc3ODk3OTA4MC42NjYsInN1YiI6IjZhMDkxMTA4ZmUyMmMwN2ZiMDdhOGM0YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.-vNHrqROd21vRrl7i3Ha3fpYXbv042QtK2dND2W3qSs';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getTmdbPath(pathname: string, searchParams: URLSearchParams) {
  if (pathname === '/api/public/health') return { isHealth: true };

  const lang = searchParams.get('language') || 'en-US';
  const page = searchParams.get('page') || '1';

  if (pathname === '/api/public/movies/popular')
    return { path: `/movie/popular?language=${lang}&page=${page}` };
  if (pathname === '/api/public/series/popular')
    return { path: `/tv/popular?language=${lang}&page=${page}` };
  if (pathname === '/api/public/trending/today')
    return { path: `/trending/all/day?language=${lang}&page=${page}` };
  if (pathname === '/api/public/trending/movies')
    return { path: `/trending/movie/day?language=${lang}&page=${page}` };
  if (pathname === '/api/public/trending/series')
    return { path: `/trending/tv/day?language=${lang}&page=${page}` };
  if (pathname === '/api/public/movies/top-rated')
    return { path: `/movie/top_rated?language=${lang}&page=${page}` };
  if (pathname === '/api/public/series/top-rated')
    return { path: `/tv/top_rated?language=${lang}&page=${page}` };
  if (pathname === '/api/public/movies/now-playing')
    return { path: `/movie/now_playing?language=${lang}&page=${page}` };
  if (pathname === '/api/public/arabic/moroccan')
    return { path: `/discover/movie?with_origin_country=MA&language=${lang}&page=${page}&sort_by=popularity.desc` };
  if (pathname === '/api/public/arabic/egyptian')
    return { path: `/discover/movie?with_origin_country=EG&language=${lang}&page=${page}&sort_by=popularity.desc` };
  if (pathname === '/api/public/arabic/classic')
    return { path: `/discover/movie?with_origin_country=EG&primary_release_date.lte=2010-01-01&language=${lang}&page=${page}&sort_by=vote_count.desc` };
  if (pathname === '/api/public/arabic/trending')
    return { path: `/discover/movie?with_original_language=ar&language=${lang}&page=${page}&sort_by=popularity.desc` };
  if (pathname === '/api/public/arabic/series')
    return { path: `/discover/tv?with_original_language=ar&language=${lang}&page=${page}&sort_by=popularity.desc` };
  if (pathname === '/api/public/search') {
    const q = searchParams.get('query') || '';
    return { path: `/search/multi?language=${lang}&page=${page}&query=` + encodeURIComponent(q) };
  }

  let m = pathname.match(/^\/api\/public\/movies\/(\d+)\/credits$/);
  if (m) return { path: `/movie/${m[1]}/credits?language=${lang}` };

  m = pathname.match(/^\/api\/public\/series\/(\d+)\/credits$/);
  if (m) return { path: `/tv/${m[1]}/credits?language=${lang}` };

  m = pathname.match(/^\/api\/public\/movies\/(\d+)\/similar$/);
  if (m) return { path: `/movie/${m[1]}/recommendations?language=${lang}` };

  m = pathname.match(/^\/api\/public\/series\/(\d+)\/similar$/);
  if (m) return { path: `/tv/${m[1]}/recommendations?language=${lang}` };

  m = pathname.match(/^\/api\/public\/movies\/(\d+)\/videos$/);
  if (m) return { path: `/movie/${m[1]}/videos?include_video_language=en,fr,ar,null` };

  m = pathname.match(/^\/api\/public\/series\/(\d+)\/videos$/);
  if (m) return { path: `/tv/${m[1]}/videos?include_video_language=en,fr,ar,null` };

  m = pathname.match(/^\/api\/public\/movies\/(\d+)\/watch-providers$/);
  if (m) return { path: '/movie/' + m[1] + '/watch/providers' };

  m = pathname.match(/^\/api\/public\/series\/(\d+)\/watch-providers$/);
  if (m) return { path: '/tv/' + m[1] + '/watch/providers' };

  m = pathname.match(/^\/api\/public\/movies\/(\d+)$/);
  if (m) return { path: `/movie/${m[1]}?language=${lang}&append_to_response=external_ids` };

  m = pathname.match(/^\/api\/public\/series\/(\d+)$/);
  if (m) return { path: `/tv/${m[1]}?language=${lang}&append_to_response=external_ids` };

  return null;
}

function tmdbDevPlugin(): Plugin {
  return {
    name: 'tmdb-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/public')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');

        if (url.pathname === '/api/public/arabic/stream') {
          const title = url.searchParams.get('title') || '';
          const _season = url.searchParams.get('season') || '1';
          const episode = url.searchParams.get('episode') || '1';
          const type = url.searchParams.get('type') || 'movie';

          if (!title) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Title is required' }));
          }

          try {
            const q =
              type === 'tv'
                ? `مسلسل ${title} الموسم ${_season} الحلقة ${episode}`
                : `فيلم ${title} كامل`;
            const ytRes = await fetch(
              `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                  'Accept-Language': 'ar,en;q=0.9',
                },
              },
            );
            const html = await ytRes.text();
            const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
            let videoId: string | null = null;
            if (match && match.length > 0) {
              const m = match[0].match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
              if (m && m[1]) {
                videoId = m[1];
              }
            }

            if (!videoId) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Stream not found' }));
            }

            const result = {
              success: true,
              videoId,
              embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1&controls=1`,
            };
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify(result));
          } catch (err: unknown) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: String(err) }));
          }
        }

        const mapping = getTmdbPath(url.pathname, url.searchParams);

        if (!mapping) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }

        if (mapping.isHealth) {
          res.statusCode = 200;
          return res.end('OK');
        }

        try {
          const tmdbUrl = `${TMDB_BASE_URL}${mapping.path}`;
          const tmdbRes = await fetch(tmdbUrl, {
            headers: {
              Authorization: `Bearer ${TMDB_API_KEY}`,
              Accept: 'application/json',
            },
          });

          const data = await tmdbRes.text();
          res.statusCode = tmdbRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(data);
        } catch (err: unknown) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), tmdbDevPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
