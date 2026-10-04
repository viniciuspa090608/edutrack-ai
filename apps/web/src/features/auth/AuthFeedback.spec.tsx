import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../app/App.js';

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

it.each([
  ['login', 401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.'],
  ['register', 409, 'EMAIL_CONFLICT', 'Não foi possível usar este e-mail.'],
])(
  'preserves the real %s error and payload',
  async (mode, status, code, message) => {
    window.history.replaceState({}, '', `/acesso?mode=${mode}`);
    const request = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ error: { code } }),
      });
    vi.stubGlobal('fetch', request);
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('E-mail'), 'student@example.com');
    await user.type(screen.getByLabelText('Senha'), 'long-enough-password');
    await user.click(
      screen.getByRole('button', {
        name: mode === 'login' ? 'Entrar' : 'Criar conta',
      }),
    );
    expect((await screen.findByRole('alert')).textContent).toBe(message);
    expect(JSON.parse(request.mock.calls[0]![1].body)).toEqual({
      email: 'student@example.com',
      password: 'long-enough-password',
    });
    expect(request.mock.calls[0]![1].credentials).toBe('include');
    expect(window.location.pathname).toBe('/acesso');
  },
);

it('blocks duplicate submission while access is pending', async () => {
  let finish!: (response: object) => void;
  const request = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal('fetch', request);
  render(<App />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('E-mail'), 'student@example.com');
  await user.type(screen.getByLabelText('Senha'), 'password');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByRole('button', { name: 'Aguarde…' })).toHaveProperty(
    'disabled',
    true,
  );
  await user.click(screen.getByRole('button', { name: 'Aguarde…' }));
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () =>
    finish({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'INVALID_CREDENTIALS' } }),
    }),
  );
  expect(screen.getByRole('button', { name: 'Entrar' })).toHaveProperty(
    'disabled',
    false,
  );
});

it('keeps invalid email from reaching the API and adds no prototype fields', async () => {
  window.history.replaceState({}, '', '/acesso?mode=register');
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  render(<App />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('E-mail'), 'invalid');
  await user.type(screen.getByLabelText('Senha'), 'long-enough-password');
  await user.click(screen.getByRole('button', { name: 'Criar conta' }));
  expect(request).not.toHaveBeenCalled();
  expect(
    (screen.getByLabelText('E-mail') as HTMLInputElement).validity.typeMismatch,
  ).toBe(true);
  expect(screen.getByLabelText('Senha')).toHaveProperty('minLength', 12);
  expect(screen.getByLabelText('Senha')).toHaveProperty('maxLength', 128);
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(
    screen.queryByText(/Microsoft|Nome Completo|Curso \/ Área/),
  ).toBeNull();
});

it('keeps an expired reset grant in the password step and offers restart', async () => {
  window.history.replaceState({}, '', '/recuperar-senha');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({
          message: 'Se houver uma conta, enviaremos um código.',
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 204 })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { code: 'INVALID_RESET_GRANT' } }),
      }),
  );
  render(<App />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('E-mail'), 'student@example.com');
  await user.click(screen.getByRole('button', { name: 'Enviar código' }));
  await user.type(
    await screen.findByLabelText('Código de recuperação'),
    '123456',
  );
  await user.click(screen.getByRole('button', { name: 'Validar código' }));
  await user.type(
    await screen.findByLabelText('Nova senha'),
    'long-enough-password',
  );
  await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'O prazo da redefinição terminou',
  );
  expect(
    screen.queryByRole('heading', { name: 'Senha redefinida' }),
  ).toBeNull();
  await user.click(
    screen.getByRole('button', { name: 'Solicitar novo código' }),
  );
  expect(screen.getByLabelText('E-mail')).toHaveProperty(
    'value',
    'student@example.com',
  );
});
