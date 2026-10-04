import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { initializeTheme, THEME_STORAGE_KEY } from './theme.js';

const bootstrap = readFileSync('index.html', 'utf8').match(
  /<script>([\s\S]*?)<\/script>/,
)![1]!;
afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('dark');
  document.documentElement.style.removeProperty('color-scheme');
});

it.each(
  ['light', 'dark', 'invalid', null, 'blocked'].flatMap((saved) =>
    [false, true].map((systemDark) => ({ saved, systemDark })),
  ),
)(
  'keeps bootstrap and runtime equivalent for $saved with OS dark=$systemDark',
  ({ saved, systemDark }) => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => {
        expect(key).toBe(THEME_STORAGE_KEY);
        if (saved === 'blocked') throw new Error('blocked');
        return saved;
      },
    });
    vi.stubGlobal('matchMedia', () => ({
      matches: systemDark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    new Function(bootstrap)();
    const firstTheme = document.documentElement.classList.contains('dark');
    const expected =
      saved === 'dark' || (saved !== 'light' && saved !== 'dark' && systemDark);
    expect(firstTheme).toBe(expected);
    const stop = initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(
      firstTheme,
    );
    expect(document.documentElement.style.colorScheme).toBe(
      expected ? 'dark' : 'light',
    );
    stop();
  },
);
