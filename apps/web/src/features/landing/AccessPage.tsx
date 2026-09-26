import { ArrowLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  allowedReturnTo,
  googleLoginUrl,
  localAccess,
  navigate,
} from '../auth/auth-api.js';

export function AccessPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const parameters = new URLSearchParams(window.location.search);
  const returnTo = allowedReturnTo(parameters.get('returnTo'));
  const googleError = parameters.get('google');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await localAccess(mode, email, password);
      navigate(result.kind === 'pending' ? '/confirmar-email' : returnTo);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="access-page">
      <div className="access-card auth-card">
        <span className="access-mark" aria-hidden="true">
          <Sparkles size={28} />
        </span>
        <p className="section-kicker">EduTrack</p>
        <h1>{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h1>
        <p>Organize seus estudos em um espaço só seu.</p>
        {parameters.get('account') === 'updated' && (
          <p role="status">
            Dados de segurança alterados. Entre novamente; as sessões anteriores
            foram encerradas.
          </p>
        )}
        {googleError && (
          <p className="auth-alert" role="alert">
            {googleError === 'conflict'
              ? 'Este e-mail já tem uma conta. Entre com sua senha e vincule o Google em Conta.'
              : 'Não foi possível entrar com o Google. Tente novamente.'}
          </p>
        )}
        <div className="auth-tabs" aria-label="Tipo de acesso">
          <button
            type="button"
            aria-pressed={mode === 'login'}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            aria-pressed={mode === 'register'}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Criar conta
          </button>
        </div>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <label htmlFor="auth-email">E-mail</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="auth-password">Senha</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            autoComplete={
              mode === 'register' ? 'new-password' : 'current-password'
            }
            minLength={mode === 'register' ? 12 : 1}
            maxLength={mode === 'register' ? 128 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {mode === 'register' && (
            <p className="auth-hint">Use entre 12 e 128 caracteres.</p>
          )}
          {error && (
            <p className="auth-alert" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-primary auth-submit"
            disabled={busy}
            type="submit"
          >
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <a className="auth-google" href={googleLoginUrl(returnTo)}>
          Continuar com Google
        </a>
        <a className="auth-back" href="/recuperar-senha">
          Esqueci minha senha
        </a>
        <a className="auth-back" href="/">
          <ArrowLeft size={18} aria-hidden="true" /> Voltar à landing
        </a>
      </div>
    </main>
  );
}
