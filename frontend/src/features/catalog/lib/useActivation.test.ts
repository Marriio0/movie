import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import {
  useActivation,
  isCinemaUnlocked,
  setCinemaUnlocked,
  validateActivationCode,
  ACTIVATION_STORAGE_KEY,
} from './useActivation';

describe('useActivation - Web Platform', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
  });

  it('is always unlocked on the web without needing any code', () => {
    expect(isCinemaUnlocked()).toBe(true);
    const { result } = renderHook(() => useActivation());
    expect(result.current.isUnlocked).toBe(true);
    expect(result.current.isNative).toBe(false);
  });
});

describe('useActivation - Native App Platform (Google Play Mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
  });

  it('defaults to locked when storage is empty on native app', () => {
    expect(isCinemaUnlocked()).toBe(false);
    const { result } = renderHook(() => useActivation());
    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.isNative).toBe(true);
  });

  it('validates netfarjo01 case-insensitively and with trimmed whitespace', () => {
    expect(validateActivationCode('netfarjo01')).toBe(true);
    expect(validateActivationCode('NETFARJO01')).toBe(true);
    expect(validateActivationCode('  NetFarjo01  ')).toBe(true);
    expect(validateActivationCode('invalid123')).toBe(false);
    expect(validateActivationCode('')).toBe(false);
  });

  it('unlocks cinema streaming with netfarjo01 on native app', () => {
    const { result } = renderHook(() => useActivation());

    act(() => {
      const res = result.current.unlock('netfarjo01');
      expect(res.success).toBe(true);
    });

    expect(result.current.isUnlocked).toBe(true);
    expect(isCinemaUnlocked()).toBe(true);
    expect(localStorage.getItem(ACTIVATION_STORAGE_KEY)).toBe('true');
  });

  it('rejects invalid activation code without unlocking on native app', () => {
    const { result } = renderHook(() => useActivation());

    act(() => {
      const res = result.current.unlock('wrong_code');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    expect(result.current.isUnlocked).toBe(false);
    expect(isCinemaUnlocked()).toBe(false);
  });

  it('locks cinema streaming and removes storage key on native app', () => {
    setCinemaUnlocked(true);
    const { result } = renderHook(() => useActivation());
    expect(result.current.isUnlocked).toBe(true);

    act(() => {
      result.current.lock();
    });

    expect(result.current.isUnlocked).toBe(false);
    expect(isCinemaUnlocked()).toBe(false);
  });
});
