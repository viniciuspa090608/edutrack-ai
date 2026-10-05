import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@study-platform/ui/components/ui/tabs';
import { Field } from '@study-platform/ui/components/ui/field';
import { AuthLayout } from '../auth/AuthLayout.js';
import googleLogo from '../auth/assets/google-g.png';

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { navigatePublicLink } from './public-navigation.js';
import {
  allowedReturnTo,
  googleLoginUrl,
  localAccess,
  navigate,
} from '../auth/auth-api.js';

function modeFromUrl(): 'login' | 'register' {
  return new URLSearchParams(window.location.search).get('mode') === 'register'
    ? 'register'
    : 'login';
}

export function AccessPage() {
  const [mode, setMode] = useState<'login' | 'register'>(modeFromUrl);
  const [search, setSearch] = useState(() => window.location.search);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const parameters = new URLSearchParams(search);
  const returnTo = allowedReturnTo(parameters.get('returnTo'));
  const googleError = parameters.get('google');

  useEffect(() => {
    const update = () => {
      setSearch(window.location.search);
      setMode(modeFromUrl());
      setError('');
    };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

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
    <AuthLayout>
      <span className="auth-heading-icon" aria-hidden="true">
        <BookOpen size={24} />
      </span>
      <p className="section-kicker">EduTrack</p>
      <h1>{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h1>
      <p className="auth-description">
        Organize seus estudos em um espaço só seu.
      </p>
      {parameters.get('account') === 'updated' && (
        <p className="auth-feedback" role="status">
          Dados de segurança alterados. Entre novamente; as sessões anteriores
          foram encerradas.
        </p>
      )}
      {googleError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {googleError === 'conflict'
              ? 'Este e-mail já tem uma conta. Entre com sua senha e vincule o Google em Conta.'
              : 'Não foi possível entrar com o Google. Tente novamente.'}
          </AlertDescription>
        </Alert>
      )}
      <Tabs
        value={mode}
        onValueChange={(value) => {
          if (value !== 'login' && value !== 'register') return;
          const url = new URL(window.location.href);
          url.searchParams.set('mode', value);
          window.history.replaceState({}, '', url.pathname + url.search);
          setSearch(url.search);
          setMode(value);
          setError('');
        }}
      >
        <TabsList aria-label="Tipo de acesso" className="w-full">
          <TabsTrigger value="login" className="flex-1">
            Entrar
          </TabsTrigger>
          <TabsTrigger value="register" className="flex-1">
            Criar conta
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <form
        aria-busy={busy}
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <Field>
          <Label htmlFor="auth-email">E-mail</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="auth-password">Senha</Label>
          <Input
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
        </Field>
        {mode === 'register' && (
          <p className="auth-hint">Use entre 12 e 128 caracteres.</p>
        )}
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button className="auth-submit" disabled={busy} type="submit">
          {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </form>
      <div className="auth-divider">
        <span>ou continue com</span>
      </div>
      <Button asChild variant="outline">
        <a className="auth-google" href={googleLoginUrl(returnTo)}>
          <img src={googleLogo} width={20} height={20} alt="" />
          Continuar com Google
        </a>
      </Button>
      <a className="auth-back" href="/recuperar-senha">
        Esqueci minha senha
      </a>
      <a className="auth-back" href="/" onClick={navigatePublicLink}>
        <ArrowLeft size={18} aria-hidden="true" /> Voltar à landing
      </a>
    </AuthLayout>
  );
}
