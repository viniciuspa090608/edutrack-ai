import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App.js';

const user = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'student@example.com',
  googleLinked: false,
};
const success = { ok: true, status: 200, json: async () => ({ user }) };
const denied = {
  ok: false,
  status: 401,
  json: async () => ({ error: { code: 'UNAUTHENTICATED' } }),
};
const profile = {
  ...user,
  displayName: 'Estudante',
  emailVerified: true,
  localPassword: true,
  avatarVersion: null,
};
const preferences = {
  tasks: true,
  subjects: true,
  flashcards: true,
  ai: false,
};
function privateFetch(url: string) {
  if (url.endsWith('/account/study-timezone'))
    return {
      ok: true,
      status: 200,
      json: async () => ({
        timeZone: 'UTC',
        trackingStartedAt: '2026-09-27T12:00:00.000Z',
      }),
    };
  if (url.endsWith('/profile/preferences'))
    return { ok: true, status: 200, json: async () => preferences };
  if (url.endsWith('/profile'))
    return { ok: true, status: 200, json: async () => profile };
  if (url.endsWith('/auth/logout')) return { ok: true, status: 204 };
  return success;
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  window.history.replaceState({}, '', '/acesso');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

describe('account access', () => {
  it('keeps form controls labelled and reachable with the keyboard', async () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<App />);
    const interaction = userEvent.setup();
    await interaction.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'Entrar' }),
    );
    await interaction.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'Criar conta' }),
    );
    await interaction.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: 'E-mail' }),
    );
    await interaction.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Senha'));
  });

  it('switches to registration and opens the email confirmation flow', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ pendingVerification: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    const interaction = userEvent.setup();
    await interaction.click(screen.getByRole('tab', { name: 'Criar conta' }));
    expect(
      screen.getByRole('heading', { name: 'Crie sua conta' }),
    ).toBeTruthy();
    await interaction.type(
      screen.getByRole('textbox', { name: 'E-mail' }),
      user.email,
    );
    await interaction.type(
      screen.getByLabelText('Senha'),
      'correct-horse-battery',
    );
    await interaction.click(
      screen.getAllByRole('button', { name: 'Criar conta' }).at(-1)!,
    );
    expect(
      await screen.findByRole('heading', { name: 'Confirme seu e-mail' }),
    ).toBeTruthy();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3001/auth/register',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'include',
      method: 'POST',
    });
    expect(window.location.pathname).toBe('/confirmar-email');
  });

  it('rejects external returnTo and displays a recoverable network error', async () => {
    window.history.replaceState(
      {},
      '',
      '/acesso?returnTo=https://outside.example',
    );
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Rede indisponível'))
      .mockResolvedValueOnce(success)
      .mockResolvedValueOnce(success);
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByRole('textbox', { name: 'E-mail' }),
      user.email,
    );
    await interaction.type(
      screen.getByLabelText('Senha'),
      'correct-horse-battery',
    );
    await interaction.click(
      screen.getAllByRole('button', { name: 'Entrar' }).at(-1)!,
    );
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Rede indisponível',
    );
    await interaction.click(
      screen.getAllByRole('button', { name: 'Entrar' }).at(-1)!,
    );
    await waitFor(() => expect(window.location.pathname).toBe('/app'));
  });

  it('never displays private account content before the session check', async () => {
    window.history.replaceState({}, '', '/conta');
    let resolve!: (value: typeof denied) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      ),
    );
    render(<App />);
    expect(screen.getByRole('status').textContent).toContain(
      'Verificando sessão',
    );
    expect(screen.queryByText(user.email)).toBeNull();
    resolve(denied);
    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeTruthy();
    expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(
      '/conta',
    );
  });

  it('lets an authenticated user leave and hides account data', async () => {
    window.history.replaceState({}, '', '/conta');
    const fetchMock = vi.fn(async (url: string) => privateFetch(url));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Conta' })).toBeTruthy();
    expect(screen.getByText(user.email)).toBeTruthy();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }));
    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeTruthy();
    expect(screen.queryByText(user.email)).toBeNull();
  });

  it('shows Google failure without switching the current account', async () => {
    window.history.replaceState({}, '', '/conta?google=failed');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => privateFetch(url)),
    );
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Conta' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain(
      'Sua conta continua ativa',
    );
    expect(
      screen.getByRole('button', { name: 'Vincular Google' }),
    ).toBeTruthy();
  });
});
