import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { Input } from '@study-platform/ui/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@study-platform/ui/components/ui/dialog';
import { initializeTheme } from './theme.js';
import { App } from './App.js';

afterEach(() => {
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
      'Seu plano de estudos',
    );
  });
});
