import type { RouteObject } from 'react-router';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { FullPageSplash } from '@/shared/components/FullPageSplash';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { RootShell } from './layouts/RootShell';

/*
 * Route tree. Layouts load eagerly; every page is a lazy chunk.
 *
 * This is a factory, not a shared constant: React Router clears entries of a route's `lazy`
 * object once they resolve (`route.lazy[key] = undefined`). Sharing one object tree between
 * routers (tests, HMR) would leave later routers with half-resolved routes.
 * Pathless routes with an ErrorBoundary sit inside each layout, so a failing page keeps its
 * navbar and footer. The root ErrorBoundary only catches failures in the layouts themselves.
 */

const devRoutes = (): RouteObject[] =>
  import.meta.env.DEV
    ? [
        {
          path: '_ui',
          lazy: { Component: () => import('@/pages/UiKitPage').then((m) => m.UiKitPage) },
        },
      ]
    : [];

export const createRoutes = (): RouteObject[] => [
  {
    Component: RootShell,
    HydrateFallback: FullPageSplash,
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        Component: MainLayout,
        children: [
          {
            ErrorBoundary: RouteErrorPage,
            children: [
              {
                index: true,
                lazy: { Component: () => import('@/pages/HomePage').then((m) => m.HomePage) },
              },
              {
                path: 'movies',
                lazy: {
                  Component: () => import('@/pages/BrowsePage').then((m) => m.MoviesBrowsePage),
                },
              },
              {
                path: 'series',
                lazy: {
                  Component: () => import('@/pages/BrowsePage').then((m) => m.SeriesBrowsePage),
                },
              },
              {
                path: 'arabic',
                lazy: {
                  Component: () =>
                    import('@/pages/ArabicBrowsePage').then((m) => m.ArabicBrowsePage),
                },
              },
              {
                path: 'movies/:id',
                lazy: {
                  Component: () => import('@/pages/TitleDetailPage').then((m) => m.MovieDetailPage),
                },
              },
              {
                path: 'series/:id',
                lazy: {
                  Component: () =>
                    import('@/pages/TitleDetailPage').then((m) => m.SeriesDetailPage),
                },
              },
              {
                path: 'search',
                lazy: { Component: () => import('@/pages/SearchPage').then((m) => m.SearchPage) },
              },
              // AUTH PHASE: wrap these two in a <RequireAuth /> layout route once Firebase auth exists.
              {
                path: 'watchlist',
                lazy: {
                  Component: () => import('@/pages/WatchlistPage').then((m) => m.WatchlistPage),
                },
              },
              {
                path: 'profile',
                lazy: { Component: () => import('@/pages/ProfilePage').then((m) => m.ProfilePage) },
              },
              ...devRoutes(),
              {
                path: '*',
                lazy: {
                  Component: () => import('@/pages/NotFoundPage').then((m) => m.NotFoundPage),
                },
              },
            ],
          },
        ],
      },
      {
        // AUTH PHASE: login and signup get a <GuestOnly /> wrapper; reset-password stays open to all.
        Component: AuthLayout,
        children: [
          {
            ErrorBoundary: RouteErrorPage,
            children: [
              {
                path: 'login',
                lazy: { Component: () => import('@/pages/LoginPage').then((m) => m.LoginPage) },
              },
              {
                path: 'signup',
                lazy: { Component: () => import('@/pages/SignupPage').then((m) => m.SignupPage) },
              },
              {
                path: 'reset-password',
                lazy: {
                  Component: () =>
                    import('@/pages/ResetPasswordPage').then((m) => m.ResetPasswordPage),
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
