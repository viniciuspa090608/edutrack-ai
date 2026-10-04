import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  window.history.replaceState({}, '', '/status');
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
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

describe('public routes', () => {
  it('shows the complete public landing without checking the API', () => {
    window.history.replaceState({}, '', '/');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Organize seus estudos.',
    );
    for (const name of [
      'Como funciona',
      'Organize',
      'Estude',
      'Revise',
      'Planejamento e roadmaps por etapas',
      'Sessões de foco com Pomodoro',
      'Flashcards com revisão espaçada',
      'Métricas claras e sequências de estudo',
      'Um apoio extra quando você precisar.',
      'Seu espaço, seu jeito de estudar.',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeTruthy();
    }
    const previews = document.querySelectorAll('figure');
    expect(previews).toHaveLength(6);
    for (const preview of previews) {
      expect(preview.querySelector('figcaption')?.textContent).toContain(
        'dados demonstrativos',
      );
      expect(preview.querySelector('button, a, input, [tabindex]')).toBeNull();
    }
    expect(screen.queryByText(/Recursos em desenvolvimento/)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens the requested mode for every access CTA destination', () => {
    window.history.replaceState({}, '', '/');
    const { unmount } = render(<App />);
    const destinations = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter((href): href is string => !!href?.startsWith('/acesso'));
    expect(destinations.length).toBeGreaterThanOrEqual(5);
    expect(new Set(destinations)).toEqual(
      new Set(['/acesso?mode=login', '/acesso?mode=register']),
    );
    unmount();
    for (const destination of destinations) {
      window.history.replaceState({}, '', destination);
      const view = render(<App />);
      expect(
        screen.getByRole('heading', {
          name: destination.includes('register')
            ? 'Crie sua conta'
            : 'Entre na sua conta',
        }),
      ).toBeTruthy();
      expect(screen.getByRole('textbox', { name: 'E-mail' })).toBeTruthy();
      expect(screen.getByLabelText('Senha')).toBeTruthy();
      expect(
        screen.getByRole('link', { name: 'Continuar com Google' }),
      ).toBeTruthy();
      expect(
        screen
          .getByRole('link', { name: /Voltar à landing/ })
          .getAttribute('href'),
      ).toBe('/');
      view.unmount();
    }
  });
  it('shows a fallback for unknown paths', () => {
    window.history.replaceState({}, '', '/desconhecido');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeTruthy();
  });

  it('closes the mobile menu with Escape and restores focus', async () => {
    window.history.replaceState({}, '', '/');
    render(<App />);
    const user = userEvent.setup();
    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const nav = document.getElementById('mobile-navigation')!;
    expect(nav.querySelector('a[href="#funcionalidades"]')).toBeTruthy();
    nav.querySelector('a')?.focus();
    await user.keyboard('{Escape}');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
    await user.click(toggle);
    await user.click(
      screen.getAllByRole('link', { name: 'Funcionalidades' }).at(-1)!,
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
