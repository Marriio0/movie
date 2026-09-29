import { useCallback, useEffect, useState } from 'react';

export const ACTIVATION_STORAGE_KEY = 'netfarjo:cinema-unlocked';
export const VALID_CODES = ['netfarjo01'];

// Custom event to notify other components across the app on unlock/lock
const ACTIVATION_CHANGE_EVENT = 'netfarjo:activation-change';

export function isCinemaUnlocked(): boolean {
  try {
    return localStorage.getItem(ACTIVATION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setCinemaUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      localStorage.setItem(ACTIVATION_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(ACTIVATION_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(ACTIVATION_CHANGE_EVENT, { detail: unlocked }));
  } catch {
    // Ignore storage errors
  }
}

export function validateActivationCode(code: string): boolean {
  if (!code) return false;
  const normalized = code.trim().toLowerCase();
  return VALID_CODES.includes(normalized);
}

export function useActivation() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isCinemaUnlocked());

  useEffect(() => {
    const handleUpdate = () => {
      setIsUnlocked(isCinemaUnlocked());
    };

    window.addEventListener(ACTIVATION_CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(ACTIVATION_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const unlock = useCallback((code: string): { success: boolean; error?: string } => {
    if (!code || !code.trim()) {
      return { success: false, error: 'Please enter an activation code' };
    }

    if (validateActivationCode(code)) {
      setCinemaUnlocked(true);
      setIsUnlocked(true);
      return { success: true };
    }

    return { success: false, error: 'Invalid activation code. Try again.' };
  }, []);

  const lock = useCallback(() => {
    setCinemaUnlocked(false);
    setIsUnlocked(false);
  }, []);

  return {
    isUnlocked,
    unlock,
    lock,
  };
}
