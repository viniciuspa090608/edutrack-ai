import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'edutrack.theme';
const listeners = new Set<() => void>();
let manual: Theme | null = null;
let system: MediaQueryList | undefined;

function validTheme(value: string | null): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

function applyTheme() {
  const dark = manual === 'dark' || (manual === null && !!system?.matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  for (const listener of listeners) listener();
}

export function setTheme(theme: Theme): void {
  manual = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the choice in memory when browser storage is unavailable.
  }
  applyTheme();
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    () => 'light',
  );
}

/** Adopt the head bootstrap, then follow preferences without remounting React. */
export function initializeTheme(): () => void {
  manual = null;
  try {
    manual = validTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // System preference is the fallback for a blocked storage read.
  }
  system =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : undefined;
  const preference = system;
  const onSystem = () => applyTheme();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea && event.storageArea !== window.localStorage)
        return;
    } catch {
      return;
    }
    manual = validTheme(event.newValue);
    applyTheme();
  };
  applyTheme();
  preference?.addEventListener('change', onSystem);
  window.addEventListener('storage', onStorage);
  return () => {
    preference?.removeEventListener('change', onSystem);
    window.removeEventListener('storage', onStorage);
  };
}
