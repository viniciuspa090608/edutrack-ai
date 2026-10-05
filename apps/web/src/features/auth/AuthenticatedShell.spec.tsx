import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModulePreferences, UserProfile } from '@study-platform/contracts';
import { AuthenticatedShell } from './AuthenticatedShell.js';
import { ShellAvatar } from './ShellAvatar.js';
import * as profileApi from '../profile/profile-api.js';
import {
  initializeTheme,
  setTheme,
  THEME_STORAGE_KEY,
} from '../../app/theme.js';

vi.mock('../profile/profile-api.js');
const user: UserProfile = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'ana@example.com',
  displayName: 'Ana',
  googleLinked: false,
  localPassword: true,
  emailVerified: true,
  avatarVersion: null,
};
const prefs: ModulePreferences = {
  tasks: true,
  subjects: true,
  flashcards: true,
  ai: false,
};
let media: MediaQueryList;
let loadImage: boolean;
beforeEach(() => {
  const target = new EventTarget();
  media = Object.assign(target, {
    matches: true,
    media: '(min-width: 1024px)',
    onchange: null,
  }) as MediaQueryList;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  vi.spyOn(URL, 'createObjectURL').mockImplementation(
    () => `blob:confirmed-${Math.random()}`,
  );
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  loadImage = true;
  vi.stubGlobal(
    'Image',
    class extends EventTarget {
      complete = false;
      naturalWidth = 64;
      set src(_value: string) {
        this.complete = true;
        queueMicrotask(() =>
          this.dispatchEvent(new Event(loadImage ? 'load' : 'error')),
        );
      }
    },
  );
  vi.mocked(profileApi.profile).mockResolvedValue(user);
  vi.mocked(profileApi.avatar).mockResolvedValue(
    new Blob(['saved'], { type: 'image/webp' }),
  );
  window.history.replaceState({}, '', '/app');
  setTheme('light');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('dark');
  window.history.replaceState({}, '', '/');
});
function resize(desktop: boolean) {
  act(() => {
    Object.assign(media, { matches: desktop });
    media.dispatchEvent(new Event('change'));
  });
}
function openShell(
  preferences: ModulePreferences | null = prefs,
  busy = false,
  onLogout = vi.fn(),
) {
  return render(
    <AuthenticatedShell
      user={user}
      prefs={preferences}
      busy={busy}
      onLogout={onLogout}
      confirmedAvatar={null}
      account={false}
      error=""
    >
      <main className="private-content">
        <input aria-label="Rascunho" />
      </main>
    </AuthenticatedShell>,
  );
}
const paths = [
  '/app',
  '/app/tarefas',
  '/app/materias',
  '/app/flashcards',
  '/app/pomodoro',
  '/app/rotinas',
  '/app/estatisticas',
  '/app/progresso',
  '/conta',
];
describe('authenticated navigation', () => {
  it.each([0, 1, 2, 3, 4, 5, 6, 7])(
    'preserves fixed destinations and filters enabled modules (mask %i)',
    async (mask) => {
      openShell({
        ...prefs,
        tasks: !!(mask & 1),
        subjects: !!(mask & 2),
        flashcards: !!(mask & 4),
      });
      const nav = within(
        screen.getByRole('navigation', { name: 'Área pessoal' }),
      );
      const expected = paths.filter(
        (path) =>
          !['/app/tarefas', '/app/materias', '/app/flashcards'].includes(
            path,
          ) ||
          (path === '/app/tarefas'
            ? mask & 1
            : path === '/app/materias'
              ? mask & 2
              : mask & 4),
      );
      expect(
        nav.getAllByRole('link').map((x) => x.getAttribute('href')),
      ).toEqual(expected);
      resize(false);
      expect(
        within(screen.getByRole('navigation', { name: 'Área pessoal' }))
          .getAllByRole('link')
          .map((x) => x.getAttribute('href')),
      ).toEqual(expected.slice(0, expected.length - 5));
      await userEvent.click(screen.getByRole('button', { name: 'Mais' }));
      expect(
        within(screen.getByRole('dialog'))
          .getAllByRole('link')
          .map((x) => x.getAttribute('href')),
      ).toEqual(paths.slice(4));
    },
  );
  it('keeps conditional modules absent when preferences are unavailable', () => {
    openShell(null);
    expect(screen.queryByRole('link', { name: 'Tarefas' })).toBeNull();
    resize(false);
    expect(
      within(
        screen.getByRole('navigation', { name: 'Área pessoal' }),
      ).getAllByRole('link'),
    ).toHaveLength(1);
  });
  it.each(paths)(
    'marks only the actual destination on %s and identifies routes inside More',
    async (path) => {
      window.history.replaceState({}, '', `${path}?test=1#section`);
      openShell();
      expect(
        screen
          .getByRole('navigation')
          .querySelector('[aria-current="page"]')
          ?.getAttribute('href'),
      ).toBe(path);
      expect(
        screen
          .getByRole('navigation')
          .querySelectorAll('[aria-current="page"]'),
      ).toHaveLength(1);
      resize(false);
      if (paths.slice(4).includes(path)) {
        const trigger = screen.getByRole('button', {
          name: 'Mais, contém a página atual',
        });
        expect(trigger.hasAttribute('aria-current')).toBe(false);
        await userEvent.click(trigger);
        expect(
          screen
            .getByRole('dialog')
            .querySelector('[aria-current="page"]')
            ?.getAttribute('href'),
        ).toBe(path);
      } else
        expect(
          screen
            .getByRole('navigation')
            .querySelector('[aria-current="page"]')
            ?.getAttribute('href'),
        ).toBe(path);
    },
  );
  it('recognizes module descendants without marking Home or inventing routes', () => {
    window.history.replaceState({}, '', '/app/tarefas/descendente');
    openShell();
    expect(
      screen
        .getByRole('link', { name: 'Tarefas' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen.getByRole('link', { name: 'Início' }).hasAttribute('aria-current'),
    ).toBe(false);
  });
  it('opens More by keyboard, restores focus on Escape and releases the portal on desktop resize', async () => {
    resize(false);
    openShell();
    const trigger = screen.getByRole('button', { name: 'Mais' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(
      true,
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await userEvent.click(trigger);
    resize(true);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Mais' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Pomodoro' })).toBeTruthy();
    resize(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('uses the supplied logout action in both layouts and honors its pending state', async () => {
    const leave = vi.fn();
    const view = openShell(prefs, false, leave);
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(leave).toHaveBeenCalledTimes(1);
    resize(false);
    await userEvent.click(screen.getByRole('button', { name: 'Mais' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(leave).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    resize(true);
    view.rerender(
      <AuthenticatedShell
        user={user}
        prefs={prefs}
        busy
        onLogout={leave}
        confirmedAvatar={null}
        account={false}
        error=""
      >
        <main />
      </AuthenticatedShell>,
    );
    expect(
      screen
        .getByRole('button', { name: 'Processando…' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });
  it('toggles the existing theme without remounting content and persists it across mounts', async () => {
    let mounts = 0;
    function Draft() {
      const [value, setValue] = useState(() => {
        mounts++;
        return '';
      });
      return (
        <input
          aria-label="Rascunho"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    const view = render(
      <AuthenticatedShell
        user={user}
        prefs={prefs}
        busy={false}
        onLogout={vi.fn()}
        confirmedAvatar={null}
        account={false}
        error=""
      >
        <Draft />
      </AuthenticatedShell>,
    );
    await userEvent.type(screen.getByRole('textbox'), 'Em andamento');
    await userEvent.click(
      screen.getByRole('button', { name: 'Ativar tema escuro' }),
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
      'Em andamento',
    );
    expect(mounts).toBe(1);
    view.unmount();
    const stop = initializeTheme();
    openShell();
    expect(
      screen.getByRole('button', { name: 'Ativar tema claro' }),
    ).toBeTruthy();
    stop();
  });
});
describe('confirmed shell avatar', () => {
  it('loads saved bytes, revokes its URL and never uses a previous image for a new confirmed version', async () => {
    vi.mocked(profileApi.profile).mockResolvedValue({
      ...user,
      avatarVersion: 'v1',
    });
    const view = render(<ShellAvatar user={user} confirmedAvatar={null} />);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="avatar-image"]')).toBeTruthy(),
    );
    expect(
      screen
        .getByRole('link', { name: 'Abrir conta de Ana' })
        .getAttribute('href'),
    ).toBe('/conta');
    const oldUrl = document.querySelector('img')!.getAttribute('src');
    let resolve!: (blob: Blob) => void;
    vi.mocked(profileApi.avatar).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    view.rerender(
      <ShellAvatar
        user={{ ...user, displayName: 'Beatriz' }}
        confirmedAvatar={{ version: 'v2' }}
      />,
    );
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('B')).toBeTruthy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(oldUrl);
    view.rerender(
      <ShellAvatar user={user} confirmedAvatar={{ version: null }} />,
    );
    await act(async () => resolve(new Blob(['obsolete'])));
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('A')).toBeTruthy();
    view.unmount();
  });
  it('keeps the fallback and account access when the image or profile read fails', async () => {
    loadImage = false;
    vi.mocked(profileApi.profile).mockResolvedValue({
      ...user,
      avatarVersion: 'v1',
    });
    const view = render(<ShellAvatar user={user} confirmedAvatar={null} />);
    await waitFor(() => expect(profileApi.avatar).toHaveBeenCalled());
    expect(screen.getByText('A')).toBeTruthy();
    view.unmount();
    vi.mocked(profileApi.profile).mockRejectedValue(new Error('Offline'));
    render(
      <ShellAvatar
        user={{ ...user, displayName: undefined }}
        confirmedAvatar={null}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Abrir conta' })).toBeTruthy(),
    );
    expect(
      document.querySelector('[data-slot="avatar-fallback"] svg'),
    ).toBeTruthy();
  });
  it('discards a profile response from an unmounted avatar', async () => {
    let resolve!: (profile: UserProfile) => void;
    vi.mocked(profileApi.profile).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const view = render(<ShellAvatar user={user} confirmedAvatar={null} />);
    view.unmount();
    await act(async () => resolve({ ...user, avatarVersion: 'old' }));
    expect(profileApi.avatar).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
