import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../app/App.js';
import { initializeTheme, setTheme } from '../../app/theme.js';

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal('scrollTo', vi.fn());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

it.each(['', '?mode=unknown', '?mode=login'])(
  'defaults safely to login for %s',
  (search) => {
    window.history.replaceState({}, '', `/acesso${search}`);
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeTruthy();
  },
);

it('follows same-route navigation and preserves returnTo and edited fields across ordinary renders', async () => {
  window.history.replaceState(
    {},
    '',
    '/acesso?mode=register&returnTo=/app/materias&google=conflict',
  );
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Crie sua conta' })).toBeTruthy();
  const email = screen.getByRole('textbox', { name: 'E-mail' });
  await userEvent.setup().type(email, 'aluno@example.com');
  expect(screen.getByRole('heading', { name: 'Crie sua conta' })).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('tab', { name: 'Entrar' }));
  expect(new URLSearchParams(location.search).get('returnTo')).toBe(
    '/app/materias',
  );
  expect(new URLSearchParams(location.search).get('google')).toBe('conflict');
  expect((email as HTMLInputElement).value).toBe('aluno@example.com');
  act(() => {
    window.history.pushState({}, '', '/acesso?mode=register&returnTo=/conta');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(screen.getByRole('heading', { name: 'Crie sua conta' })).toBeTruthy();
  expect(
    new URL(
      screen
        .getByRole('link', { name: 'Continuar com Google' })
        .getAttribute('href')!,
    ).searchParams.get('returnTo'),
  ).toBe('/conta');
  act(() => {
    window.history.pushState(
      {},
      '',
      '/acesso?mode=register&returnTo=/app/materias',
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(
    new URL(
      screen
        .getByRole('link', { name: 'Continuar com Google' })
        .getAttribute('href')!,
    ).searchParams.get('returnTo'),
  ).toBe('/app/materias');
});

it.each([
  'https://outside.example',
  '//outside.example',
  '/not-allowed',
  '/app/materias',
])('keeps Google returnTo safe in registration: %s', (target) => {
  window.history.replaceState(
    {},
    '',
    `/acesso?mode=register&returnTo=${encodeURIComponent(target)}`,
  );
  render(<App />);
  const url = new URL(
    screen
      .getByRole('link', { name: 'Continuar com Google' })
      .getAttribute('href')!,
  );
  expect(url.searchParams.get('returnTo')).toBe(
    target === '/app/materias' ? target : '/app',
  );
  expect((screen.getByLabelText('Senha') as HTMLInputElement).minLength).toBe(
    12,
  );
});

it('submits direct registration as pending confirmation rather than private access', async () => {
  window.history.replaceState({}, '', '/acesso?mode=register&returnTo=/conta');
  const request = vi.fn().mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: async () => ({ pendingVerification: true }),
  });
  vi.stubGlobal('fetch', request);
  render(<App />);
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'E-mail' }),
    'aluno@example.com',
  );
  await user.type(screen.getByLabelText('Senha'), 'long-enough-password');
  await user.click(screen.getByRole('button', { name: 'Criar conta' }));
  expect(
    await screen.findByRole('heading', { name: 'Confirme seu e-mail' }),
  ).toBeTruthy();
  expect(request.mock.calls[0]?.[0]).toBe(
    'http://localhost:3001/auth/register',
  );
  expect(location.pathname).toBe('/confirmar-email');
});

it('keeps a manual theme and scrolls to the top when navigating from the landing to access and back', async () => {
  window.history.replaceState({}, '', '/');
  const stop = initializeTheme();
  setTheme('dark');
  render(<App />);
  const interaction = userEvent.setup();
  await interaction.click(
    screen.getAllByRole('link', { name: 'Criar conta' })[0]!,
  );
  expect(screen.getByRole('heading', { name: 'Crie sua conta' })).toBeTruthy();
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  await interaction.click(
    screen.getByRole('link', { name: /Voltar à landing/ }),
  );
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
    'Organize seus estudos.',
  );
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(window.scrollTo).toHaveBeenCalledWith({
    top: 0,
    left: 0,
    behavior: 'instant',
  });
  stop();
  document.documentElement.classList.remove('dark');
});

it.each(['login', 'register'])(
  'offers password visibility only for the account password in %s',
  async (mode) => {
    window.history.replaceState({}, '', '/acesso?mode=' + mode);
    render(<App />);
    const user = userEvent.setup();
    const password = screen.getByLabelText('Senha') as HTMLInputElement;
    expect(password.type).toBe('password');
    expect(
      screen.getAllByRole('button', { name: 'Mostrar senha' }),
    ).toHaveLength(1);
    await user.type(password, 'senha-digitada');
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(password.type).toBe('text');
    expect(password.value).toBe('senha-digitada');
    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(password.type).toBe('password');
    expect(
      screen
        .getByLabelText('E-mail')
        .parentElement?.querySelector('[data-slot="password-toggle"]'),
    ).toBeNull();
  },
);
