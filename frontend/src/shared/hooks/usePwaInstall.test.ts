import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePwaInstall } from './usePwaInstall';

describe('usePwaInstall', () => {
  it('initializes with default uninstalled state', () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isInstallable).toBe(false);
  });

  it('detects installable state when beforeinstallprompt event fires', () => {
    const { result } = renderHook(() => usePwaInstall());

    const mockEvent = new Event('beforeinstallprompt');
    Object.assign(mockEvent, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(result.current.isInstallable).toBe(true);
  });
});
