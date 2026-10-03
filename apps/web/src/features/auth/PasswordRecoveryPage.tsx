import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';

import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
import { Button } from '@study-platform/ui/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AuthApiError,
  navigate,
  requestRecovery,
  resetPassword,
  verifyRecovery,
} from './auth-api.js';

type Step = 'request' | 'code' | 'password' | 'done';

export function PasswordRecoveryPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (step === 'request') {
        setMessage(await requestRecovery(email));
        setStep('code');
      } else if (step === 'code') {
        await verifyRecovery(email, code);
        setMessage('Código validado. Crie uma nova senha.');
        setStep('password');
      } else if (step === 'password') {
        await resetPassword(password);
        setMessage('Senha redefinida. Entre novamente para continuar.');
        setStep('done');
      }
    } catch (cause) {
      setError(
        step === 'password' && !(cause instanceof AuthApiError)
          ? 'Não foi possível confirmar o resultado. Tente entrar com sua nova senha ou solicite outro código.'
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível concluir. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError('');
    try {
      setMessage(await requestRecovery(email));
      setCode('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível solicitar outro código.',
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
            <p className="section-kicker">EduTrack</p>
            <h1 ref={heading} tabIndex={-1}>
              {step === 'request'
                ? 'Esqueci minha senha'
                : step === 'code'
                  ? 'Digite o código'
                  : step === 'password'
                    ? 'Crie uma nova senha'
                    : 'Senha redefinida'}
            </h1>
            <p>
              Se você usa Google, escolha “Continuar com Google” na entrada ou
              recupere sua conta diretamente com o Google.
            </p>
            {message && (
              <p role="status" aria-live="polite">
                {message}
              </p>
            )}
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {step !== 'done' && (
              <form
                onSubmit={(event) => {
                  void submit(event);
                }}
              >
                {step === 'request' && (
                  <>
                    <Label htmlFor="recovery-email">E-mail</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      autoComplete="email"
                      maxLength={320}
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </>
                )}
                {step === 'code' && (
                  <>
                    <Label htmlFor="recovery-code">Código de recuperação</Label>
                    <Input
                      id="recovery-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, ''))
                      }
                    />
                  </>
                )}
                {step === 'password' && (
                  <>
                    <Label htmlFor="recovery-password">Nova senha</Label>
                    <Input
                      id="recovery-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <p className="auth-hint">Use entre 12 e 128 caracteres.</p>
                  </>
                )}
                <Button className="auth-submit" type="submit" disabled={busy}>
                  {busy
                    ? 'Aguarde…'
                    : step === 'request'
                      ? 'Enviar código'
                      : step === 'code'
                        ? 'Validar código'
                        : 'Redefinir senha'}
                </Button>
              </form>
            )}
            {step === 'code' && (
              <Button
                className="auth-text-button"
                type="button"
                disabled={busy}
                onClick={() => {
                  void resend();
                }}
              >
                Enviar outro código
              </Button>
            )}
            {step === 'password' && (
              <Button
                className="auth-text-button"
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep('request');
                  setCode('');
                  setPassword('');
                  setError('');
                  setMessage('');
                }}
              >
                Solicitar novo código
              </Button>
            )}
            <Button
              className="auth-text-button"
              type="button"
              onClick={() => navigate('/acesso')}
            >
              Voltar para entrada
            </Button>
          </CardContent>
        </div>
      </Card>
    </main>
  );
}
