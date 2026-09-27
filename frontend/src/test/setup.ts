import '@testing-library/jest-dom/vitest';
import { onlineManager } from '@tanstack/react-query';
import { cleanup, configure } from '@testing-library/react';
import { mockColorScheme } from './match-media';
import { server } from './msw/server';

mockColorScheme('dark');

// Route pages are lazy chunks. A cold first import in the test runner can take over a second,
// longer than the 1s default wait.
configure({ asyncUtilTimeout: 3000 });

// jsdom does not implement scrolling; <ScrollRestoration> calls it on navigation.
window.scrollTo = () => {};

// jsdom has no ResizeObserver (used by media rails). This stub never reports sizes.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom has no IntersectionObserver (used by infinite scroll).
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

// Any request without a matching handler fails the test, so no test relies on an undefined API.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  onlineManager.setOnline(true);
});

afterAll(() => server.close());
