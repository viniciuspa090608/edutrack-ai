import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('technical page', () => {
  it('shows the loading state while checking the API', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveProperty(
      'textContent',
      'A base para estudar com clareza.',
    );
    expect(screen.getByText('Verificando API')).toBeTruthy();
  });

  it('accepts a valid health response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ status: 'ok' }) })),
    );
    render(<App />);

    expect(await screen.findByText('API disponível')).toBeTruthy();
  });

  it('shows an error for an invalid response and retries by keyboard', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unexpected' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    const retry = await screen.findByRole('button', {
      name: 'Tentar novamente',
    });
    const user = userEvent.setup();
    await user.tab();
    expect(document.activeElement).toBe(retry);
    await user.keyboard('{Enter}');

    expect(await screen.findByText('API disponível')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
