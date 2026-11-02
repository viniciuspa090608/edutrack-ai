import { useEffect, useRef, useState } from 'react';
import type {
  AICatalog,
  AIProvider,
  AISettings,
} from '@study-platform/contracts';
import { aiSettingsWriteSchema } from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import { Input } from '@study-platform/ui/components/ui/input';
import { Label } from '@study-platform/ui/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
} from '@study-platform/ui/components/ui/card';
import { AuthApiError } from '../auth/auth-api.js';
import * as api from './ai-settings-api.js';

export function AISettingsSection() {
  const [saved, setSaved] = useState<AISettings | null>(null);
  const [catalog, setCatalog] = useState<AICatalog | null>(null);
  const [mode, setMode] = useState<'platform' | 'personal'>('platform');
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [model, setModel] = useState('');
  // The uncontrolled password field never enters shared state or a query cache.
  const key = useRef<HTMLInputElement>(null);
  const feedback = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [confirm, setConfirm] = useState<'remove' | 'replace' | null>(null);
  const clear = () => {
    if (key.current) key.current.value = '';
  };
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void Promise.all([api.readAISettings(), api.readAICatalog()])
      .then(([settings, options]) => {
        if (!active) return;
        setSaved(settings);
        setCatalog(options);
        setMode(settings.mode);
        setProvider(settings.provider);
        setModel(
          settings.model ??
            options.providers.find((p) => p.id === settings.provider)!
              .models[0]!,
        );
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível carregar a configuração de IA. Tente novamente.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const field = key.current;
    return () => {
      active = false;
      if (field) field.value = '';
    };
  }, [retry]);
  useEffect(() => {
    const field = key.current;
    return () => {
      if (field) field.value = '';
    };
  }, [loading, mode]);
  useEffect(() => {
    if (error || message) feedback.current?.focus();
  }, [error, message]);
  async function persist(remove = false) {
    if (!saved || !catalog || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const input = aiSettingsWriteSchema.safeParse(
        mode === 'platform'
          ? { mode, revision: saved.revision }
          : {
              mode,
              provider,
              model,
              revision: saved.revision,
              ...(key.current?.value ? { apiKey: key.current.value } : {}),
            },
      );
      if (!remove && !input.success)
        throw new Error('Revise provedor, modelo e chave.');
      const next = remove
        ? await api.removeAISettings(saved.revision)
        : await api.saveAISettings(input.data!);
      setSaved(next);
      setMode(next.mode);
      setProvider(next.provider);
      setModel(
        next.model ??
          catalog.providers.find((p) => p.id === next.provider)!.models[0]!,
      );
      clear();
      setConfirm(null);
      setMessage(
        'Configuração de IA salva. A chave não foi testada no provedor.',
      );
    } catch (cause) {
      clear();
      setConfirm(null);
      setError(
        cause instanceof AuthApiError && cause.code === 'AI_SETTINGS_CONFLICT'
          ? 'A configuração mudou em outra janela. Recarregue antes de salvar.'
          : cause instanceof AuthApiError && cause.code === 'AI_KEY_REQUIRED'
            ? 'Informe uma nova chave para este provedor.'
            : 'Não foi possível salvar. A configuração confirmada foi preservada. Revise os campos e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card asChild>
      <section
        id="account-ai"
        className="account-card"
        aria-labelledby="account-ai-title"
      >
        <CardHeader>
          <div>
            <h2 id="account-ai-title">Inteligência artificial</h2>
            <p>Escolha para onde enviar seus conteúdos de estudo.</p>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p role="status">Carregando configuração de IA…</p>}
          <p ref={feedback} tabIndex={-1} role={error ? 'alert' : 'status'}>
            {error || message}
          </p>
          {!loading && (!saved || !catalog) && (
            <Button onClick={() => setRetry((n) => n + 1)}>
              Tentar novamente
            </Button>
          )}
          {!loading && saved && catalog && (
            <>
              <p>
                Configuração confirmada:{' '}
                {saved.mode === 'platform'
                  ? 'Padrão EduTrack — Gemini'
                  : `${catalog.providers.find((p) => p.id === saved.provider)?.label} — ${saved.model}`}
                .{' '}
                {saved.hasPersonalKey
                  ? 'Chave pessoal configurada.'
                  : 'Nenhuma chave pessoal salva.'}
              </p>
              <p>
                O padrão EduTrack usa Gemini, sem cobrança pela EduTrack,
                sujeito à disponibilidade e a {catalog.limits.platformUserDaily}{' '}
                gerações por dia UTC. Todos os modos permitem até{' '}
                {catalog.limits.userPerMinute} chamadas por minuto e{' '}
                {catalog.limits.userConcurrency} em andamento por conta.
              </p>
              {!saved.platformAvailable && (
                <p>
                  O padrão está indisponível no momento. Você pode configurar
                  uma chave pessoal.
                </p>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (saved.hasPersonalKey && mode === 'platform')
                    setConfirm('remove');
                  else if (
                    saved.hasPersonalKey &&
                    (key.current?.value || provider !== saved.provider)
                  )
                    setConfirm('replace');
                  else void persist();
                }}
              >
                <fieldset disabled={busy}>
                  <legend>Modo de geração</legend>
                  <Label>
                    <input
                      type="radio"
                      name="ai-mode"
                      value="platform"
                      checked={mode === 'platform'}
                      onChange={() => {
                        setMode('platform');
                        clear();
                        setConfirm(null);
                      }}
                    />{' '}
                    Padrão EduTrack (Gemini)
                  </Label>
                  <Label>
                    <input
                      type="radio"
                      name="ai-mode"
                      value="personal"
                      checked={mode === 'personal'}
                      onChange={() => {
                        setMode('personal');
                        setConfirm(null);
                      }}
                    />{' '}
                    Usar minha chave pessoal
                  </Label>
                  {mode === 'personal' && (
                    <>
                      <p>
                        Ao salvar o modo pessoal, você autoriza o envio dos
                        conteúdos de roadmaps e flashcards ao provedor
                        selecionado. Custos e cotas seguem sua conta nesse
                        provedor. A assinatura ChatGPT não substitui uma chave
                        da API OpenAI.
                      </p>
                      <Label htmlFor="ai-provider">Provedor de IA</Label>
                      <select
                        id="ai-provider"
                        value={provider}
                        onChange={(event) => {
                          const next = event.target.value as AIProvider;
                          setProvider(next);
                          setModel(
                            catalog.providers.find((p) => p.id === next)!
                              .models[0]!,
                          );
                          clear();
                          setConfirm(null);
                        }}
                      >
                        {catalog.providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <Label htmlFor="ai-model">Modelo de IA</Label>
                      <select
                        id="ai-model"
                        value={model}
                        onChange={(event) => setModel(event.target.value)}
                      >
                        {!catalog.providers
                          .find((p) => p.id === provider)!
                          .models.includes(model) && (
                          <option value={model}>
                            {model} (indisponível — escolha outro)
                          </option>
                        )}
                        {catalog.providers
                          .find((p) => p.id === provider)!
                          .models.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                      </select>
                      <Label htmlFor="ai-key">
                        Chave da API{' '}
                        {saved.hasPersonalKey && saved.provider === provider
                          ? '(deixe vazio para manter)'
                          : '(obrigatória)'}
                      </Label>
                      <Input
                        ref={key}
                        id="ai-key"
                        name="ai-key"
                        type="password"
                        autoComplete="off"
                        maxLength={4096}
                        required={
                          !saved.hasPersonalKey || saved.provider !== provider
                        }
                      />
                      <p>
                        A chave não será exibida novamente. Salvar não realiza
                        chamada paga nem valida sua conta no provedor.
                      </p>
                    </>
                  )}
                  <Button disabled={busy}>Salvar configuração de IA</Button>
                  {saved.hasPersonalKey && (
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirm('remove')}
                    >
                      Remover chave e restaurar padrão
                    </Button>
                  )}
                </fieldset>
              </form>
              {confirm && (
                <div role="group" aria-label="Confirmar alteração de IA">
                  <p>
                    {confirm === 'remove'
                      ? 'Apagar a chave pessoal e restaurar o padrão Gemini?'
                      : 'Substituir a chave pessoal e sua configuração?'}
                  </p>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void persist(confirm === 'remove');
                    }}
                  >
                    Confirmar{' '}
                    {confirm === 'remove' ? 'remoção' : 'substituição'}
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirm(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  clear();
                  setRetry((n) => n + 1);
                }}
              >
                Recarregar configuração de IA
              </Button>
            </>
          )}
        </CardContent>
      </section>
    </Card>
  );
}
