import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@study-platform/contracts';
import type { ModulePreferences } from '@study-platform/contracts';
import { ProfilePage } from '../profile/ProfilePage.js';
import { preferences } from '../profile/profile-api.js';
import { availableModules, moduleAtPath } from '../profile/module-catalog.js';
import {
  AuthApiError,
  currentUser,
  logout,
  navigate,
  startGoogleLink,
} from './auth-api.js';

export function PrivatePage({ page }: { page: 'app' | 'conta' | 'module' }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<ModulePreferences | null>(null);
  const updatePreferences = useCallback(
    (value: ModulePreferences) => setPrefs(value),
    [],
  );
  const updateName = useCallback(
    (displayName: string) =>
      setUser((value) => (value ? { ...value, displayName } : value)),
    [],
  );

  const check = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      setUser(await currentUser());
    } catch (cause) {
      if (
        cause instanceof AuthApiError &&
        (cause.status === 401 || cause.code === 'EMAIL_VERIFICATION_REQUIRED')
      ) {
        navigate(`/acesso?returnTo=/${page}`);
        return;
      }
      setError('Não foi possível verificar sua sessão. Tente novamente.');
    } finally {
      setChecking(false);
    }
  }, [page]);

  useEffect(() => {
    void check();
  }, [check]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = () => {
      void preferences()
        .then((value) => {
          if (active) setPrefs(value);
        })
        .catch(() => {
          if (active) setPrefs(null);
        });
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('edutrack:preferences', refresh);
    const visibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('edutrack:preferences', refresh);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [user?.id]);

  async function leave() {
    setBusy(true);
    setError('');
    try {
      await logout();
      navigate('/acesso');
    } catch {
      setError('Não foi possível sair agora. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function linkGoogle() {
    setBusy(true);
    setError('');
    try {
      window.location.assign(await startGoogleLink());
    } catch {
      setError('Não foi possível vincular o Google. Tente novamente.');
      setBusy(false);
    }
  }

  if (checking)
    return (
      <main className="private-page">
        <p role="status">Verificando sessão…</p>
      </main>
    );
  if (!user)
    return (
      <main className="private-page">
        <p role="alert">{error}</p>
        <button
          onClick={() => {
            void check();
          }}
        >
          Tentar novamente
        </button>
      </main>
    );

  return (
    <div className="private-page">
      <header className="private-header">
        <a className="private-brand" href="/app">
          EduTrack
        </a>
        <nav aria-label="Área pessoal">
          <a href="/app">Início</a>
          <a href="/conta">Conta</a>
          {prefs &&
            availableModules(prefs).map((item) => (
              <a key={item.capability} href={item.path}>
                {item.label}
              </a>
            ))}
        </nav>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void leave();
          }}
        >
          Sair
        </button>
      </header>
      <main className="private-content">
        {page === 'app' ? (
          <>
            <p className="section-kicker">Seu espaço</p>
            <h1>Olá, {user.displayName ?? user.email}</h1>
            <p>
              Seu espaço de estudos está pronto. Os módulos de estudo aparecerão
              aqui conforme forem adicionados.
            </p>
            <a href="/conta">Ver minha conta</a>
          </>
        ) : page === 'module' ? (
          <section>
            <h1>{moduleAtPath(window.location.pathname)?.label}</h1>
            {!prefs ? (
              <p role="status">
                Não foi possível verificar as preferências.{' '}
                <a href="/conta">Abrir conta e tentar novamente</a>
              </p>
            ) : !prefs[moduleAtPath(window.location.pathname)!.capability] ? (
              <p>
                Este módulo está desativado.{' '}
                <a href="/conta">Reativar nas preferências</a>
              </p>
            ) : (
              <p>
                Esta funcionalidade ainda não está disponível.{' '}
                <a href="/conta">Ver preferências</a>
              </p>
            )}
          </section>
        ) : (
          <>
            <ProfilePage
              onName={updateName}
              onPreferences={updatePreferences}
            />
            {!user.googleLinked && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void linkGoogle();
                }}
              >
                Vincular Google
              </button>
            )}
            {new URLSearchParams(window.location.search).get('google') ===
              'linked' && <p role="status">Google vinculado com sucesso.</p>}
            {['failed', 'conflict'].includes(
              new URLSearchParams(window.location.search).get('google') ?? '',
            ) && (
              <p role="alert">
                Não foi possível vincular o Google. Sua conta continua ativa.
                Tente novamente.
              </p>
            )}
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </main>
    </div>
  );
}
