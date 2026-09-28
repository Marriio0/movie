import { mockColorScheme } from '@/test/match-media';

async function loadStore() {
  vi.resetModules();
  return import('./theme-store');
}

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    mockColorScheme('dark');
  });

  it('defaults to system theme following device/time', async () => {
    mockColorScheme('dark');
    const { themeStore } = await loadStore();
    expect(themeStore.getSnapshot()).toEqual({ preference: 'system', resolved: 'dark' });
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignores an invalid stored value', async () => {
    localStorage.setItem('marquee:theme', 'sepia');
    const { themeStore } = await loadStore();
    expect(themeStore.getSnapshot().preference).toBe('system');
  });

  it('persists and applies an explicit preference', async () => {
    const { themeStore, THEME_STORAGE_KEY } = await loadStore();
    const listener = vi.fn();
    const unsubscribe = themeStore.subscribe(listener);

    themeStore.setPreference('light');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('resolves "system" from the OS color scheme', async () => {
    mockColorScheme('light');
    localStorage.setItem('marquee:theme', 'system');
    const { themeStore } = await loadStore();
    expect(themeStore.getSnapshot()).toEqual({ preference: 'system', resolved: 'light' });
  });

  it('does not notify when nothing changes', async () => {
    const { themeStore } = await loadStore();
    const listener = vi.fn();
    const unsubscribe = themeStore.subscribe(listener);
    themeStore.setPreference('system');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
