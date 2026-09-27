import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createQueryClient } from '@/app/query-client';
import { createRoutes } from '@/app/routes';

/** App defaults, minus retries (so error states appear immediately) and GC timers. */
export function createTestQueryClient(): QueryClient {
  const client = createQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, retry: false, gcTime: Infinity },
  });
  return client;
}

/** Renders the real route tree at `path` with a fresh query cache. */
export function renderRoute(path: string, queryClient: QueryClient = createTestQueryClient()) {
  const router = createMemoryRouter(createRoutes(), { initialEntries: [path] });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...utils, router, user, queryClient };
}
