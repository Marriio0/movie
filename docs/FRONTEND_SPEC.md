# Frontend Implementation Spec — React + Vite + TypeScript

Working name: **Marquee**. It lives in one constant (`APP_NAME`), so renaming later is a one-line change.

This document covers execution only. Every decision below is final for v1 unless a section says otherwise.

---

## 0. Backend prerequisites (from the audit of `src/main/java`)

The frontend below assumes these fixes are in place. The first three **block authentication entirely**.

| # | Problem found in current code | File | Required change |
|---|---|---|---|
| B1 | JWT issuer points to FusionAuth (`http://localhost:9011`), not Firebase | `application.properties` | `jwt.issuer-uri=https://securetoken.google.com/${FIREBASE_PROJECT_ID}`<br>`jwt.jwk-set-uri=https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`<br>`jwt.audiences=${FIREBASE_PROJECT_ID}` |
| B2 | `CorsFilter` is a plain servlet filter ordered after Spring Security, so browser preflight (`OPTIONS`) for `/api/watchlist/**` and `/api/user/**` is rejected with 401 before CORS headers are added | `CorsConfig`, `SecurityConfig` | Replace the `CorsFilter` bean with a `CorsConfigurationSource` bean and add `http.cors(Customizer.withDefaults())`. Read allowed origins from config (`app.cors.origins`) |
| B3 | Library writes throw `User not found` if `/api/user/profile` was never called | `WatchlistService` | Call `userService.getOrCreateUser(jwt)` in library endpoints. The frontend also prefetches the profile on login (§6), but the backend must not depend on that |
| B4 | Firebase tokens have no `preferred_username`/`given_name`. Every user becomes `User-xxxxxxxx` | `UserService` | Read the `name` and `picture` claims |
| B5 | `Movie` is keyed by `tmdbId` only. TMDB movie and TV ids overlap (movie 1399 ≠ tv 1399), so a series can attach to the wrong node | `Movie`, `MovieRepository`, `WatchlistService` | Look up by `(mediaType, tmdbId)`. Always persist `mediaType` |
| B6 | `body.get("posterPath").toString()` throws an NPE (HTTP 500) when TMDB has no poster, which is common | `WatchlistController` | Use a typed request DTO with nullable fields |
| B7 | Search concatenates the raw query into the URI (spaces, `&`, `#` break it). No `page` or `language` params. `fr-FR` is hard-coded | `TmdbService` | Use `uriBuilder.queryParam(...)`. Accept `page` and `language` (default `en-US`) |
| B8 | TMDB 404s become HTTP 500 | `TmdbService` | Catch `HttpClientErrorException.NotFound` and return 404 so the frontend can show "Title not found" |
| B9 | TMDB bearer token and Neo4j password are committed in `application.properties` | config | Rotate the TMDB token. Load both from env vars (`${TMDB_TOKEN}`) |

### Target API contract (the only URLs the frontend calls)

All TMDB passthrough stays **raw TMDB JSON** for v1. The frontend maps it in one place (`catalog.mappers.ts`), so switching the backend to DTOs later only touches that file.

| Method | Path | Auth | Status | Notes |
|---|---|---|---|---|
| GET | `/api/public/trending?window=week&page=1` | – | **new** | TMDB `/trending/all/{window}` |
| GET | `/api/public/movies/popular?page=1` | – | exists (add `page`) | |
| GET | `/api/public/series/popular?page=1` | – | exists (add `page`) | |
| GET | `/api/public/search?query=&page=1` | – | exists (fix encoding) | `search/multi`. Frontend drops `person` results |
| GET | `/api/public/movies/{id}` | – | exists | |
| GET | `/api/public/series/{id}` | – | exists | |
| GET | `/api/public/movies/{id}/credits` | – | exists | |
| GET | `/api/public/series/{id}/credits` | – | exists | |
| GET | `/api/user/profile` | Bearer | exists (reshape) | Upserts the user node. Returns `UserProfileDto` |
| GET | `/api/library` | Bearer | **replaces** `GET /api/watchlist` | Returns all three lists |
| PUT | `/api/library/{list}/{mediaType}/{tmdbId}` | Bearer | **replaces** `POST /watched`, `/liked` | Idempotent add. `list ∈ watchlist\|watched\|liked` |
| DELETE | `/api/library/{list}/{mediaType}/{tmdbId}` | Bearer | **replaces** `DELETE /watched/{id}`… | Idempotent remove. Returns 204 |

Neo4j gains one relationship, `(:User)-[:WATCHLIST {addedAt}]->(:Movie)`, next to the existing `WATCHED` and `LIKED`. Put `addedAt` on all three relationships (use `@RelationshipProperties`).

**Payloads**

```http
PUT /api/library/watchlist/movie/693134
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{ "title": "Dune: Part Two", "posterPath": "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  "releaseDate": "2024-02-27", "rating": 8.2 }
```
```json
// 200
{ "tmdbId": 693134, "mediaType": "movie", "title": "Dune: Part Two",
  "posterPath": "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", "releaseDate": "2024-02-27",
  "rating": 8.2, "addedAt": "2026-09-27T10:14:03Z" }
```
```json
// GET /api/library → 200
{ "watchlist": [ /* LibraryItemDto[] newest first */ ], "watched": [], "liked": [] }
```
```json
// GET /api/user/profile → 200
{ "uid": "k3Jd9…", "email": "reda@example.com", "displayName": "Reda",
  "photoUrl": null, "createdAt": "2026-09-01T08:00:00Z",
  "stats": { "watchlist": 12, "watched": 40, "liked": 9 } }
```
```json
// Any error (Spring default body; keep it)
{ "timestamp": "...", "status": 404, "error": "Not Found", "message": "Title not found", "path": "/api/public/movies/0" }
```

**Profile edits do not need an endpoint.** The display name is changed with Firebase `updateProfile()`. The client then force-refreshes the ID token, whose new `name` claim reaches Neo4j on the next `GET /api/user/profile` through `getOrCreateUser`. Firebase remains the only owner of identity data.

---

## 1. Stack (locked)

| Concern | Choice |
|---|---|
| Build | Vite 8 + `@vitejs/plugin-react` + TypeScript 6.0 `strict` (pinned `~6.0`: `typescript-eslint` doesn't support 6.1+ yet) |
| Routing | `react-router` v8, data router (`createBrowserRouter`) with lazy routes. `RouterProvider` is imported from `react-router/dom` |
| HTTP | `axios` v1: one `httpClient` instance in `shared/api/http-client.ts` (interceptors for token, 401 retry, error normalization) |
| Server state | `@tanstack/react-query` v5 |
| Session state | React context (`AuthProvider`) over the Firebase `onAuthStateChanged` listener |
| URL state | Search query, library tab and browse page live in the URL, not in stores |
| Global client store | **One tiny store:** the theme preference (`useSyncExternalStore`, no library). No Redux or Zustand |
| Auth SDK | `firebase` (modular `firebase/auth` only) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) over CSS-variable design tokens |
| Primitives | `radix-ui` (Dialog, DropdownMenu, Tooltip, Tabs, Avatar, VisuallyHidden) |
| Icons | `lucide-react` |
| Toasts | `sonner` |
| Carousels | Native CSS scroll-snap plus arrow buttons (no carousel library) |
| Motion | CSS transitions and keyframes only. No animation library in v1 |
| Fonts | `@fontsource-variable/geist` (UI), `@fontsource/instrument-serif` (display) |
| Testing | Vitest, Testing Library, `msw` for API mocking |
| Lint/format | ESLint (flat config, `typescript-eslint`, `react-hooks`), Prettier with `prettier-plugin-tailwindcss` |

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm i react-router @tanstack/react-query firebase zod react-hook-form @hookform/resolvers radix-ui lucide-react sonner clsx tailwind-merge @fontsource-variable/geist @fontsource/instrument-serif
npm i -D tailwindcss @tailwindcss/vite @tanstack/react-query-devtools vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw prettier prettier-plugin-tailwindcss
```

---

## 2. Exact folder structure

The frontend lives in `movie-main/frontend/`, next to the Spring Boot project.

```
frontend/
├─ index.html
├─ vite.config.ts
├─ vitest.config.ts
├─ tsconfig.json · tsconfig.app.json · tsconfig.node.json
├─ eslint.config.js · .prettierrc
├─ .env.example · .env.local (git-ignored)
├─ public/
│  ├─ favicon.svg
│  └─ og-image.jpg
└─ src/
   ├─ main.tsx                         # createRoot → <App/>
   ├─ app/
   │  ├─ App.tsx                       # <Providers><RouterProvider/></Providers>
   │  ├─ providers.tsx                 # QueryClientProvider, AuthProvider, Tooltip.Provider, Toaster
   │  ├─ query-client.ts               # QueryClient + defaults
   │  ├─ router.tsx                    # createBrowserRouter tree (§3)
   │  ├─ paths.ts                      # typed path builders
   │  ├─ layouts/
   │  │  ├─ RootShell.tsx              # ScrollRestoration + Outlet (top-level)
   │  │  ├─ MainLayout.tsx             # Navbar + <main> + Footer
   │  │  └─ AuthLayout.tsx             # backdrop collage + centered card
   │  └─ guards/
   │     ├─ RequireAuth.tsx
   │     └─ GuestOnly.tsx
   ├─ pages/
   │  ├─ HomePage.tsx
   │  ├─ BrowsePage.tsx                # exports MoviesBrowsePage, SeriesBrowsePage
   │  ├─ TitleDetailPage.tsx           # exports MovieDetailPage, SeriesDetailPage
   │  ├─ SearchPage.tsx
   │  ├─ LoginPage.tsx
   │  ├─ SignupPage.tsx
   │  ├─ ResetPasswordPage.tsx
   │  ├─ WatchlistPage.tsx
   │  ├─ ProfilePage.tsx
   │  ├─ NotFoundPage.tsx
   │  └─ RouteErrorPage.tsx
   ├─ features/
   │  ├─ auth/
   │  │  ├─ AuthProvider.tsx
   │  │  ├─ auth-context.ts            # createContext + AuthContextValue type
   │  │  ├─ useAuth.ts
   │  │  ├─ auth.service.ts            # thin wrappers over firebase/auth
   │  │  ├─ auth-errors.ts             # Firebase error code → user message
   │  │  ├─ pending-intent.ts          # "add to watchlist after login"
   │  │  ├─ schemas.ts                 # zod: login, signup, reset
   │  │  ├─ session-user.ts            # FirebaseUser → SessionUser
   │  │  └─ components/
   │  │     ├─ LoginForm.tsx
   │  │     ├─ SignupForm.tsx
   │  │     ├─ ResetPasswordForm.tsx
   │  │     ├─ GoogleButton.tsx
   │  │     ├─ AuthCard.tsx
   │  │     └─ PasswordInput.tsx
   │  ├─ catalog/
   │  │  ├─ api/
   │  │  │  ├─ tmdb.types.ts           # raw TMDB shapes
   │  │  │  ├─ catalog.mappers.ts      # raw → domain (single mapping point)
   │  │  │  ├─ catalog.mappers.test.ts
   │  │  │  ├─ catalog.api.ts          # fetch functions
   │  │  │  └─ catalog.queries.ts      # keys + queryOptions factories
   │  │  ├─ hooks/
   │  │  │  ├─ useTrending.ts
   │  │  │  ├─ usePopular.ts           # infinite
   │  │  │  ├─ useTitleDetails.ts
   │  │  │  ├─ useCredits.ts
   │  │  │  └─ useSearch.ts            # infinite
   │  │  └─ components/
   │  │     ├─ HeroBillboard.tsx
   │  │     ├─ MediaCard.tsx
   │  │     ├─ MediaCardSkeleton.tsx
   │  │     ├─ MediaRail.tsx
   │  │     ├─ MediaGrid.tsx
   │  │     ├─ InfiniteGridFooter.tsx
   │  │     ├─ TitleHero.tsx
   │  │     ├─ TitleMeta.tsx
   │  │     ├─ CastRail.tsx
   │  │     ├─ PersonCard.tsx
   │  │     └─ RatingBadge.tsx
   │  ├─ search/
   │  │  └─ components/
   │  │     ├─ SearchBar.tsx           # navbar input, drives /search?q=
   │  │     └─ SearchEmptyHint.tsx
   │  ├─ library/
   │  │  ├─ api/
   │  │  │  ├─ library.types.ts
   │  │  │  ├─ library.api.ts
   │  │  │  └─ library.queries.ts
   │  │  ├─ library.utils.ts           # applyLibraryChange, toLibraryItem
   │  │  ├─ hooks/
   │  │  │  ├─ useLibrary.ts
   │  │  │  ├─ useLibraryStatus.ts
   │  │  │  ├─ useLibraryMutation.ts   # optimistic add/remove
   │  │  │  └─ useConsumePendingIntent.ts
   │  │  └─ components/
   │  │     ├─ WatchlistButton.tsx     # primary CTA
   │  │     ├─ LibraryToggle.tsx       # icon toggle for watched / liked
   │  │     ├─ LibraryTabs.tsx
   │  │     └─ LibraryGrid.tsx
   │  └─ profile/
   │     ├─ api/profile.api.ts
   │     ├─ api/profile.queries.ts
   │     ├─ hooks/useProfile.ts
   │     └─ components/
   │        ├─ ProfileHeader.tsx
   │        ├─ StatTiles.tsx
   │        ├─ DisplayNameForm.tsx
   │        └─ AccountSection.tsx      # email, provider, verify email, sign out
   ├─ shared/
   │  ├─ api/
   │  │  ├─ http-client.ts             # Axios instance: base URL, token, 401 retry, errors
   │  │  ├─ http.test.ts
   │  │  ├─ normalize-error.ts         # Axios error → ApiError
   │  │  └─ api-error.ts               # ApiError + ApiErrorKind
   │  ├─ config/
   │  │  ├─ env.ts                     # zod-validated import.meta.env
   │  │  └─ app.ts                     # APP_NAME, LOCALE, page sizes
   │  ├─ lib/
   │  │  ├─ firebase.ts                # initializeApp + getAuth (only file importing firebase/app)
   │  │  ├─ tmdb-image.ts              # URL + srcSet builders
   │  │  ├─ format.ts                  # year, runtime, rating, relative date
   │  │  ├─ safe-redirect.ts
   │  │  └─ cn.ts                      # clsx + tailwind-merge
   │  ├─ hooks/
   │  │  ├─ useDebouncedValue.ts
   │  │  ├─ useDocumentTitle.ts
   │  │  ├─ useInfiniteScroll.ts       # IntersectionObserver sentinel
   │  │  ├─ useScrollRail.ts           # arrow state for rails
   │  │  └─ useScrolled.ts             # navbar background on scroll
   │  ├─ types/
   │  │  ├─ media.ts
   │  │  ├─ user.ts
   │  │  └─ api.ts
   │  ├─ ui/                           # design-system primitives, no domain knowledge
   │  │  ├─ Button.tsx · IconButton.tsx
   │  │  ├─ Input.tsx · Field.tsx
   │  │  ├─ Skeleton.tsx · Spinner.tsx
   │  │  ├─ Dialog.tsx · DropdownMenu.tsx · Tooltip.tsx · Tabs.tsx
   │  │  ├─ Avatar.tsx · Badge.tsx
   │  │  ├─ EmptyState.tsx · ErrorState.tsx
   │  │  ├─ SectionHeader.tsx
   │  │  └─ Container.tsx
   │  └─ components/                   # app chrome, may use features
   │     ├─ Navbar.tsx
   │     ├─ MobileNavSheet.tsx
   │     ├─ UserMenu.tsx
   │     ├─ Footer.tsx
   │     ├─ TmdbImage.tsx
   │     ├─ FullPageSplash.tsx
   │     └─ SkipLink.tsx
   ├─ styles/
   │  ├─ tokens.css                    # primitives + semantic tokens (§9)
   │  ├─ globals.css                   # @import tailwind, @theme, base layer
   │  └─ fonts.css
   └─ test/
      ├─ setup.ts
      ├─ render.tsx                    # renderWithProviders
      ├─ fixtures/                     # raw TMDB JSON samples
      └─ msw/
         ├─ handlers.ts
         └─ server.ts
```

**Import rules** (enforced with the ESLint `no-restricted-imports` rule):
- `shared/ui` imports nothing from `features/` or `pages/`.
- `features/X` never imports `features/Y` internals. Cross-feature use goes through the component or hook files only. `library` may import `catalog` types.
- Only `shared/lib/firebase.ts` and `features/auth/*` import from `firebase/*`.
- Only `shared/api/http-client.ts` makes HTTP requests (Axios).

**Config files**

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } }, // no CORS in dev
});
```
```jsonc
// tsconfig.app.json (additions)
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "baseUrl": ".", "paths": { "@/*": ["src/*"] } } }
```
```bash
# .env.example
VITE_API_BASE_URL=            # empty in dev (Vite proxy); https://api.yourdomain.com in prod
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## 3. Route files

### `src/app/paths.ts`
```ts
import type { MediaType } from '@/shared/types/media';
import type { LibraryList } from '@/features/library/api/library.types';

const q = (k: string, v?: string) => (v ? `?${k}=${encodeURIComponent(v)}` : '');

export const paths = {
  home: '/',
  movies: '/movies',
  series: '/series',
  title: (t: MediaType, id: number) => `/${t === 'movie' ? 'movies' : 'series'}/${id}`,
  search: (query?: string) => `/search${q('q', query)}`,
  login: (redirect?: string) => `/login${q('redirect', redirect)}`,
  signup: (redirect?: string) => `/signup${q('redirect', redirect)}`,
  resetPassword: '/reset-password',
  watchlist: (tab?: LibraryList) => `/watchlist${tab && tab !== 'watchlist' ? q('tab', tab) : ''}`,
  profile: '/profile',
} as const;
```

### `src/app/router.tsx`
```tsx
import { createBrowserRouter, type RouteObject } from 'react-router';
import type { ComponentType } from 'react';
import { RootShell } from './layouts/RootShell';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { RequireAuth } from './guards/RequireAuth';
import { GuestOnly } from './guards/GuestOnly';
import { RouteErrorPage } from '@/pages/RouteErrorPage';

// Lazy page helper: keeps named exports, one chunk per page file.
const page =
  <M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M) =>
  async () => ({ Component: (await load())[name] as ComponentType });

const routes: RouteObject[] = [
  {
    element: <RootShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, lazy: page(() => import('@/pages/HomePage'), 'HomePage') },
          { path: 'movies', lazy: page(() => import('@/pages/BrowsePage'), 'MoviesBrowsePage') },
          { path: 'series', lazy: page(() => import('@/pages/BrowsePage'), 'SeriesBrowsePage') },
          { path: 'movies/:id', lazy: page(() => import('@/pages/TitleDetailPage'), 'MovieDetailPage') },
          { path: 'series/:id', lazy: page(() => import('@/pages/TitleDetailPage'), 'SeriesDetailPage') },
          { path: 'search', lazy: page(() => import('@/pages/SearchPage'), 'SearchPage') },
          {
            element: <RequireAuth />,
            children: [
              { path: 'watchlist', lazy: page(() => import('@/pages/WatchlistPage'), 'WatchlistPage') },
              { path: 'profile', lazy: page(() => import('@/pages/ProfilePage'), 'ProfilePage') },
            ],
          },
          { path: '*', lazy: page(() => import('@/pages/NotFoundPage'), 'NotFoundPage') },
        ],
      },
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', lazy: page(() => import('@/pages/LoginPage'), 'LoginPage') },
              { path: 'signup', lazy: page(() => import('@/pages/SignupPage'), 'SignupPage') },
            ],
          },
        ],
      },
      // Reachable signed-in or out (e.g. from the profile page), so no GuestOnly
      {
        element: <AuthLayout />,
        children: [
          { path: 'reset-password', lazy: page(() => import('@/pages/ResetPasswordPage'), 'ResetPasswordPage') },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
```

### Route table

| Path | Page export | Access | URL state |
|---|---|---|---|
| `/` | `HomePage` | public | – |
| `/movies` | `MoviesBrowsePage` | public | – (infinite scroll) |
| `/series` | `SeriesBrowsePage` | public | – |
| `/movies/:id` | `MovieDetailPage` | public | `:id` positive int |
| `/series/:id` | `SeriesDetailPage` | public | `:id` positive int |
| `/search` | `SearchPage` | public | `?q=` |
| `/login` | `LoginPage` | guest only | `?redirect=` |
| `/signup` | `SignupPage` | guest only | `?redirect=` |
| `/reset-password` | `ResetPasswordPage` | anyone | – |
| `/watchlist` | `WatchlistPage` | authenticated | `?tab=watchlist\|watched\|liked` |
| `/profile` | `ProfilePage` | authenticated | – |
| `*` | `NotFoundPage` | public | – |
| (errorElement) | `RouteErrorPage` | – | chunk-load or render crash |

### Guards

```tsx
// guards/RequireAuth.tsx
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSplash />;
  if (status === 'anonymous')
    return <Navigate to={paths.login(location.pathname + location.search)} replace />;
  return <Outlet />;
}

// guards/GuestOnly.tsx
export function GuestOnly() {
  const { status } = useAuth();
  const [params] = useSearchParams();
  if (status === 'loading') return <FullPageSplash />;
  if (status === 'authenticated') return <Navigate to={safeRedirect(params.get('redirect'))} replace />;
  return <Outlet />;
}

// shared/lib/safe-redirect.ts — blocks open redirects (//evil.com, https://…)
export const safeRedirect = (v: string | null, fallback = '/') =>
  v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : fallback;
```

---

## 4. Page list

| Page | Data (hooks) | Sections | Loading | Empty | Error |
|---|---|---|---|---|---|
| **HomePage** | `useTrending`, `usePopular('movie')`, `usePopular('tv')`, `useLibrary` (if authed) | HeroBillboard (trending[0]); rails: Trending this week · Popular movies · Popular series · "Continue your watchlist" (authed with ≥1 item) | Hero skeleton + 3 rail skeletons (fixed heights, no layout shift) | Rail hidden if its query returns 0 items | Per-rail `ErrorState compact` with retry; the page never fully fails |
| **BrowsePage** (`movie`/`tv`) | `usePopular(type)` infinite | Page title, `MediaGrid`, `InfiniteGridFooter` | 18 card skeletons | "Nothing to show right now" | Full `ErrorState` on first page; inline retry in footer on later pages |
| **TitleDetailPage** | `useTitleDetails`, `useCredits`, `useLibraryStatus` | `TitleHero` (backdrop, poster, title, `TitleMeta`, tagline, overview, CTAs), Cast rail, Crew line (Director / Created by), Facts (status, original language, runtime or seasons) | Hero skeleton with poster box. Credits load independently | No cast → section hidden. No overview → "No synopsis available." | Invalid id or 404 → `NotFoundState`. 5xx → `ErrorState` + retry |
| **SearchPage** | `useSearch(q)` infinite, `q` from URL | Results count line, `MediaGrid` | Grid skeleton, only while `q.length ≥ 2` | No `q`: `SearchEmptyHint` (trending shortcuts). No results: "No matches for “q”" + suggestions | `ErrorState` + retry |
| **LoginPage** | `useAuth` | `AuthCard`: Google button, divider, email/password form, "Forgot password?", link to signup | Submit button spinner, fields disabled | – | Inline form error (mapped Firebase code) |
| **SignupPage** | `useAuth` | `AuthCard`: Google, display name, email, password (live strength rules), terms line | same | – | same |
| **ResetPasswordPage** | `auth.service.sendReset` | Email field → success panel ("If an account exists, we sent a link") | spinner | – | Rate limit → message. Never reveal whether the account exists |
| **WatchlistPage** | `useLibrary`, `?tab` | Header with counts, `LibraryTabs`, `LibraryGrid` (sort: recently added), remove on hover or focus | Grid skeleton | Per tab: watchlist → "Save titles to watch later" + CTA Browse. Watched and liked have their own copy | `ErrorState` + retry |
| **ProfilePage** | `useProfile`, `useAuth` | `ProfileHeader` (avatar, name, member since), `StatTiles` (linking to tabs), `DisplayNameForm`, `AccountSection` (email, provider, verify-email banner, reset password, sign out) | Skeleton header + tiles | – | `ErrorState`. Sign out stays available |
| **NotFoundPage** | – | Big display "404", one line, CTAs Home / Search | – | – | – |
| **RouteErrorPage** | `useRouteError` | Chunk-load error → "A new version is available" + reload. Anything else → generic + Home | – | – | – |

Every page calls `useDocumentTitle('Dune: Part Two')`, which renders `Dune: Part Two · Marquee`.

---

## 5. Component list

### `shared/ui` (primitives)

| Component | Key props | Notes |
|---|---|---|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `loading`, `asChild` | `loading` sets `aria-busy`, keeps the width, shows a spinner |
| `IconButton` | `label` (required, becomes `aria-label`), `variant`, `size`, `pressed?` | `pressed` sets `aria-pressed` for toggles |
| `Input` | native input props + `invalid` | |
| `Field` | `label`, `error?`, `hint?`, `children` | Wires `id`, `aria-describedby` and `aria-invalid` |
| `Skeleton` | `className` | Shimmer disabled under `prefers-reduced-motion` |
| `Spinner` | `size` | |
| `Dialog` | Radix wrapper: `title`, `description`, `children` | Focus trap and Esc come from Radix |
| `DropdownMenu` | Radix wrapper | Used by `UserMenu` |
| `Tooltip` | `content`, `children` | Icon buttons only |
| `Tabs` | Radix wrapper, controlled `value` | `LibraryTabs` binds it to `?tab` |
| `Avatar` | `src?`, `name` | Falls back to initials on a tinted background |
| `Badge` | `tone: 'neutral'\|'accent'` | Genre chips, "Series" tag |
| `EmptyState` | `icon`, `title`, `body`, `action?` | |
| `ErrorState` | `title?`, `error`, `onRetry?`, `compact?` | Derives its message from `ApiError` |
| `SectionHeader` | `title`, `href?`, `actionLabel?`, `children?` (arrows) | |
| `Container` | `size: 'default'\|'wide'` | Max width and gutters come from tokens |

### `shared/components` (app chrome)

| Component | Behavior |
|---|---|
| `Navbar` | Fixed and transparent over heroes; switches to `bg-canvas/80 backdrop-blur` after 24px of scroll (`useScrolled`). Left: logo, Home, Movies, Series. Center/right: `SearchBar`, then `UserMenu` or a "Sign in" button. Below `md`, links collapse into `MobileNavSheet`. |
| `MobileNavSheet` | Radix Dialog as a left sheet. Closes on route change. |
| `UserMenu` | Avatar trigger showing Watchlist, Profile, Sign out. Renders a 32px skeleton circle while `status==='loading'`, so the navbar never flashes "Sign in". |
| `Footer` | Required TMDB attribution with logo ("This product uses the TMDB API but is not endorsed or certified by TMDB"), GitHub link, ©. |
| `TmdbImage` | `path`, `kind: 'poster'\|'backdrop'\|'profile'`, `alt`, `sizes`, `priority?`. Builds `srcSet`, uses `loading="lazy"` unless `priority`, reserves the aspect ratio, fades in on load, and shows a title-initials fallback when the path is null or fails to load. |
| `FullPageSplash` | Centered logo mark with a slow pulse. Used only while auth is resolving. |
| `SkipLink` | "Skip to content" → `#main`, first focusable element. |

### Feature components

| Component | Feature | Props | Behavior |
|---|---|---|---|
| `HeroBillboard` | catalog | `media: MediaSummary` | Full-bleed backdrop (`priority`), bottom and left scrims, display-font title, year · rating · type badge, 3-line overview, CTAs "View details" and `WatchlistButton`. Height `min(78vh, 760px)`. |
| `MediaCard` | catalog | `media`, `size?: 'sm'\|'md'`, `rank?` | Poster in a 2:3 frame; title and year below. On hover or focus: lift 4px plus ring. On desktop hover, a corner `WatchlistButton variant="icon"` appears. The whole card is a `<Link>`; the button stops propagation. |
| `MediaCardSkeleton` | catalog | `size` | Same box as the card. |
| `MediaRail` | catalog | `title`, `href?`, `items`, `isLoading`, `error`, `onRetry` | Horizontal scroll-snap list (`<ul role="list">`). Arrow `IconButton`s appear on hover (desktop) and disable at the edges. Touch uses native scroll. |
| `MediaGrid` | catalog | `items`, `isLoading`, `skeletonCount` | `grid-cols-[repeat(auto-fill,minmax(150px,1fr))]`, 160px min at `lg`. |
| `InfiniteGridFooter` | catalog | `query` (infinite result) | Sentinel + spinner + retry + "You've reached the end". |
| `TitleHero` | catalog | `details`, `libraryStatus` | Detail-page header. |
| `TitleMeta` | catalog | `details` | `2024 · 2h 46m · Sci-Fi, Adventure · ★ 8.2`. |
| `CastRail` / `PersonCard` | catalog | `cast` | Top 15 billed. Round profile images with initials fallback. |
| `RatingBadge` | catalog | `rating`, `votes` | Hidden when `votes < 10` (TMDB noise). |
| `SearchBar` | search | – | Controlled by `?q` when on `/search`. Debounced 300ms: on `/search` it updates `q` with `replace: true`; elsewhere Enter navigates to `/search?q=`. `/` shortcut focuses it; Esc clears. |
| `WatchlistButton` | library | `media`, `variant: 'full'\|'icon'` | Shows "＋ Watchlist" or "✓ In watchlist". Anonymous click saves the pending intent and navigates to login with a redirect. Optimistic. Disabled while its own mutation is pending. |
| `LibraryToggle` | library | `media`, `list: 'watched'\|'liked'` | `IconButton` with `aria-pressed` (Eye / Heart). Same auth and optimistic rules. |
| `LibraryTabs` | library | `counts` | Tabs synced to `?tab`. |
| `LibraryGrid` | library | `items`, `list` | Reuses `MediaCard` via `libraryItemToSummary`, plus a remove `IconButton`. Shows an "Undo" toast after removal. |
| `LoginForm` / `SignupForm` / `ResetPasswordForm` | auth | `onSuccess?` | RHF + zod. The first invalid field receives focus on submit. |
| `GoogleButton` | auth | – | `signInWithPopup`. `auth/popup-closed-by-user` is ignored silently. |
| `AuthCard` | auth | `title`, `subtitle`, `footer` | |
| `PasswordInput` | auth | input props | Show/hide toggle. |
| `ProfileHeader`, `StatTiles`, `DisplayNameForm`, `AccountSection` | profile | – | See page table. |

---

## 6. TypeScript interfaces

### `shared/types/media.ts`
```ts
export type MediaType = 'movie' | 'tv';

export interface Genre { id: number; name: string }

export interface MediaSummary {
  id: number;                 // TMDB id
  mediaType: MediaType;
  title: string;              // movie.title | tv.name
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null; // movie.release_date | tv.first_air_date ('' → null)
  year: number | null;
  rating: number | null;      // vote_average, null when voteCount === 0
  voteCount: number;
}

export interface MediaDetails extends MediaSummary {
  tagline: string | null;
  genres: Genre[];
  runtimeMinutes: number | null;   // movie.runtime | tv.episode_run_time[0]
  status: string | null;
  originalLanguage: string;
  seasonCount: number | null;      // tv only
  episodeCount: number | null;     // tv only
  createdBy: { id: number; name: string }[]; // tv only, [] for movies
  homepage: string | null;
}

export interface CastMember { id: number; name: string; character: string; profilePath: string | null; order: number }
export interface CrewMember { id: number; name: string; job: string; department: string; profilePath: string | null }
export interface Credits { cast: CastMember[]; directors: CrewMember[] }

export interface Page<T> { page: number; totalPages: number; totalResults: number; results: T[] }
```

### `features/catalog/api/tmdb.types.ts` (raw, exactly as TMDB sends it)
```ts
export interface TmdbPage<T> { page: number; total_pages: number; total_results: number; results: T[] }

interface TmdbBase {
  id: number; overview: string; poster_path: string | null; backdrop_path: string | null;
  vote_average: number; vote_count: number; genre_ids?: number[]; original_language: string;
}
export interface TmdbMovie extends TmdbBase { media_type?: 'movie'; title: string; release_date?: string }
export interface TmdbTv extends TmdbBase { media_type?: 'tv'; name: string; first_air_date?: string }
export interface TmdbPerson { media_type: 'person'; id: number; name: string }
export type TmdbMultiResult = TmdbMovie | TmdbTv | TmdbPerson;

export interface TmdbMovieDetails extends Omit<TmdbMovie, 'genre_ids'> {
  tagline: string; genres: { id: number; name: string }[]; runtime: number | null; status: string; homepage: string;
}
export interface TmdbTvDetails extends Omit<TmdbTv, 'genre_ids'> {
  tagline: string; genres: { id: number; name: string }[]; episode_run_time: number[]; status: string;
  number_of_seasons: number; number_of_episodes: number; created_by: { id: number; name: string }[]; homepage: string;
}
export interface TmdbCredits {
  cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[];
  crew: { id: number; name: string; job: string; department: string; profile_path: string | null }[];
}
```

### `features/library/api/library.types.ts`
```ts
import type { MediaType } from '@/shared/types/media';

export const LIBRARY_LISTS = ['watchlist', 'watched', 'liked'] as const;
export type LibraryList = (typeof LIBRARY_LISTS)[number];

export interface LibraryItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  rating: number | null;
  addedAt: string;            // ISO
}
export type Library = Record<LibraryList, LibraryItem[]>;

export interface LibraryItemInput {  // PUT body
  title: string; posterPath: string | null; releaseDate: string | null; rating: number | null;
}
export type LibraryStatus = Record<LibraryList, boolean>;
```

### `shared/types/user.ts`
```ts
import type { LibraryList } from '@/features/library/api/library.types';

/** From Firebase — available immediately, no network. */
export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerIds: string[];      // ['password'] | ['google.com']
}

/** From Spring Boot / Neo4j — GET /api/user/profile. */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  createdAt: string;
  stats: Record<LibraryList, number>;
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';
```

### `features/auth/auth-context.ts`
```ts
export interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  signInWithEmail(email: string, password: string): Promise<void>;
  signUpWithEmail(input: { displayName: string; email: string; password: string }): Promise<void>;
  signInWithGoogle(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updateDisplayName(name: string): Promise<void>;
  resendVerificationEmail(): Promise<void>;
  signOut(): Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
```

### `shared/api/api-error.ts` (implemented)
```ts
export type ApiErrorKind =
  | 'offline' | 'network' | 'timeout' | 'canceled'
  | 'unauthorized' | 'forbidden' | 'not_found' | 'bad_request' | 'server';
export interface SpringErrorBody { timestamp?: string; status?: number; error?: string; message?: string; path?: string }
export class ApiError extends Error {
  readonly kind: ApiErrorKind; readonly status: number | null;
  readonly path?: string; readonly body?: SpringErrorBody;
  get isRetryable(): boolean; // network | timeout | server
}
```
`message` is always a fixed, user-safe string chosen by `kind`. The server's `message` field is diagnostic only (Spring leaves it empty by default).

### Auth form schemas (`features/auth/schemas.ts`)
```ts
export const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });
export const signupSchema = z.object({
  displayName: z.string().trim().min(2, 'At least 2 characters').max(40),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').regex(/[0-9]/, 'Include a number').regex(/[A-Za-z]/, 'Include a letter'),
});
export const resetSchema = z.object({ email: z.string().email('Enter a valid email') });
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
```

---

## 7. API service modules

### `shared/api/http-client.ts` (implemented): the only HTTP client

- `httpClient = axios.create({ baseURL: env.apiBaseUrl, timeout: 15_000, withCredentials: false, headers: { Accept: 'application/json' } })`.
- Per-request flag **`authenticated: true`** (not `auth`, which Axios reserves for HTTP Basic credentials).
- Request interceptor:
  1. `navigator.onLine === false` → reject `offline` without sending.
  2. `authenticated` → `Authorization: Bearer <token>` from the registered `AccessTokenProvider`. No provider or token → reject `unauthorized` without sending.
  3. Otherwise `Authorization` is stripped. Public calls never carry credentials and stay simple CORS requests.
- Response interceptor:
  1. A 401 on an `authenticated` request is retried once with `forceRefresh: true`.
  2. A second 401 calls the `setUnauthorizedHandler` callback once.
  3. Every failure is thrown as `normalizeError(error)` → `ApiError`.
- The identity provider plugs in with `setAccessTokenProvider(({ forceRefresh }) => Promise<string | null>)`, so this layer has no Firebase or FusionAuth dependency.
- Query params always go through Axios `params`, never string concatenation.

The snippets below were written for the earlier `apiFetch` helper. Read `apiFetch<T>(path, { query, auth: true, signal })` as `httpClient.get<T>(path, { params: query, authenticated: true, signal }).then((r) => r.data)`.

### `features/catalog/api/catalog.api.ts`
```ts
const lang = { language: APP_LOCALE }; // 'en-US'
const seg = (t: MediaType) => (t === 'movie' ? 'movies' : 'series');

export const catalogApi = {
  trending: (page = 1, signal?: AbortSignal) =>
    apiFetch<TmdbPage<TmdbMultiResult>>('/api/public/trending', { query: { window: 'week', page, ...lang }, signal })
      .then(toPage(toMediaSummaryFromMulti)),
  popular: (t: MediaType, page = 1, signal?: AbortSignal) =>
    apiFetch<TmdbPage<TmdbMovie | TmdbTv>>(`/api/public/${seg(t)}/popular`, { query: { page, ...lang }, signal })
      .then(toPage((r) => toMediaSummary(r, t))),
  search: (query: string, page = 1, signal?: AbortSignal) =>
    apiFetch<TmdbPage<TmdbMultiResult>>('/api/public/search', { query: { query, page, ...lang }, signal })
      .then(toPage(toMediaSummaryFromMulti)),     // drops persons
  details: (t: MediaType, id: number, signal?: AbortSignal) =>
    apiFetch<TmdbMovieDetails | TmdbTvDetails>(`/api/public/${seg(t)}/${id}`, { query: lang, signal })
      .then((r) => toMediaDetails(r, t)),
  credits: (t: MediaType, id: number, signal?: AbortSignal) =>
    apiFetch<TmdbCredits>(`/api/public/${seg(t)}/${id}/credits`, { query: lang, signal }).then(toCredits),
};
```

### `features/catalog/api/catalog.mappers.ts` (signatures, all pure and unit-tested)
```ts
export function toMediaSummary(raw: TmdbMovie | TmdbTv, fallback: MediaType): MediaSummary;
export function toMediaSummaryFromMulti(raw: TmdbMultiResult): MediaSummary | null; // person → null
export function toMediaDetails(raw: TmdbMovieDetails | TmdbTvDetails, t: MediaType): MediaDetails;
export function toCredits(raw: TmdbCredits): Credits; // cast sorted by order, top 20; directors = crew.job==='Director'
export const toPage = <R, T>(map: (r: R) => T | null) => (p: TmdbPage<R>): Page<T>; // filters nulls
```
Rules: `''` dates become `null`; `vote_count === 0` makes `rating: null`; `'title' in raw` decides movie vs tv when `media_type` is absent.

### `features/catalog/api/catalog.queries.ts`
```ts
export const catalogKeys = {
  all: ['catalog'] as const,
  trending: () => [...catalogKeys.all, 'trending'] as const,
  popular: (t: MediaType) => [...catalogKeys.all, 'popular', t] as const,
  search: (q: string) => [...catalogKeys.all, 'search', q] as const,
  details: (t: MediaType, id: number) => [...catalogKeys.all, 'details', t, id] as const,
  credits: (t: MediaType, id: number) => [...catalogKeys.all, 'credits', t, id] as const,
};

export const detailsQuery = (t: MediaType, id: number) =>
  queryOptions({ queryKey: catalogKeys.details(t, id), queryFn: ({ signal }) => catalogApi.details(t, id, signal), staleTime: 30 * 60_000 });

export const popularInfiniteQuery = (t: MediaType) =>
  infiniteQueryOptions({
    queryKey: catalogKeys.popular(t),
    queryFn: ({ pageParam, signal }) => catalogApi.popular(t, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < Math.min(last.totalPages, 500) ? last.page + 1 : undefined), // TMDB caps at 500
    staleTime: 10 * 60_000,
  });
// trendingQuery, searchInfiniteQuery (enabled: q.length >= 2), creditsQuery follow the same pattern
```
`MediaCard` prefetches `detailsQuery` on `pointerenter` or `focus` (`queryClient.prefetchQuery`), so detail pages usually open with data already cached.

### `features/library/api/library.api.ts`
```ts
const base = '/api/library';
export const libraryApi = {
  get: (signal?: AbortSignal) => apiFetch<Library>(base, { auth: true, signal }),
  add: (list: LibraryList, m: MediaSummary) =>
    apiFetch<LibraryItem>(`${base}/${list}/${m.mediaType}/${m.id}`, {
      method: 'PUT', auth: true,
      body: { title: m.title, posterPath: m.posterPath, releaseDate: m.releaseDate, rating: m.rating } satisfies LibraryItemInput,
    }),
  remove: (list: LibraryList, t: MediaType, id: number) =>
    apiFetch<void>(`${base}/${list}/${t}/${id}`, { method: 'DELETE', auth: true }),
};
```

### `features/library/api/library.queries.ts` + profile
```ts
// Every user-scoped key starts with 'me' → one call wipes them on logout or user switch.
export const meKeys = {
  all: ['me'] as const,
  profile: () => [...meKeys.all, 'profile'] as const,
  library: () => [...meKeys.all, 'library'] as const,
};
export const libraryQuery = () =>
  queryOptions({ queryKey: meKeys.library(), queryFn: ({ signal }) => libraryApi.get(signal), staleTime: 60_000 });

// features/profile/api/profile.api.ts
export const profileApi = { get: (signal?: AbortSignal) => apiFetch<UserProfile>('/api/user/profile', { auth: true, signal }) };
export const profileQuery = () =>
  queryOptions({ queryKey: meKeys.profile(), queryFn: ({ signal }) => profileApi.get(signal), staleTime: 5 * 60_000 });
```
(`meKeys` lives in `shared/api/me-keys.ts` so both features import it without cross-feature coupling.)

### `app/query-client.ts` (implemented)
`createQueryClient()` factory, instantiated once in `AppProviders`:
- queries: `staleTime` 5 min, `gcTime` 30 min, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, `retry: shouldRetryQuery`
- mutations: `retry: false`

`shouldRetryQuery` allows at most 2 retries, and only for `ApiError`s where `isRetryable` is true (`network`, `timeout`, `server`).

---

## 8. Auth flow structure

### `shared/lib/firebase.ts`
```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
export const firebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID,
});
export const auth = getAuth(firebaseApp); // default persistence = IndexedDB, survives reloads
```

### `features/auth/AuthProvider.tsx`
```tsx
export function AuthProvider({ children }: PropsWithChildren) {
  const qc = useQueryClient();
  const [state, setState] = useState<{ status: AuthStatus; user: SessionUser | null }>({ status: 'loading', user: null });
  const lastUid = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void fbSignOut(auth);
      toast.error('Your session expired. Please sign in again.');
    });
    return onAuthStateChanged(auth, (fbUser) => {
      const uid = fbUser?.uid ?? null;
      if (lastUid.current !== undefined && lastUid.current !== uid) qc.removeQueries({ queryKey: meKeys.all });
      lastUid.current = uid;
      if (fbUser) {
        setState({ status: 'authenticated', user: toSessionUser(fbUser) });
        void qc.prefetchQuery(profileQuery()); // upserts the Neo4j (:User) node
      } else {
        setState({ status: 'anonymous', user: null });
      }
    });
  }, [qc]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signInWithEmail: (e, p) => authService.signInWithEmail(e, p),
    signUpWithEmail: (i) => authService.signUpWithEmail(i),        // create → updateProfile(name) → sendEmailVerification → getIdToken(true)
    signInWithGoogle: () => authService.signInWithGoogle(),        // signInWithPopup(GoogleAuthProvider)
    sendPasswordReset: (e) => authService.sendPasswordReset(e),
    resendVerificationEmail: () => authService.resendVerification(),
    updateDisplayName: async (name) => {
      await authService.updateDisplayName(name);                   // updateProfile + getIdToken(true)
      setState((s) => ({ ...s, user: auth.currentUser && toSessionUser(auth.currentUser) }));
      await qc.invalidateQueries({ queryKey: meKeys.profile() });  // backend re-reads the `name` claim
    },
    signOut: async () => {
      await authService.signOut();
      qc.removeQueries({ queryKey: meKeys.all });
      clearPendingIntent();
    },
  }), [state, qc]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

// useAuth.ts
export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
```

`signUpWithEmail` must force a token refresh after `updateProfile`. Otherwise the first `/api/user/profile` call carries a token with no `name` claim, and the backend stores the fallback username.

### Flow sequences

**Cold load / session restore**
1. `status='loading'`. Navbar shows the avatar skeleton; protected routes show `FullPageSplash`. Public pages render and fetch immediately, since they don't need auth.
2. Firebase restores the user from IndexedDB, then `onAuthStateChanged(user)` fires, `status='authenticated'`, and the profile is prefetched.
3. If there is no stored user, `status='anonymous'`. A protected route redirects to `/login?redirect=/watchlist`.

**Sign in / sign up**
1. The form calls `authService.*`. Firebase errors map through `auth-errors.ts`:
   `auth/invalid-credential` → "Email or password is incorrect" · `auth/email-already-in-use` → "An account already exists for this email" · `auth/too-many-requests` → "Too many attempts. Try again in a few minutes." · `auth/network-request-failed` → "Network error" · default → "Something went wrong".
2. On success, `onAuthStateChanged` fires and `GuestOnly` redirects to `safeRedirect(?redirect)`. Forms never navigate themselves, so this happens in one place only.
3. `useConsumePendingIntent()` (mounted in `MainLayout`) runs the stored action once when `status` becomes `authenticated`, then shows a toast: "Added *Dune: Part Two* to your watchlist".

**Pending intent** (`features/auth/pending-intent.ts`)
```ts
interface PendingIntent { type: 'library-add'; list: LibraryList; media: MediaSummary; createdAt: number }
// sessionStorage key 'marquee:intent'. Ignored after 10 min. Cleared on consume or sign-out. Reads and writes wrapped in try/catch.
```

**Authenticated request**: `apiFetch({auth:true})` calls `getIdToken()` (cached, auto-refreshed within 5 minutes of expiry) and sends `Authorization: Bearer <jwt>`. Spring validates the signature (Google JWKS), `iss`, `aud` and `exp`. On a 401 the client retries once with a forced refresh; if that also fails, `onUnauthorized` signs out, `RequireAuth` redirects, and a toast explains why.

**Sign out**: `signOut()` removes all `['me', …]` queries and clears the pending intent. The listener sets `anonymous`. On a protected page `RequireAuth` redirects to login; on a public page the user stays where they are.

**Never do**: store the ID token in `localStorage` or your own state (always call `getIdToken()`), put user data in query strings, or trust `status` alone on the backend.

---

## 9. State management structure

| State | Owner | Location |
|---|---|---|
| Firebase session (`status`, `SessionUser`) | `AuthProvider` context | memory; Firebase persists it |
| Catalog data (trending, popular, details, credits, search) | TanStack Query, `['catalog', …]` | query cache |
| User profile, library | TanStack Query, `['me', …]` | query cache, wiped on logout or uid change |
| Library membership (is X in watchlist?) | Derived with `select` from `['me','library']` | no extra state |
| Search text | URL `?q` (debounced input state local to `SearchBar`) | URL |
| Library tab | URL `?tab` | URL |
| Pending post-login action | `sessionStorage` | browser |
| Mobile nav open, rail scroll position, password visibility | component `useState` | local |

### `useLibraryStatus`
```ts
export function useLibraryStatus(t: MediaType, id: number): { status: LibraryStatus; isLoading: boolean } {
  const { status: auth } = useAuth();
  const q = useQuery({
    ...libraryQuery(),
    enabled: auth === 'authenticated',
    select: (lib) => ({
      watchlist: lib.watchlist.some((i) => i.mediaType === t && i.tmdbId === id),
      watched: lib.watched.some((i) => i.mediaType === t && i.tmdbId === id),
      liked: lib.liked.some((i) => i.mediaType === t && i.tmdbId === id),
    }),
  });
  return { status: q.data ?? { watchlist: false, watched: false, liked: false }, isLoading: q.isLoading };
}
```

### `useLibraryMutation` (optimistic)
```ts
export function useLibraryMutation(list: LibraryList) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ media, action }: { media: MediaSummary; action: 'add' | 'remove' }) =>
      action === 'add' ? libraryApi.add(list, media) : libraryApi.remove(list, media.mediaType, media.id),
    onMutate: async ({ media, action }) => {
      await qc.cancelQueries({ queryKey: meKeys.library() });
      const previous = qc.getQueryData<Library>(meKeys.library());
      qc.setQueryData<Library>(meKeys.library(), (lib) => lib && applyLibraryChange(lib, list, media, action));
      return { previous };
    },
    onError: (_err, { media }, ctx) => {
      if (ctx?.previous) qc.setQueryData(meKeys.library(), ctx.previous);
      toast.error(`Couldn't update ${media.title}. Try again.`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: meKeys.all }), // library + profile stats
  });
}
```
`applyLibraryChange` is pure and unit-tested: add prepends a `LibraryItem` with `addedAt: new Date().toISOString()` and skips duplicates; remove filters on `(mediaType, tmdbId)`.

---

## 10. Design token structure

Two layers: **primitives** (raw values, never used in components) and **semantic tokens** (the only thing components reference). Tailwind utilities are generated from the semantic layer.

Dark is the default and brand theme. Light and System are opt-in from the navbar (Phase 1). Components only use semantic utilities, so the theme switch is a single `data-theme` attribute on `<html>`. The implemented token files are `frontend/src/styles/tokens.css` and `theme.css`; they supersede the snippets below.

### `src/styles/tokens.css`
```css
:root {
  /* ── Primitives ── */
  --ink-1000: #070708;  --ink-950: #0b0b0d;  --ink-900: #111114;  --ink-850: #16161a;
  --ink-800: #1c1c21;   --ink-700: #26262c;  --ink-500: #5b5a60;
  --bone-50: #f4f1ea;   --bone-300: #a8a59d; --bone-400: #85827b;
  --amber-300: #ffd37a; --amber-400: #f5b544; --amber-500: #e09b22; --amber-950: #1c1305;
  --red-400: #f2555a;   --green-400: #4cc38a;

  /* ── Semantic: surfaces ── */
  --canvas: var(--ink-950);            /* page background */
  --canvas-deep: var(--ink-1000);      /* footer, hero scrim end */
  --surface-1: var(--ink-900);         /* cards, inputs */
  --surface-2: var(--ink-850);         /* menus, dialogs */
  --surface-3: var(--ink-800);         /* hover */
  --line: rgb(255 255 255 / 0.08);
  --line-strong: rgb(255 255 255 / 0.16);

  /* ── Semantic: text ── */
  --fg: var(--bone-50);                /* ~17:1 on canvas */
  --fg-muted: var(--bone-300);         /* ~8:1 — body metadata */
  --fg-subtle: var(--bone-400);        /* ~5:1 — captions, never under 12px */

  /* ── Semantic: accent (warm "projector" amber — the only saturated color) ── */
  --accent: var(--amber-400);
  --accent-hover: var(--amber-300);
  --accent-press: var(--amber-500);
  --accent-fg: var(--amber-950);       /* text on amber buttons */
  --danger: var(--red-400);
  --success: var(--green-400);
  --focus-ring: var(--amber-300);

  /* ── Scrims ── */
  --scrim-bottom: linear-gradient(to top, var(--canvas) 0%, rgb(11 11 13 / 0.85) 22%, transparent 60%);
  --scrim-left: linear-gradient(to right, rgb(11 11 13 / 0.92) 0%, rgb(11 11 13 / 0.5) 38%, transparent 70%);

  /* ── Radius ── */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px; --radius-full: 9999px;
  --radius-poster: var(--radius-md);

  /* ── Elevation ── */
  --shadow-card: 0 1px 0 rgb(255 255 255 / 0.04) inset, 0 8px 24px -12px rgb(0 0 0 / 0.6);
  --shadow-pop: 0 24px 48px -16px rgb(0 0 0 / 0.7), 0 0 0 1px var(--line);

  /* ── Motion ── */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-1: 120ms;  /* press, color */
  --dur-2: 200ms;  /* hover lift, focus */
  --dur-3: 320ms;  /* menus, sheets */
  --dur-4: 560ms;  /* image fade-in, hero */

  /* ── Layout ── */
  --container-max: 1440px;
  --gutter: clamp(16px, 4vw, 48px);
  --nav-h: 64px;
  --rail-gap: 12px;
  --z-nav: 40; --z-overlay: 50; --z-toast: 60;
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-1: 0ms; --dur-2: 0ms; --dur-3: 0ms; --dur-4: 0ms; }
}
```

### `src/styles/globals.css`
```css
@import 'tailwindcss';
@import './fonts.css';
@import './tokens.css';

@theme inline {
  --color-canvas: var(--canvas);
  --color-canvas-deep: var(--canvas-deep);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-fg: var(--accent-fg);
  --color-danger: var(--danger);
  --color-success: var(--success);

  --font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Instrument Serif', ui-serif, Georgia, serif;

  /* Type scale: [size, line-height] */
  --text-xs: 0.75rem;   --text-xs--line-height: 1rem;
  --text-sm: 0.875rem;  --text-sm--line-height: 1.25rem;
  --text-base: 1rem;    --text-base--line-height: 1.5rem;
  --text-lg: 1.125rem;  --text-lg--line-height: 1.75rem;
  --text-xl: 1.25rem;   --text-xl--line-height: 1.75rem;
  --text-2xl: 1.5rem;   --text-2xl--line-height: 2rem;
  --text-display-sm: 2.25rem;                    --text-display-sm--line-height: 1.05;
  --text-display-md: clamp(2.5rem, 5vw, 3.5rem); --text-display-md--line-height: 1;
  --text-display-lg: clamp(3rem, 7vw, 5.5rem);   --text-display-lg--line-height: 0.95;

  --radius-sm: var(--radius-sm); --radius-md: var(--radius-md); --radius-lg: var(--radius-lg); --radius-xl: var(--radius-xl);
  --shadow-card: var(--shadow-card); --shadow-pop: var(--shadow-pop);
  --ease-out: var(--ease-out);
  --breakpoint-xs: 480px;  /* plus Tailwind defaults sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536 */
}

@layer base {
  html { color-scheme: dark; background: var(--canvas); }
  body { @apply bg-canvas text-fg font-sans antialiased; font-feature-settings: 'ss01', 'cv11'; }
  :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: var(--radius-sm); }
  ::selection { background: var(--accent); color: var(--accent-fg); }
  .tabular { font-variant-numeric: tabular-nums; }
}
```

### `src/shared/config/design.ts` (the JS-side values, nothing else)
```ts
export const IMAGE_SIZES = {
  poster:   [['w185', 185], ['w342', 342], ['w500', 500], ['w780', 780]],
  backdrop: [['w780', 780], ['w1280', 1280], ['original', 1920]],
  profile:  [['w185', 185], ['h632', 421]],
} as const;
export const POSTER_SIZES_ATTR = '(min-width:1280px) 180px, (min-width:768px) 160px, 40vw';
export const BACKDROP_SIZES_ATTR = '100vw';
```

### Usage rules
- Display font only for hero titles, page titles and the 404. Everything else uses Geist. Display text is never set in all caps.
- Amber is reserved for the primary CTA, rating stars, focus rings and the active nav indicator. It never fills large areas.
- Posters are always 2:3 with `--radius-poster`; backdrops are 16:9 or full-bleed. Card borders are 1px `line`; shadows are only for things that float.
- Spacing uses the Tailwind 4px scale. Section vertical rhythm is `py-10 md:py-14`; rail gap is `--rail-gap`.
- Hover lift is `translate-y-[-4px]` over `--dur-2` with `--ease-out`. Only `transform` and `opacity` are animated.

---

## 11. Step-by-step build order

Each step ends with a **Done when** check. Don't start the next step until it passes.

**Step 0 — Backend unblock (B1–B9)**
Fix B1–B3 first, then B4–B9. Add the `/api/library` endpoints and `/api/public/trending`.
*Done when:* `curl -H "Authorization: Bearer <token from Firebase console / REST signIn>" localhost:8080/api/library` returns `{"watchlist":[],"watched":[],"liked":[]}`, and a browser `fetch` from `localhost:5173` against a protected route passes preflight.

**Step 1 — Scaffold**
Vite template, dependencies, `@/` alias, Vite proxy, ESLint and Prettier, `tokens.css`, `globals.css`, fonts, `env.ts`.
*Done when:* `npm run dev` shows a dark page in Geist; `npm run typecheck && npm run lint` pass; a missing env var fails loudly at boot.

**Step 2 — Primitives**
`cn`, `Button`, `IconButton`, `Input`, `Field`, `Skeleton`, `Spinner`, `Dialog`, `DropdownMenu`, `Tooltip`, `Tabs`, `Avatar`, `Badge`, `EmptyState`, `ErrorState`, `SectionHeader`, `Container`. Add a dev-only `/_ui` route (`import.meta.env.DEV`) that shows every variant.
*Done when:* every primitive is keyboard-operable with a visible focus ring on `/_ui`.

**Step 3 — Shell and routing**
`query-client.ts`, `providers.tsx`, `router.tsx` with every page as a placeholder, `paths.ts`, `RootShell`, `MainLayout`, `AuthLayout`, a static `Navbar` (without the search and user parts), `Footer` with TMDB attribution, `SkipLink`, `NotFoundPage`, `RouteErrorPage`.
*Done when:* every route in §3 renders its placeholder, unknown URLs show the 404, and the network tab shows one lazy chunk per page.

**Step 4 — HTTP layer**
`errors.ts`, `http.ts`, `http.test.ts` (MSW: query building, 204, error body parsing, 401 → refresh retry → `onUnauthorized`).
*Done when:* the tests pass.

**Step 5 — Authentication**
`firebase.ts`, `auth.service.ts`, `auth-errors.ts`, `session-user.ts`, `AuthProvider`, `useAuth`, `RequireAuth`, `GuestOnly`, `safe-redirect.ts`, `FullPageSplash`, `LoginForm`, `SignupForm`, `ResetPasswordForm`, `GoogleButton`, the three auth pages, and `UserMenu` in the navbar. In the Firebase console, enable Email/Password and Google and add `localhost` to authorized domains.
*Done when:* sign up → reload → still signed in → `/profile` placeholder dumps the `/api/user/profile` JSON with the correct display name → sign out → `/profile` redirects to `/login?redirect=%2Fprofile` → sign in returns to `/profile`.

**Step 6 — Catalog data layer**
`tmdb.types.ts`, fixtures copied from real backend responses, `catalog.mappers.ts` with tests, `catalog.api.ts`, `catalog.queries.ts`, the hooks, `tmdb-image.ts`, `format.ts`.
*Done when:* the mapper tests cover movie, tv, person-filtering, empty dates and zero votes.

**Step 7 — Home**
`TmdbImage`, `MediaCard`, `MediaCardSkeleton`, `MediaRail` (`useScrollRail`), `HeroBillboard`, `RatingBadge`, `HomePage`.
*Done when:* Home loads with no layout shift (CLS < 0.05 in Lighthouse), rails scroll by keyboard and by arrows, and killing the backend shows per-rail errors with working retry.

**Step 8 — Browse**
`MediaGrid`, `useInfiniteScroll`, `InfiniteGridFooter`, `BrowsePage` (movies and series).
*Done when:* scrolling loads page 2+ once each, the end state appears, and back navigation restores the scroll position (`ScrollRestoration` plus cached pages).

**Step 9 — Search**
`useDebouncedValue`, `SearchBar` in the navbar (`/` shortcut), `SearchPage`, `SearchEmptyHint`.
*Done when:* typing `dune` updates `?q=dune` without adding history entries, back and forward restore queries, `&`, `#` and accented characters work, and person results never appear.

**Step 10 — Detail pages**
`TitleHero`, `TitleMeta`, `CastRail`, `PersonCard`, `TitleDetailPage`. Add hover and focus prefetch to `MediaCard`.
*Done when:* movie and series pages render. `/movies/abc` and `/movies/0` show "Title not found". A series with a movie-colliding id opens the correct title.

**Step 11 — Library**
`library.types`, `library.api`, `library.queries`, `library.utils` with tests, `useLibrary`, `useLibraryStatus`, `useLibraryMutation`, `pending-intent.ts`, `useConsumePendingIntent`, `WatchlistButton`, `LibraryToggle`, then wire them into `MediaCard`, `HeroBillboard` and `TitleHero`. Build `LibraryTabs`, `LibraryGrid` and `WatchlistPage`, plus the "Continue your watchlist" rail on Home.
*Done when:* the toggle is instant; with the backend stopped it rolls back and shows a toast. Anonymous → click "Watchlist" → login → returns to the same page with the title added. Tabs sync with the URL. Remove → Undo works.

**Step 12 — Profile**
`useProfile`, `ProfileHeader`, `StatTiles`, `DisplayNameForm`, `AccountSection` (verify-email banner for unverified password accounts), `ProfilePage`.
*Done when:* renaming updates the navbar avatar immediately and survives a reload (the Neo4j value changes too).

**Step 13 — Quality pass**
- `useDocumentTitle` on every page.
- Reduced-motion check.
- Keyboard-only walkthrough of every flow.
- axe DevTools reports zero serious issues.
- Lighthouse on Home and Detail: Performance ≥ 90, Accessibility ≥ 95.
- Mobile layout checked at 360px.
- A hero backdrop that fails to load falls back gracefully.

**Step 14 — Tests and CI**
Component tests: `RequireAuth` redirect, `GuestOnly` redirect sanitizing, `WatchlistButton` optimistic rollback (MSW 500), `SearchBar` URL sync. Add a GitHub Actions workflow running `typecheck`, `lint`, `test` and `build`.

**Step 15 — Deploy**
- Frontend on Vercel or Netlify with an SPA rewrite (`/* → /index.html`) and production `VITE_*` env vars.
- Backend container on Render or Fly.io. Neo4j on AuraDB Free.
- Set backend CORS origins to the production domain.
- Add the production domain to Firebase authorized domains.
- Rotate every secret that was ever committed.

---

## 12. `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## 13. Responsive design plan

| Range | Tailwind | Layout decisions |
|---|---|---|
| Mobile < 640px | base, `xs` (480) | Navbar shows logo, search icon and menu button. Nav, theme and sign-in move to a right-hand sheet. Gutter 16px. Poster grid `minmax(9rem,1fr)`, about 2 columns. Rails use native touch scroll with no arrows. Hero is 70vh with a 3-line overview. Auth card is full width. |
| Tablet 640–1023px | `sm`, `md` | "Sign in" appears in the navbar from `sm`. Desktop nav and theme menu appear from `md` (768). Grid gets 4–5 columns. Detail page stacks poster above the metadata. Footer switches to a row at `md`. |
| Desktop ≥ 1024px | `lg`, `xl`, `2xl` | Container max 1440px (`--container-max`), gutter up to 48px. Rails show hover arrows. Detail page places the poster beside the metadata. Grid `minmax(10rem,1fr)`, 6–8 columns. |

Rules: design at 360px first. Minimum touch target is 40px (`size-10`). No horizontal page scroll at any width. Use `min-h-dvh`, not `100vh` (mobile browser chrome). Respect the safe-area inset at the bottom of the mobile sheet.

## 14. Definition of Done (applies to every phase)

A phase is done only when all of the following hold:

1. `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` and `npm run build` all pass.
2. Every new screen has loading, empty, error and (where relevant) unauthorized states, and each has been seen in the browser.
3. Checked at 375px, 768px and 1280px in both themes, with no horizontal scroll and no layout shift when data arrives.
4. Keyboard-only walkthrough: every control is reachable, the focus ring is visible, Esc closes overlays, and focus moves to `<main>` on navigation.
5. No console errors or warnings in the browser.
6. No fake data outside `/_ui` (dev-only) and clearly marked `PagePlaceholder` screens.
7. Behavior that depends on the backend is tested against MSW handlers that match the contract in §0. The frontend never assumes an endpoint the contract doesn't define.
8. The spec is updated wherever the implementation deviated from it.

## 15. Phase 1 (foundation): as built

Differences from the sections above, all intentional:

- **App chrome lives in `src/app/shell/`** (`Navbar`, `MobileNav`, `Footer`, `ThemeMenu`, `ThemeSegmentedControl`, `SkipLink`, `NavigationProgress`, `nav-items.ts`, `useFocusMainOnNavigate`), not in `shared/components`. Chrome will later use features such as the auth `UserMenu`, and `shared` must never import features.
- **`paths.ts` is in `src/shared/config/`**, not `src/app/`, so features and pages can build URLs without importing upward.
- **Routes are a factory, `createRoutes()`** in `src/app/routes.tsx`. React Router mutates `route.lazy` objects after resolving them, so sharing one route tree between routers (tests, HMR) breaks the second router.
- **Theme store**: `src/shared/theme/`. The inline script in `index.html` applies the saved theme before first paint.
- **`/watchlist` and `/profile` are not guarded yet.** `RequireAuth`/`GuestOnly` are added in the auth phase (marked `AUTH PHASE` in `routes.tsx`).
- Unbuilt screens render `PagePlaceholder` ("Not built yet"). `/_ui` is a dev-only page showing every primitive.
- TanStack Query, the API client and Firebase aren't installed yet. Each is added in the phase that first uses it.

## 16. API foundation: as built

- **Added:** `axios`, `@tanstack/react-query` and dev `msw`.
- **Files:**
  - `shared/config/env.ts`: validates `VITE_API_BASE_URL`, which may be empty (dev proxy) or an absolute http(s) URL without a trailing slash, query or fragment.
  - `shared/api/{api-error,normalize-error,http-client}.ts`
  - `app/{query-client.ts,providers.tsx}`
  - `shared/hooks/useOnlineStatus.ts`: reads TanStack's `onlineManager`, so the UI and query pausing share one source of truth.
  - `app/shell/OfflineBanner.tsx`: rendered once in `RootShell`, so both layouts get it.
- **Tests:** MSW runs in Node with `onUnhandledRequest: 'error'`. Default handlers only include verified endpoints (`GET /api/public/health`).
- **Known test-environment limit:** MSW's `XMLHttpRequest` mock never fires `ontimeout`, so the timeout test uses Axios's `fetch` adapter. Browsers use XHR, which fires timeouts natively.
- **Not wired yet:** the access-token provider and the unauthorized handler. They're registered by the auth feature once the identity provider (Firebase or FusionAuth) is decided.

## 17. Catalog reads (Phase 2): as built

**Scope:** Home, Browse (`/movies`, `/series`), Search and title details on the **existing** public endpoints, unchanged. That means raw TMDB JSON, `fr-FR` content, page 1 only, and no trending endpoint.

**Live backend facts (observed 2026-09-27, backend running without Neo4j, which public endpoints don't need):**
- **B10, new: every failure on a public endpoint returns `401` with an empty body.** Example: `GET /api/public/movies/999999999`. The TMDB 404 becomes an exception, Spring forwards it to `/error`, and `SecurityConfig` doesn't permit `/error`, so the client sees 401. The frontend (`catalog.api.ts#getPublic`) reports a 401 from a public endpoint as `kind: 'server'`, so users are never asked to sign in on public pages. **Backend fix:** `permitAll("/error")` plus proper 404 mapping (B8).
- `?page=` is ignored (page 2 is identical to page 1), so there's no pagination UI.
- Search with `&` returns 200, but TMDB receives the query truncated at the `&` (`tom & jerry` gives ~10,000 results for "tom"). The frontend encodes correctly; the fix is backend B7.
- Translated fields are French; `overview` is `''` when there's no French translation. The UI shows "No synopsis available." and marks TMDB text with `lang="fr"` (`TMDB_CONTENT_LANG`).

**Structure:**
- `features/catalog/`: `api/{tmdb.types,catalog.mappers,catalog.api,catalog.queries}.ts`, `catalog.hooks.ts`, `catalog.types.ts`, `lib/tmdb-image.ts`, `components/{TmdbImage,MediaCard,MediaRail,MediaGrid,HeroBillboard,Backdrop,TitleHeader,CastList,Rating,OfflineNotice,query-state}`.
- Shared additions: `shared/hooks/{useDebouncedValue,useScrollRail}.ts`, `shared/lib/format.ts`, `shared/api/tanstack-query.d.ts` (`Register.defaultError = ApiError`; the catalog API guarantees only `ApiError` is thrown, including for mapping failures).

**Decisions:**
- Images load directly from `image.tmdb.org` with `srcset`/`sizes`. Only the hero and detail backdrop/poster use `priority`; everything else is lazy.
- Backdrops fade into the page with CSS masks, plus a scrim in the canvas color behind overlapping text, so text contrast holds in both themes.
- Search: `?q` is the source of truth. The input is debounced by 300 ms and replaces the URL entry. At least 2 characters are required, people are excluded, and the match count is announced through `role="status"`.
- Details and credits load independently; a credits failure only affects the cast section.
- Hovering or focusing a card prefetches its details.
- **Offline:** a query that's paused with no cache shows `OfflineNotice` instead of an endless skeleton.
- **Horizontal scrollers must be `position: relative`.** Otherwise absolutely positioned descendants such as `sr-only` text escape the clip and widen the page (found on 375px phones).

**Tests:** fixtures in `src/test/fixtures/` are trimmed real responses from this backend. Default MSW handlers serve them and reproduce the masked 401 for unknown ids.

## 18. Trailers and where to watch: as built

**Backend (first backend change, additive only):** `TmdbService` and `MovieController` gain four public endpoints, following the existing passthrough style:
- `GET /api/public/{movies|series}/{id}/videos`: TMDB videos with `language=fr-FR&include_video_language=fr,en,null`.
- `GET /api/public/{movies|series}/{id}/watch-providers`: TMDB watch providers for all countries (data by JustWatch).

**Frontend:**
- `pickTrailer` chooses trailers before teasers, French before English, official first, then newest. `TrailerButton` plays it in a dialog via `youtube-nocookie.com` with `cc_load_policy=1&cc_lang_pref=fr`, so captions are on in French when available. There's no button when no trailer exists.
- `WhereToWatch` offers a country picker limited to countries with offers. Default order: saved choice, then MA, FR, US. The choice is stored in `localStorage` (`marquee:watch-region`). Groups: Stream / Free (free + ads) / Rent / Buy. Provider logos link to TMDB's watch page, with the JustWatch attribution.
- **Observed:** TMDB/JustWatch lists no Moroccan offers for the sampled titles, so the UI says "No offers listed for Morocco. Showing France."

**Out of scope by decision:** torrent or unlicensed stream sources (e.g. Torrentio). The app links only to legal providers.
