import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@study-platform/contracts';
import {
  AuthApiError,
  currentUser,
  logout,
  navigate,
  startGoogleLink,
} from './auth-api.js';

export function PrivatePage({ page }: { page: 'app' | 'conta' }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
            <h1>Olá, {user.email}</h1>
            <p>
              Seu espaço de estudos está pronto. Os módulos de estudo aparecerão
              aqui conforme forem adicionados.
            </p>
            <a href="/conta">Ver minha conta</a>
          </>
        ) : (
          <>
            <p className="section-kicker">Sua conta</p>
            <h1>Conta</h1>
            <p>
              <strong>E-mail:</strong> {user.email}
            </p>
            <p>
              <strong>Google:</strong>{' '}
              {user.googleLinked ? 'Vinculado' : 'Não vinculado'}
            </p>
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
