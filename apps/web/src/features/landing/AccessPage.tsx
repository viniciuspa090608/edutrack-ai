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
import { Card, CardContent } from '@study-platform/ui/components/ui/card';

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
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
      <Card asChild>
        <div className="access-card auth-card">
          <CardContent>
            <span className="access-mark" aria-hidden="true">
              <Sparkles size={28} />
            </span>
            <p className="section-kicker">EduTrack</p>
            <h1>
              {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
            </h1>
            <p>Organize seus estudos em um espaço só seu.</p>
            {parameters.get('account') === 'updated' && (
              <p role="status">
                Dados de segurança alterados. Entre novamente; as sessões
                anteriores foram encerradas.
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
                setMode(value as 'login' | 'register');
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
                {busy
                  ? 'Aguarde…'
                  : mode === 'login'
                    ? 'Entrar'
                    : 'Criar conta'}
              </Button>
            </form>
            <Button asChild variant="outline">
              <a className="auth-google" href={googleLoginUrl(returnTo)}>
                Continuar com Google
              </a>
            </Button>
            <a className="auth-back" href="/recuperar-senha">
              Esqueci minha senha
            </a>
            <a className="auth-back" href="/">
              <ArrowLeft size={18} aria-hidden="true" /> Voltar à landing
            </a>
          </CardContent>
        </div>
      </Card>
    </main>
  );
}
