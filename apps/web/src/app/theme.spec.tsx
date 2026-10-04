import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { Input } from '@study-platform/ui/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@study-platform/ui/components/ui/dialog';
import { initializeTheme, setTheme, THEME_STORAGE_KEY } from './theme.js';
import { App } from './App.js';

beforeEach(() => {
  // Node 25 exposes a storage placeholder; provide the browser Storage surface.
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => values.clear(),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  cleanup();
  document.documentElement.classList.remove('dark');
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

function preference(initial: boolean) {
  const media = new EventTarget();
  const query = Object.assign(media, { matches: initial });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  );
  return (dark: boolean) => {
    query.matches = dark;
    query.dispatchEvent(new Event('change'));
  };
}

function EditingDialog() {
  const [value, setValue] = useState('');
  return (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Editar tarefa</DialogTitle>
        <DialogDescription>Preencha o título.</DialogDescription>
        <Input
          aria-label="Título"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </DialogContent>
    </Dialog>
  );
}

describe('system theme', () => {
  it.each([false, true])('applies initial dark preference %s', (dark) => {
    preference(dark);
    const stop = initializeTheme();
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-color-scheme: dark)',
    );
    expect(document.documentElement.classList.contains('dark')).toBe(dark);
    stop();
  });

  it('updates both ways without losing an open portal, edited value, focus or route', async () => {
    const change = preference(false);
    const stop = initializeTheme();
    window.history.replaceState({}, '', '/app/tarefas');
    const { container } = render(<EditingDialog />);
    const input = screen.getByRole('textbox', { name: 'Título' });
    await userEvent.setup().type(input, 'Estudar álgebra');
    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);

    for (const dark of [true, false]) {
      change(dark);
      expect(document.documentElement.classList.contains('dark')).toBe(dark);
      expect(screen.getByRole('dialog')).toBe(dialog);
      expect((input as HTMLInputElement).value).toBe('Estudar álgebra');
      expect(document.activeElement).toBe(input);
      expect(window.location.pathname).toBe('/app/tarefas');
    }
    stop();
    change(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('falls back to light when matchMedia is unavailable', () => {
    document.documentElement.classList.add('dark');
    vi.stubGlobal('matchMedia', undefined);
    expect(initializeTheme()).toBeTypeOf('function');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Organize seus estudos.',
    );
  });
});

describe('manual theme choice', () => {
  it('persists the manual choice and ignores OS changes until storage removal', () => {
    const change = preference(false);
    const stop = initializeTheme();
    setTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    change(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'light',
      }),
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    window.dispatchEvent(
      new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: null }),
    );
    change(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    stop();
  });

  it.each(['light', 'dark', 'invalid'])(
    'validates saved choice %s and synchronizes native controls',
    (saved) => {
      localStorage.setItem(THEME_STORAGE_KEY, saved);
      preference(true);
      const stop = initializeTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(
        saved !== 'light',
      );
      expect(document.documentElement.style.colorScheme).toBe(
        saved === 'light' ? 'light' : 'dark',
      );
      stop();
    },
  );

  it('keeps an in-memory choice when storage throws and falls back after a new initialization', () => {
    const change = preference(false);
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const stop = initializeTheme();
    setTheme('dark');
    window.history.replaceState({}, '', '/acesso');
    change(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    stop();
    const stopAgain = initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    stopAgain();
  });

  it('allows keyboard toggle while preserving the existing page state', async () => {
    preference(false);
    const stop = initializeTheme();
    render(<App />);
    const toggle = screen.getByRole('button', { name: /Tema claro ativo/ });
    toggle.focus();
    await userEvent.setup().keyboard('{Enter}');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(toggle);
    expect(window.location.pathname).toBe('/');
    stop();
  });
});
