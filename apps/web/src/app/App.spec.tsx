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
  it('shows the landing without checking the API', () => {
    window.history.replaceState({}, '', '/');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Seu plano de estudos',
    );
    expect(
      screen.getByRole('heading', { name: 'Tudo para estudar com intenção.' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Uma base feita para evoluir.' }),
    ).toBeTruthy();
    for (const name of [
      'Tarefas',
      'Matérias e roadmaps',
      'Pomodoro',
      'Rotinas',
      'Flashcards',
      'Estatísticas',
      'IA opcional',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeTruthy();
    }
    expect(screen.getByText(/Recursos em desenvolvimento/)).toBeTruthy();
    expect(
      screen.getAllByRole('link', { name: /Login \/ Inscreva-se/ }).length,
    ).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the access page for every access CTA destination', () => {
    window.history.replaceState({}, '', '/');
    const { unmount } = render(<App />);
    const links = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/acesso');
    expect(links.length).toBeGreaterThanOrEqual(3);
    unmount();
    window.history.replaceState({}, '', '/acesso');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Em breve' })).toBeTruthy();
    expect(
      screen.getByText(/login e o cadastro ainda não estão disponíveis/),
    ).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen
        .getByRole('link', { name: /Voltar à landing/ })
        .getAttribute('href'),
    ).toBe('/');
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
