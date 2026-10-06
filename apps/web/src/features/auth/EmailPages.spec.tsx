import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App.js';

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

describe('email access pages', () => {
  it('shows an expired code and the resend waiting period without false success', async () => {
    window.history.replaceState({}, '', '/confirmar-email');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: { code: 'INVALID_CODE' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '60' }),
          json: async () => ({ error: { code: 'EMAIL_RATE_LIMITED' } }),
        }),
    );
    render(<App />);
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByRole('textbox', { name: 'Código de confirmação' }),
      '123456',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Confirmar e-mail' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Código inválido ou expirado',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Enviar outro código' }),
    );
    const waiting = await screen.findByRole('button', {
      name: 'Reenviar em 60s',
    });
    expect(waiting).toHaveProperty('disabled', true);
    expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull();
  });
  it('confirms a code without placing it in the URL and announces success', async () => {
    window.history.replaceState({}, '', '/confirmar-email');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    const interaction = userEvent.setup();
    expect(screen.queryByRole('button', { name: 'Mostrar senha' })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Confirme seu e-mail' }),
    );
    await interaction.type(
      screen.getByRole('textbox', { name: 'Código de confirmação' }),
      '123456',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Confirmar e-mail' }),
    );
    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      'E-mail confirmado. Entre com sua senha para continuar.',
    );
    expect(window.location.href).not.toContain('123456');
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3001/auth/email-verification/confirm',
    );
  });

  it('supports generic request, code, and new password without URL secrets', async () => {
    window.history.replaceState({}, '', '/recuperar-senha');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({
          message:
            'Se houver uma conta com senha local, enviaremos um código. Você também pode entrar com Google.',
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 204 })
      .mockResolvedValueOnce({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByRole('textbox', { name: 'E-mail' }),
      'student@example.com',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Enviar código' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Digite o código' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mostrar senha' })).toBeNull();
    await interaction.type(
      screen.getByRole('textbox', { name: 'Código de recuperação' }),
      '654321',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Validar código' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Crie uma nova senha' }),
    ).toBeTruthy();
    await interaction.type(
      screen.getByLabelText('Nova senha'),
      'new-correct-horse-battery',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Mostrar senha' }),
    );
    expect((screen.getByLabelText('Nova senha') as HTMLInputElement).type).toBe(
      'text',
    );
    expect(
      (screen.getByLabelText('Nova senha') as HTMLInputElement).value,
    ).toBe('new-correct-horse-battery');
    await interaction.click(
      screen.getByRole('button', { name: 'Ocultar senha' }),
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Redefinir senha' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Senha redefinida' }),
      ).toBeTruthy(),
    );
    expect(window.location.search).toBe('');
    expect(window.location.href).not.toContain('654321');
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'http://localhost:3001/auth/password-recovery/request',
      'http://localhost:3001/auth/password-recovery/verify',
      'http://localhost:3001/auth/password-recovery/reset',
    ]);
  });

  it('offers a safe recovery path when the reset response is lost', async () => {
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
        .mockRejectedValueOnce(new TypeError('Network failure')),
    );
    render(<App />);
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByRole('textbox', { name: 'E-mail' }),
      'student@example.com',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Enviar código' }),
    );
    await interaction.type(
      await screen.findByRole('textbox', { name: 'Código de recuperação' }),
      '123456',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Validar código' }),
    );
    await interaction.type(
      await screen.findByLabelText('Nova senha'),
      'new-correct-horse-battery',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Redefinir senha' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Tente entrar com sua nova senha ou solicite outro código',
    );
    expect(
      screen.queryByRole('heading', { name: 'Senha redefinida' }),
    ).toBeNull();
    await interaction.click(
      screen.getByRole('button', { name: 'Solicitar novo código' }),
    );
    expect(await screen.findByRole('textbox', { name: 'E-mail' })).toBeTruthy();
  });
});
