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
  confirmEmail,
  navigate,
  resendEmail,
} from './auth-api.js';

export function EmailVerificationPage() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    'O envio pode levar alguns instantes. Verifique sua caixa de entrada e spam.',
  );
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [wait, setWait] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (!wait) return;
    const timer = window.setTimeout(
      () => setWait((value) => Math.max(0, value - 1)),
      1_000,
    );
    return () => window.clearTimeout(timer);
  }, [wait]);
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await confirmEmail(code);
      setDone(true);
      setMessage('E-mail confirmado. Entre com sua senha para continuar.');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível confirmar. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError('');
    setMessage('Solicitando um novo código…');
    try {
      await resendEmail();
      setWait(60);
      setMessage(
        'Solicitação recebida. Aguarde o código e use apenas o mais recente.',
      );
    } catch (cause) {
      if (cause instanceof AuthApiError && cause.status === 429)
        setWait(cause.retryAfter ?? 60);
      setMessage('');
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
              Confirme seu e-mail
            </h1>
            <p>
              Digite o código de seis dígitos enviado ao seu endereço. Ele vale
              por 10 minutos após o envio.
            </p>
            <p role="status" aria-live="polite">
              {message}
            </p>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!done && (
              <>
                <form
                  onSubmit={(event) => {
                    void confirm(event);
                  }}
                >
                  <Label htmlFor="verification-code">
                    Código de confirmação
                  </Label>
                  <Input
                    id="verification-code"
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
                  <Button className="auth-submit" type="submit" disabled={busy}>
                    {busy ? 'Verificando…' : 'Confirmar e-mail'}
                  </Button>
                </form>
                <Button
                  className="auth-text-button"
                  type="button"
                  disabled={busy || wait > 0}
                  onClick={() => {
                    void resend();
                  }}
                >
                  {wait > 0 ? `Reenviar em ${wait}s` : 'Enviar outro código'}
                </Button>
              </>
            )}
            <Button
              className="auth-text-button"
              type="button"
              onClick={() => navigate('/acesso')}
            >
              {done ? 'Entrar' : 'Voltar para entrada'}
            </Button>
          </CardContent>
        </div>
      </Card>
    </main>
  );
}
