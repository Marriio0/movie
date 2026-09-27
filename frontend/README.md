# Marquee — frontend

React + Vite + TypeScript client for the Spring Boot movie backend. The full plan is in
[`../docs/FRONTEND_SPEC.md`](../docs/FRONTEND_SPEC.md).

## Requirements

- Node.js ≥ 22.22 (React Router 8 requirement)
- npm

## Environment

Copy `.env.example` to `.env.local` to override values locally. Only `VITE_*` variables reach
the browser, so never put secrets in them.

| Variable            | Default | Meaning                                                                                                                                             |
| ------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | empty   | Spring Boot API origin, e.g. `https://api.example.com` (no trailing slash). Empty means same-origin `/api`, which the dev server proxies to `:8080` |

An invalid value stops the app at startup with an explanatory error.

## Scripts

| Command                           | What it does                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `npm install`                     | Install dependencies                                                               |
| `npm run dev`                     | Dev server on http://localhost:5173 (`/api` is proxied to `http://localhost:8080`) |
| `npm run build`                   | Type-check, then production build into `dist/`                                     |
| `npm run preview`                 | Serve the production build locally                                                 |
| `npm run typecheck`               | TypeScript only                                                                    |
| `npm run lint`                    | ESLint, including the layer import rules                                           |
| `npm run format` / `format:check` | Prettier, with Tailwind class sorting                                              |
| `npm test` / `test:watch`         | Vitest + Testing Library                                                           |

In development, http://localhost:5173/_ui shows every UI primitive and state in both themes.
This route is not included in production builds.

## Structure

```
src/
  app/        router, layouts, app chrome (navbar, footer, mobile nav)
  pages/      one lazy-loaded module per route
  features/   domain features (auth, catalog, library, profile); added from Phase 2
  shared/     primitives and utilities with no domain knowledge
    api/        Axios httpClient, ApiError, error normalization
    ui/         Button, IconButton, Skeleton, Spinner, Empty/Error/Loading states…
    components/ Logo, NotFoundView, FullPageSplash, PagePlaceholder
    config/     app constants, typed path builders
    theme/      theme store (dark · light · system)
    hooks/ lib/ types/
  styles/     tokens.css (runtime tokens), theme.css (Tailwind mapping), globals.css
```

Imports only go downward (`app → pages → features → shared`). ESLint enforces this.
