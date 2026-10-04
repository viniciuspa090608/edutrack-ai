import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App.js';
import type { ModulePreferences, UserProfile } from '@study-platform/contracts';
import { availableModules, canUseAI } from './module-catalog.js';
import { setTheme, THEME_STORAGE_KEY } from '../../app/theme.js';

let profile: UserProfile;
let prefs: ModulePreferences;
let failed = '';
let loadFailed = '';
let mutationGate: Promise<void> | null = null;
const requests: Array<{ path: string; body: unknown; method: string }> = [];
beforeEach(() => {
  // Match browser Storage rather than Node's localStorage placeholder.
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  });
  vi.stubGlobal(
    'Image',
    class extends EventTarget {
      complete = false;
      naturalWidth = 64;
      set src(_value: string) {
        this.complete = true;
        queueMicrotask(() => this.dispatchEvent(new Event('load')));
      }
    },
  );
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
  loadFailed = '';
  mutationGate = null;
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
      if (path === loadFailed && method === 'GET') throw new Error('Offline');
      if (method !== 'GET' && mutationGate) await mutationGate;
      if (path === '/account/study-timezone')
        return Response.json({
          timeZone: 'UTC',
          trackingStartedAt: '2026-09-27T12:00:00.000Z',
        });
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
  setTheme('light');
  window.localStorage.removeItem(THEME_STORAGE_KEY);
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
  it('keeps drafts and confirmed data across section navigation and both themes without reloading APIs', async () => {
    await open();
    const interaction = userEvent.setup();
    const nav = screen.getByRole('navigation', {
      name: 'Configurações da conta',
    });
    const input = screen.getByLabelText('Nome exibido');
    await interaction.clear(input);
    await interaction.type(input, 'Nome em edição');
    for (const link of within(nav).getAllByRole('link')) {
      const target = link.getAttribute('href')!;
      expect(document.querySelector(target)).toBeTruthy();
      await interaction.click(link);
      // jsdom does not perform browser scrolling; announce the same native hash event.
      act(() => {
        window.history.replaceState({}, '', `/conta${target}`);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      expect(link.getAttribute('aria-current')).toBe('location');
      expect((input as HTMLInputElement).value).toBe('Nome em edição');
    }
    const before = requests.filter((r) => r.method === 'GET').length;
    await interaction.click(screen.getByRole('button', { name: 'Escuro' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(
      screen
        .getByRole('button', { name: 'Escuro' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    await interaction.click(screen.getByRole('button', { name: 'Claro' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect((input as HTMLInputElement).value).toBe('Nome em edição');
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeTruthy();
    expect(requests.filter((r) => r.method === 'GET')).toHaveLength(before);
    expect(screen.queryByText(/Semestre|2FA|Moodle|Excluir conta/)).toBeNull();
  });
  it('announces loading failure and retry without invented account content', async () => {
    loadFailed = '/profile';
    render(<App />);
    expect(screen.getByText('Verificando sessão…')).toBeTruthy();
    await screen.findByText(
      'Não foi possível carregar sua conta. Tente novamente.',
    );
    expect(
      screen.queryByRole('navigation', { name: 'Configurações da conta' }),
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Vincular Google' }),
    ).toBeTruthy();
    loadFailed = '';
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      await screen.findByRole('heading', { name: 'Seu perfil' }),
    ).toBeTruthy();
    expect(screen.getByText(profile.email)).toBeTruthy();
  });
  it('blocks repeated submissions and waits for confirmed API data before showing success', async () => {
    await open();
    const interaction = userEvent.setup();
    await interaction.clear(screen.getByLabelText('Nome exibido'));
    await interaction.type(screen.getByLabelText('Nome exibido'), 'Novo nome');
    let release!: () => void;
    mutationGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await interaction.click(
      screen.getByRole('button', { name: 'Salvar nome' }),
    );
    expect(screen.getByText('Salvando…')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Salvar nome' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.queryByText('Nome salvo.')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeTruthy();
    expect(
      (screen.getByRole('checkbox', { name: 'Matérias' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await act(async () => {
      release();
    });
    await screen.findByText('Nome salvo.');
    expect(screen.getByRole('heading', { name: 'Novo nome' })).toBeTruthy();
  });
  it('preserves the session and exposes retry after a logout or Google linking failure', async () => {
    await open();
    const interaction = userEvent.setup();
    failed = '/auth/logout';
    await interaction.click(
      screen.getByRole('button', { name: 'Encerrar sessão' }),
    );
    await screen.findByText('Não foi possível sair agora. Tente novamente.');
    expect(screen.getByText(profile.email)).toBeTruthy();
    failed = '/auth/google/link/start';
    await interaction.click(
      screen.getByRole('button', { name: 'Vincular Google' }),
    );
    await screen.findByText(
      'Não foi possível vincular o Google. Tente novamente.',
    );
    expect(
      (screen.getByRole('button', { name: 'Sair' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(requests.some((r) => r.path === '/auth/google/link/start')).toBe(
      true,
    );
    expect(window.location.pathname).toBe('/conta');
  });
  it('shows Google linking success only on the existing return flag and hides the link action for linked accounts', async () => {
    profile.googleLinked = true;
    window.history.replaceState({}, '', '/conta?google=linked');
    render(<App />);
    await screen.findByRole('heading', { name: 'Conta' });
    expect(screen.getByText('Google vinculado com sucesso.')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Vincular Google' }),
    ).toBeNull();
    expect(screen.getByText('Google vinculado à sua conta.')).toBeTruthy();
  });
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
      screen
        .getByRole('checkbox', { name: 'Tarefas' })
        .getAttribute('aria-checked'),
    ).toBe('true');
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
      screen
        .getByRole('checkbox', { name: 'Tarefas' })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });
  it('shows own profile, labelled keyboard controls and unavailable independent preferences', async () => {
    await open();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Avatar padrão' })).toBeTruthy();
    for (const name of ['Tarefas', 'Matérias', 'Flashcards', 'Recursos de IA'])
      expect(screen.getByRole('checkbox', { name })).toBeTruthy();
    expect(
      screen.getAllByText(/Funcionalidade ainda não disponível/),
    ).toHaveLength(1);
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
      expect(toggle.getAttribute('aria-checked')).toBe('false'),
    );
    expect(
      screen
        .getByRole('checkbox', { name: 'Matérias' })
        .getAttribute('aria-checked'),
    ).toBe('true');
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
      screen
        .getByRole('checkbox', { name: 'Matérias' })
        .getAttribute('aria-checked'),
    ).toBe('true');
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
    window.history.replaceState({}, '', '/app/materias/123');
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
    expect(availableModules(prefs)).toHaveLength(2);
    expect(canUseAI(prefs, 'tasks', true)).toBe(false);
    expect(canUseAI({ ...prefs, ai: true }, 'tasks', true)).toBe(true);
    expect(canUseAI({ ...prefs, ai: true }, 'subjects', true)).toBe(false);
  });
});
