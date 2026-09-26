import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App.js';
import type { ModulePreferences, UserProfile } from '@study-platform/contracts';
import { availableModules, canUseAI } from './module-catalog.js';

let profile: UserProfile;
let prefs: ModulePreferences;
let failed = '';
const requests: Array<{ path: string; body: unknown; method: string }> = [];
beforeEach(() => {
  profile = {
    id: '00000000-0000-4000-8000-000000000000',
    email: 'ana@example.com',
    displayName: 'Ana',
    emailVerified: true,
    googleLinked: false,
    localPassword: true,
    avatarVersion: null,
  };
  prefs = { tasks: true, subjects: true, flashcards: true, ai: false };
  failed = '';
  requests.length = 0;
  window.history.replaceState({}, '', '/conta');
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      const method = init?.method ?? 'GET';
      const body: unknown =
        typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
      requests.push({ path, body, method });
      if (failed && path === failed && method !== 'GET')
        throw new Error('Rede indisponível. Tente novamente.');
      if (path === '/auth/me') return Response.json({ user: profile });
      if (path === '/profile/preferences') {
        if (method === 'PATCH')
          prefs = { ...prefs, ...(body as Partial<ModulePreferences>) };
        return Response.json(prefs);
      }
      if (path === '/profile') {
        if (method === 'PATCH')
          profile = {
            ...profile,
            displayName: (body as { displayName: string }).displayName,
          };
        return Response.json(profile);
      }
      if (path === '/profile/avatar') {
        if (method === 'GET')
          return new Response(new Blob(['image'], { type: 'image/webp' }));
        profile = {
          ...profile,
          avatarVersion:
            method === 'DELETE' ? null : '2026-09-26T16:00:00.000Z',
        };
        return Response.json(profile);
      }
      if (path.endsWith('/email/request') || path.endsWith('/email/resend'))
        return Response.json(
          { expiresInSeconds: 600, resendAfterSeconds: 60 },
          { status: 202 },
        );
      return new Response(null, { status: 204 });
    }),
  );
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  window.history.replaceState({}, '', '/');
});
async function open() {
  render(<App />);
  await screen.findByRole('heading', { name: 'Conta' });
}
describe('profile page', () => {
  it('refuses to disable the last study module even when AI is enabled', async () => {
    prefs = { tasks: true, subjects: false, flashcards: false, ai: true };
    await open();
    await userEvent
      .setup()
      .click(screen.getByRole('checkbox', { name: 'Tarefas' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'pelo menos um módulo de estudo ativo',
    );
    expect(
      (screen.getByRole('checkbox', { name: 'Tarefas' }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(requests.filter((r) => r.method === 'PATCH')).toHaveLength(0);
  });
  it('handles a server refusal when another tab has disabled the other modules', async () => {
    const original = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) =>
        init?.method === 'PATCH' && url.endsWith('/profile/preferences')
          ? Response.json(
              { error: { code: 'LAST_MODULE_REQUIRED' } },
              { status: 409 },
            )
          : original(url, init),
      ),
    );
    await open();
    await userEvent
      .setup()
      .click(screen.getByRole('checkbox', { name: 'Tarefas' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'pelo menos um módulo de estudo ativo',
    );
    expect(
      (screen.getByRole('checkbox', { name: 'Tarefas' }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });
  it('shows own profile, labelled keyboard controls and unavailable independent preferences', async () => {
    await open();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Avatar padrão' })).toBeTruthy();
    for (const name of ['Tarefas', 'Matérias', 'Flashcards', 'Recursos de IA'])
      expect(screen.getByRole('checkbox', { name })).toBeTruthy();
    expect(
      screen.getAllByText(/Funcionalidade ainda não disponível/),
    ).toHaveLength(3);
    expect(
      screen.queryByRole('button', { name: 'Aprimorar com IA' }),
    ).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Tarefas' }).getAttribute('href'),
    ).toBe('/app/tarefas');
    const toggle = screen.getByRole('checkbox', { name: 'Tarefas' });
    toggle.focus();
    await userEvent.setup().keyboard(' ');
    await waitFor(() =>
      expect((toggle as HTMLInputElement).checked).toBe(false),
    );
    expect(
      (screen.getByRole('checkbox', { name: 'Matérias' }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(requests.find((r) => r.method === 'PATCH')?.body).toEqual({
      tasks: false,
    });
  });
  it('keeps confirmed data after errors and saves a normalized name on retry', async () => {
    await open();
    const interaction = userEvent.setup();
    const name = screen.getByLabelText('Nome exibido');
    await interaction.clear(name);
    await interaction.type(name, '  Joana  ');
    failed = '/profile';
    await interaction.click(
      screen.getByRole('button', { name: 'Salvar nome' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Rede indisponível',
    );
    expect(profile.displayName).toBe('Ana');
    failed = '';
    await interaction.click(
      screen.getByRole('button', { name: 'Salvar nome' }),
    );
    await screen.findByText('Nome salvo.');
    expect(profile.displayName).toBe('Joana');
    failed = '/profile/preferences';
    await interaction.click(screen.getByRole('checkbox', { name: 'Matérias' }));
    await screen.findByRole('alert');
    expect(
      (screen.getByRole('checkbox', { name: 'Matérias' }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });
  it('previews, uploads and removes photos and rejects excessive file size', async () => {
    await open();
    const interaction = userEvent.setup();
    const input = screen.getByLabelText('Foto de perfil');
    const file = new File(['png-bytes'], 'photo.png', { type: 'image/png' });
    await interaction.upload(input, file);
    expect(
      await screen.findByRole('img', { name: 'Prévia da nova foto' }),
    ).toBeTruthy();
    await interaction.click(
      screen.getByRole('button', { name: 'Salvar foto' }),
    );
    await screen.findByText('Foto salva.');
    expect(
      requests.find((r) => r.path === '/profile/avatar' && r.method === 'PUT')
        ?.body,
    ).toBe(file);
    await interaction.click(
      screen.getByRole('button', { name: 'Remover foto' }),
    );
    await screen.findByText('Foto removida.');
    expect(screen.getByRole('img', { name: 'Avatar padrão' })).toBeTruthy();
    await interaction.upload(
      input,
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', {
        type: 'image/png',
      }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'até 2 MiB',
    );
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
  it('requires local proof, shows code expiry/resend limits and returns to login after confirmation', async () => {
    await open();
    const interaction = userEvent.setup();
    expect(screen.queryByLabelText('Novo e-mail')).toBeNull();
    await interaction.type(
      screen.getByLabelText('Senha atual para confirmar identidade'),
      'current-password',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Confirmar identidade' }),
    );
    await interaction.type(
      await screen.findByLabelText('Novo e-mail'),
      'new@example.com',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Enviar código ao novo e-mail' }),
    );
    expect(await screen.findByText(/10 minutos após o envio/)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: /Reenviar em/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await interaction.type(
      screen.getByLabelText('Código do novo e-mail'),
      '123456',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Confirmar novo e-mail' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      'sessões anteriores foram encerradas',
    );
    expect(
      requests.find((r) => r.path === '/profile/email/confirm')?.body,
    ).toEqual({ code: '123456' });
  });
  it('changes a local password and never offers nonexistent password controls for Google-only accounts', async () => {
    await open();
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByLabelText('Senha atual', { exact: true }),
      'current-password',
    );
    await interaction.type(
      screen.getByLabelText('Nova senha'),
      'new-password-long-enough',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Salvar nova senha' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeTruthy();
    expect(requests.find((r) => r.path === '/profile/password')?.body).toEqual({
      currentPassword: 'current-password',
      password: 'new-password-long-enough',
    });
    cleanup();
    profile = { ...profile, localPassword: false, googleLinked: true };
    window.history.replaceState({}, '', '/conta');
    await open();
    expect(screen.queryByLabelText('Nova senha')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Salvar nova senha' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Confirmar identidade com Google' }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'recuperação da conta Google' })
        .getAttribute('href'),
    ).toBe('https://accounts.google.com/signin/recovery');
  });
  it('handles expired identity proof without showing a saved email', async () => {
    window.history.replaceState({}, '', '/conta?google=reauthenticated');
    const original = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) =>
        url.endsWith('/profile/email/request')
          ? Response.json(
              { error: { code: 'IDENTITY_PROOF_REQUIRED' } },
              { status: 401 },
            )
          : original(url, init),
      ),
    );
    await open();
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByLabelText('Novo e-mail'),
      'new@example.com',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Enviar código ao novo e-mail' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Confirme novamente',
    );
    expect(
      screen.getByLabelText('Senha atual para confirmar identidade'),
    ).toBeTruthy();
    expect(profile.email).toBe('ana@example.com');
  });
  it('revalidates direct module pages after changes in another tab', async () => {
    prefs.subjects = false;
    window.history.replaceState({}, '', '/materias/123');
    render(<App />);
    expect(await screen.findByText(/Este módulo está desativado/)).toBeTruthy();
    prefs.subjects = true;
    act(() => {
      fireEvent(window, new Event('focus'));
    });
    expect(
      await screen.findByText(/Esta funcionalidade ainda não está disponível/),
    ).toBeTruthy();
    prefs.subjects = false;
    act(() => {
      fireEvent(window, new Event('focus'));
    });
    expect(
      await screen.findByRole('link', { name: 'Reativar nas preferências' }),
    ).toBeTruthy();
    expect(availableModules(prefs)).toHaveLength(1);
    expect(canUseAI(prefs, 'tasks', true)).toBe(false);
    expect(canUseAI({ ...prefs, ai: true }, 'tasks', true)).toBe(true);
    expect(canUseAI({ ...prefs, ai: true }, 'subjects', true)).toBe(false);
  });
});
