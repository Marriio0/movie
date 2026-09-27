/** jsdom has no matchMedia. This stub answers prefers-color-scheme queries only. */
export function mockColorScheme(scheme: 'light' | 'dark'): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: query.includes(`prefers-color-scheme: ${scheme}`),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
