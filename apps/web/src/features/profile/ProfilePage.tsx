import { StudyTimeZoneSection } from '../study-progress/StudyTimeZoneSection.js';
import { useCallback, useEffect, useState } from 'react';
import type {
  Capability,
  ModulePreferences,
  UserProfile,
} from '@study-platform/contracts';
import {
  displayNameSchema,
  passwordChangeSchema,
  hasEnabledStudyModule,
} from '@study-platform/contracts';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import * as api from './profile-api.js';
import { moduleCatalog } from './module-catalog.js';

export function ProfilePage({
  onName,
  onPreferences,
}: {
  onName: (name: string) => void;
  onPreferences: (prefs: ModulePreferences) => void;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [prefs, setPrefs] = useState<ModulePreferences | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selected, setSelected] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [proved, setProved] = useState(
    new URLSearchParams(window.location.search).get('google') ===
      'reauthenticated',
  );
  const load = useCallback(async () => {
    setError('');
    try {
      const [account, preferences] = await Promise.all([
        api.profile(),
        api.preferences(),
      ]);
      setUser(account);
      setName(account.displayName);
      setPrefs(preferences);
      onPreferences(preferences);
      setImage(account.avatarVersion ? await api.avatar() : null);
    } catch (cause) {
      setError(
        cause instanceof AuthApiError
          ? cause.message
          : 'Não foi possível carregar sua conta. Tente novamente.',
      );
    }
  }, [onPreferences]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!image) {
      setImageUrl('');
      return;
    }
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function run(work: () => Promise<void>, success: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
    } catch (cause) {
      if (
        cause instanceof AuthApiError &&
        cause.code === 'IDENTITY_PROOF_REQUIRED'
      )
        setProved(false);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  function requireLogin() {
    navigate('/acesso?returnTo=/conta&account=updated');
  }
  if (!user || !prefs)
    return (
      <section>
        <p role={error ? 'alert' : 'status'}>{error || 'Carregando perfil…'}</p>
        {error && (
          <button
            onClick={() => {
              void load();
            }}
          >
            Tentar novamente
          </button>
        )}
      </section>
    );
  const labels: Record<Capability, string> = {
    tasks: 'Tarefas',
    subjects: 'Matérias',
    flashcards: 'Flashcards',
    ai: 'Recursos de IA',
  };
  const wait = Math.max(0, Math.ceil((waitUntil - now) / 1000));
  return (
    <div className="account-sections">
      <h1>Conta</h1>
      <StudyTimeZoneSection />
      <p role="status" aria-live="polite">
        {busy ? 'Salvando…' : message}
      </p>
      {error && <p role="alert">{error}</p>}
      <section aria-labelledby="profile-title" className="account-card">
        <h2 id="profile-title">Seu perfil</h2>
        {imageUrl ? (
          <img
            className="account-avatar"
            src={imageUrl}
            alt={selected ? 'Prévia da nova foto' : 'Sua foto de perfil'}
          />
        ) : (
          <span
            className="account-avatar avatar-default"
            role="img"
            aria-label="Avatar padrão"
          >
            {user.displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <p id="photo-rules">
          JPEG, PNG ou WebP estático, até 2 MiB. De 64 a 4096 pixels por lado,
          até 16 milhões de pixels.
        </p>
        <label htmlFor="photo">Foto de perfil</label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="photo-rules"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (
              !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
              file.size > 2 * 1024 * 1024
            ) {
              setError('Escolha JPEG, PNG ou WebP de até 2 MiB.');
              event.target.value = '';
              return;
            }
            setSelected(file);
            setImage(file);
            setError('');
          }}
        />
        <div className="account-actions">
          <button
            disabled={busy || !selected}
            onClick={() => {
              void run(async () => {
                if (selected) {
                  const saved = await api.uploadAvatar(selected);
                  setUser(saved);
                  setSelected(null);
                  setImage(await api.avatar());
                }
              }, 'Foto salva.');
            }}
          >
            Salvar foto
          </button>
          <button
            disabled={busy || !user.avatarVersion}
            onClick={() => {
              void run(async () => {
                setUser(await api.removeAvatar());
                setImage(null);
                setSelected(null);
              }, 'Foto removida.');
            }}
          >
            Remover foto
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const parsed = displayNameSchema.safeParse(name);
              if (!parsed.success)
                throw new Error(
                  'Use de 2 a 60 caracteres, sem caracteres de controle.',
                );
              const saved = await api.updateName(parsed.data);
              setUser(saved);
              setName(saved.displayName);
              onName(saved.displayName);
            }, 'Nome salvo.');
          }}
        >
          <label htmlFor="display-name">Nome exibido</label>
          <input
            id="display-name"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
            required
          />
          <p>
            Seu nome pode se repetir. O identificador da conta permanece o
            mesmo.
          </p>
          <button disabled={busy}>Salvar nome</button>
        </form>
        <p>
          <strong>E-mail:</strong> {user.email}
        </p>
        <p>
          {user.emailVerified
            ? 'E-mail confirmado'
            : 'E-mail pendente de confirmação'}
        </p>
        <p>
          Meios de entrada:{' '}
          {[
            user.localPassword && 'E-mail e senha',
            user.googleLinked && 'Google',
          ]
            .filter(Boolean)
            .join(' e ')}
        </p>
      </section>
      <section aria-labelledby="security-title" className="account-card">
        <h2 id="security-title">Segurança</h2>
        <h3>Alterar e-mail</h3>
        <p>
          O endereço atual continua funcionando até você confirmar o novo.
          Depois, entre novamente.
        </p>
        {!proved &&
          (user.localPassword ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await api.action('/identity/password', { currentPassword });
                  setCurrentPassword('');
                  setProved(true);
                }, 'Identidade confirmada por 5 minutos.');
              }}
            >
              <label htmlFor="email-password">
                Senha atual para confirmar identidade
              </label>
              <input
                id="email-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={busy}
              />
              <button disabled={busy}>Confirmar identidade</button>
            </form>
          ) : (
            <button
              disabled={busy}
              onClick={() => {
                void run(async () => {
                  window.location.assign(await api.googleReauth());
                }, '');
              }}
            >
              Confirmar identidade com Google
            </button>
          ))}
        {proved && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await api.action('/email/request', { email });
                setPending(true);
                setWaitUntil(Date.now() + 60_000);
                setProved(false);
              }, 'Código enviado ao novo endereço.');
            }}
          >
            <label htmlFor="new-email">Novo e-mail</label>
            <input
              id="new-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
            <button disabled={busy}>Enviar código ao novo e-mail</button>
          </form>
        )}
        {pending && (
          <div>
            <p>
              O código vale por 10 minutos após o envio, com até 5 tentativas.
              Máximo de 3 envios por hora.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await api.action('/email/confirm', { code });
                  setCode('');
                  requireLogin();
                }, 'E-mail alterado. Entre novamente.');
              }}
            >
              <label htmlFor="email-code">Código do novo e-mail</label>
              <input
                id="email-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={busy}
              />
              <button disabled={busy}>Confirmar novo e-mail</button>
            </form>
            <button
              disabled={busy || wait > 0}
              onClick={() => {
                void run(async () => {
                  await api.action('/email/resend');
                  setWaitUntil(Date.now() + 60_000);
                  setCode('');
                }, 'Novo código enviado. O anterior foi invalidado.');
              }}
            >
              {wait ? `Reenviar em ${wait}s` : 'Reenviar código'}
            </button>
          </div>
        )}
        {user.localPassword ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const result = passwordChangeSchema.safeParse({
                  currentPassword,
                  password: newPassword,
                });
                if (!result.success)
                  throw new Error(
                    'Informe a senha atual e uma nova senha de 12 a 128 caracteres.',
                  );
                await api.action('/password', result.data);
                setCurrentPassword('');
                setNewPassword('');
                requireLogin();
              }, 'Senha alterada. Entre novamente.');
            }}
          >
            <h3>Alterar senha</h3>
            <label htmlFor="current-password">Senha atual</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={busy}
            />
            <label htmlFor="new-password">Nova senha</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={busy}
            />
            <p>
              Use de 12 a 128 caracteres. Todas as sessões serão encerradas.
            </p>
            <a href="/recuperar-senha">Esqueci minha senha</a>
            <button disabled={busy}>Salvar nova senha</button>
          </form>
        ) : (
          <p>
            Sua conta usa somente Google. Gerencie a senha e recupere o acesso
            pela{' '}
            <a href="https://accounts.google.com/signin/recovery">
              recuperação da conta Google
            </a>
            .
          </p>
        )}
      </section>
      <section aria-labelledby="preferences-title" className="account-card">
        <h2 id="preferences-title">Preferências de estudo</h2>
        <p>
          Mantenha pelo menos um módulo de estudo ativo entre tarefas, matérias
          e flashcards. A IA não conta como módulo de estudo.
        </p>
        <p>
          Desativar um módulo preserva seus dados. A IA é opcional e não
          interfere no uso manual.
        </p>
        {(Object.keys(labels) as Capability[]).map((key) => (
          <div className="account-preference" key={key}>
            <label>
              <input
                type="checkbox"
                checked={prefs[key]}
                disabled={busy}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  void run(
                    async () => {
                      if (!hasEnabledStudyModule({ ...prefs, [key]: enabled }))
                        throw new Error(
                          'Mantenha pelo menos um módulo de estudo ativo: tarefas, matérias ou flashcards.',
                        );
                      const saved = await api.updatePreferences({
                        [key]: enabled,
                      });
                      setPrefs(saved);
                      onPreferences(saved);
                      window.dispatchEvent(new Event('edutrack:preferences'));
                    },
                    `${labels[key]} ${enabled ? 'ativado' : 'desativado'}.`,
                  );
                }}
              />
              {labels[key]}
            </label>
            {(key === 'ai' ||
              !moduleCatalog.find((m) => m.capability === key)?.delivered) && (
              <small>
                Funcionalidade ainda não disponível. A preferência será aplicada
                quando for entregue.
              </small>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
