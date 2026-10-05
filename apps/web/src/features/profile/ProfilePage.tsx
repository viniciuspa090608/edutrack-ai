import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@study-platform/ui/components/ui/avatar';
import { Button } from '@study-platform/ui/components/ui/button';

import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
import { Checkbox } from '@study-platform/ui/components/ui/checkbox';
import { Badge } from '@study-platform/ui/components/ui/badge';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  Camera,
  Check,
  ChevronRight,
  Globe,
  KeyRound,
  LogOut,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UserRound,
} from 'lucide-react';
import { setTheme, useTheme } from '../../app/theme.js';
import '../../styles/account.css';
import { StudyTimeZoneSection } from '../study-progress/StudyTimeZoneSection.js';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
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
  onAvatar,
  accountActions,
}: {
  onName: (name: string) => void;
  onPreferences: (prefs: ModulePreferences) => void;
  onAvatar?: (version: string | null) => void;
  accountActions?: ReactNode;
}) {
  const theme = useTheme();
  const [activeSection, setActiveSection] = useState(
    window.location.hash || '#account-profile',
  );
  useEffect(() => {
    const updateSection = () =>
      setActiveSection(window.location.hash || '#account-profile');
    window.addEventListener('hashchange', updateSection);
    return () => window.removeEventListener('hashchange', updateSection);
  }, []);
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
      <section
        className="account-area account-loading"
        aria-label="Carregamento da conta"
      >
        <UserRound aria-hidden="true" />
        <h2>Carregando sua conta</h2>
        {!error && <Skeleton className="h-24 w-full" aria-hidden="true" />}
        <p role={error ? 'alert' : 'status'}>{error || 'Carregando perfil…'}</p>
        {error && (
          <Button
            onClick={() => {
              void load();
            }}
          >
            Tentar novamente
          </Button>
        )}
        {accountActions && (
          <Card className="account-card">
            <CardHeader>
              <h2>Acesso à conta</h2>
            </CardHeader>
            <CardContent>{accountActions}</CardContent>
          </Card>
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
    <div className="account-area">
      <header className="account-heading">
        <div>
          <p className="account-eyebrow">PERFIL & AJUSTES</p>
          <h1>Conta</h1>
          <p>
            Seu perfil, suas preferências e seu acesso. Tudo em um só lugar.
          </p>
        </div>
        <a className="account-back" href="/app">
          Voltar ao início <ChevronRight aria-hidden="true" />
        </a>
      </header>
      <div className="account-layout">
        <aside
          className="account-sidebar"
          aria-label="Resumo e navegação da conta"
        >
          <Card className="account-summary">
            <div className="account-summary-cover" aria-hidden="true" />
            <Avatar className="account-summary-avatar">
              {imageUrl && <AvatarImage src={imageUrl} alt="" />}
              <AvatarFallback>
                {user.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="account-summary-identity">
              <h2>{user.displayName}</h2>
              <p>{user.email}</p>
              <Badge variant="secondary">
                <ShieldCheck aria-hidden="true" />
                {user.emailVerified
                  ? 'E-mail confirmado'
                  : 'E-mail pendente de confirmação'}
              </Badge>
            </div>
            <div className="account-summary-access">
              <span>Meios de entrada</span>
              <strong>
                {[
                  user.localPassword && 'E-mail e senha',
                  user.googleLinked && 'Google',
                ]
                  .filter(Boolean)
                  .join(' e ')}
              </strong>
            </div>
            <a href="#account-profile" className="account-summary-edit">
              <Camera aria-hidden="true" />
              Editar perfil e foto
            </a>
          </Card>
          <nav className="account-nav" aria-label="Configurações da conta">
            <a
              href="#account-profile"
              aria-current={
                activeSection === '#account-profile' ? 'location' : undefined
              }
            >
              <UserRound aria-hidden="true" />
              Perfil
              <ChevronRight aria-hidden="true" />
            </a>
            <a
              href="#account-preferences"
              aria-current={
                activeSection === '#account-preferences'
                  ? 'location'
                  : undefined
              }
            >
              <SlidersHorizontal aria-hidden="true" />
              Preferências
              <ChevronRight aria-hidden="true" />
            </a>
            <a
              href="#account-appearance"
              aria-current={
                activeSection === '#account-appearance' ? 'location' : undefined
              }
            >
              <Sun aria-hidden="true" />
              Aparência
              <ChevronRight aria-hidden="true" />
            </a>
            <a
              href="#account-security"
              aria-current={
                activeSection === '#account-security' ? 'location' : undefined
              }
            >
              <ShieldCheck aria-hidden="true" />
              Segurança
              <ChevronRight aria-hidden="true" />
            </a>
            <a
              href="#account-access"
              aria-current={
                activeSection === '#account-access' ? 'location' : undefined
              }
            >
              <LogOut aria-hidden="true" />
              Conta
              <ChevronRight aria-hidden="true" />
            </a>
          </nav>
          <p className="account-sidebar-help">
            As alterações são salvas em cada seção. Suas preferências não
            removem seus dados de estudo.
          </p>
        </aside>
        <div className="account-sections">
          <div
            className={`account-feedback${busy || message || error ? ' account-feedback-visible' : ''}`}
          >
            <p
              role="status"
              aria-live="polite"
              className={message && !busy ? 'account-success' : undefined}
            >
              {message && !busy && <Check aria-hidden="true" />}
              {busy ? 'Salvando…' : message}
            </p>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <Card asChild>
            <section
              id="account-profile"
              aria-labelledby="profile-title"
              className="account-card account-profile"
            >
              <CardHeader>
                <span className="account-icon">
                  <UserRound aria-hidden="true" />
                </span>
                <div>
                  <h2 id="profile-title">Seu perfil</h2>
                  <p>Como você aparece no EduTrack.</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="account-photo-editor">
                  <Avatar className="size-24">
                    {imageUrl && (
                      <AvatarImage
                        src={imageUrl}
                        alt={
                          selected
                            ? 'Prévia da nova foto'
                            : 'Sua foto de perfil'
                        }
                      />
                    )}
                    <AvatarFallback role="img" aria-label="Avatar padrão">
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="account-photo-controls">
                    <h3>Foto de perfil</h3>
                    {selected && (
                      <p className="account-preview-note">
                        Prévia da nova foto. Salve para confirmar a alteração.
                      </p>
                    )}
                    <p id="photo-rules">
                      JPEG, PNG ou WebP estático, até 2 MiB. De 64 a 4096 pixels
                      por lado, até 16 milhões de pixels.
                    </p>
                    <Label htmlFor="photo">Foto de perfil</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-describedby="photo-rules"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (
                          !['image/jpeg', 'image/png', 'image/webp'].includes(
                            file.type,
                          ) ||
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
                      <Button
                        disabled={busy || !selected}
                        onClick={() => {
                          void run(async () => {
                            if (selected) {
                              const saved = await api.uploadAvatar(selected);
                              onAvatar?.(saved.avatarVersion);
                              setUser(saved);
                              setSelected(null);
                              setImage(await api.avatar());
                            }
                          }, 'Foto salva.');
                        }}
                      >
                        Salvar foto
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy || !user.avatarVersion}
                        onClick={() => {
                          void run(async () => {
                            const saved = await api.removeAvatar();
                            setUser(saved);
                            onAvatar?.(saved.avatarVersion);
                            setImage(null);
                            setSelected(null);
                          }, 'Foto removida.');
                        }}
                      >
                        Remover foto
                      </Button>
                    </div>
                  </div>
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
                  <Label htmlFor="display-name">Nome exibido</Label>
                  <Input
                    id="display-name"
                    value={name}
                    disabled={busy}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="nickname"
                    required
                  />
                  <p>
                    Seu nome pode se repetir. O identificador da conta permanece
                    o mesmo.
                  </p>
                  <Button disabled={busy}>Salvar nome</Button>
                </form>
                <div className="account-detail">
                  <p>Seu e-mail é usado para acessar e recuperar a conta.</p>
                  <a href="#account-security">
                    Alterar e-mail com segurança{' '}
                    <ChevronRight aria-hidden="true" />
                  </a>
                </div>
              </CardContent>
            </section>
          </Card>
          <Card asChild>
            <section
              id="account-preferences"
              aria-labelledby="preferences-title"
              className="account-card account-preferences"
            >
              <CardHeader>
                <span className="account-icon">
                  <SlidersHorizontal aria-hidden="true" />
                </span>
                <div>
                  <h2 id="preferences-title">Preferências de estudo</h2>
                  <p>Escolha os recursos que fazem parte da sua rotina.</p>
                </div>
              </CardHeader>
              <CardContent>
                <p>
                  Mantenha pelo menos um módulo de estudo ativo entre tarefas,
                  matérias e flashcards. A IA não conta como módulo de estudo.
                </p>
                <p>
                  Desativar um módulo preserva seus dados. A IA é opcional e não
                  interfere no uso manual.
                </p>
                {(Object.keys(labels) as Capability[]).map((key) => (
                  <div className="account-preference" key={key}>
                    <Label>
                      <Checkbox
                        checked={prefs[key]}
                        disabled={busy}
                        onCheckedChange={(e) => {
                          const enabled = e === true;
                          void run(
                            async () => {
                              if (
                                !hasEnabledStudyModule({
                                  ...prefs,
                                  [key]: enabled,
                                })
                              )
                                throw new Error(
                                  'Mantenha pelo menos um módulo de estudo ativo: tarefas, matérias ou flashcards.',
                                );
                              const saved = await api.updatePreferences({
                                [key]: enabled,
                              });
                              setPrefs(saved);
                              onPreferences(saved);
                              window.dispatchEvent(
                                new Event('edutrack:preferences'),
                              );
                            },
                            `${labels[key]} ${enabled ? 'ativado' : 'desativado'}.`,
                          );
                        }}
                      />
                      {labels[key]}
                    </Label>
                    {(key === 'ai' ||
                      !moduleCatalog.find((m) => m.capability === key)
                        ?.delivered) && (
                      <small>
                        Funcionalidade ainda não disponível. A preferência será
                        aplicada quando for entregue.
                      </small>
                    )}
                  </div>
                ))}
              </CardContent>
            </section>
          </Card>
          <div className="account-timezone">
            <StudyTimeZoneSection />
          </div>
          <Card asChild>
            <section
              id="account-appearance"
              className="account-card account-appearance"
              aria-labelledby="appearance-title"
            >
              <CardHeader>
                <span className="account-icon">
                  <Sun aria-hidden="true" />
                </span>
                <div>
                  <h2 id="appearance-title">Aparência</h2>
                  <p>Escolha o tema mais confortável para estudar.</p>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="account-theme-options"
                  role="group"
                  aria-label="Tema da aplicação"
                >
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={theme === 'light'}
                    onClick={() => setTheme('light')}
                  >
                    <Sun aria-hidden="true" />
                    <span>Claro</span>
                    {theme === 'light' && <Check aria-hidden="true" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={theme === 'dark'}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon aria-hidden="true" />
                    <span>Escuro</span>
                    {theme === 'dark' && <Check aria-hidden="true" />}
                  </Button>
                </div>
                <p>A escolha do tema fica salva neste navegador.</p>
              </CardContent>
            </section>
          </Card>
          <Card asChild>
            <section
              id="account-security"
              aria-labelledby="security-title"
              className="account-card account-security"
            >
              <CardHeader>
                <span className="account-icon">
                  <ShieldCheck aria-hidden="true" />
                </span>
                <div>
                  <h2 id="security-title">Segurança</h2>
                  <p>Proteja seu acesso e mantenha seus dados atualizados.</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="account-security-block">
                  <h3>
                    <Globe aria-hidden="true" />
                    Alterar e-mail
                  </h3>
                  <p>
                    O endereço atual continua funcionando até você confirmar o
                    novo. Depois, entre novamente.
                  </p>
                  {!proved &&
                    (user.localPassword ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void run(async () => {
                            await api.action('/identity/password', {
                              currentPassword,
                            });
                            setCurrentPassword('');
                            setProved(true);
                          }, 'Identidade confirmada por 5 minutos.');
                        }}
                      >
                        <Label htmlFor="email-password">
                          Senha atual para confirmar identidade
                        </Label>
                        <Input
                          id="email-password"
                          type="password"
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          disabled={busy}
                        />
                        <Button disabled={busy}>Confirmar identidade</Button>
                      </form>
                    ) : (
                      <Button
                        disabled={busy}
                        onClick={() => {
                          void run(async () => {
                            window.location.assign(await api.googleReauth());
                          }, '');
                        }}
                      >
                        Confirmar identidade com Google
                      </Button>
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
                      <Label htmlFor="new-email">Novo e-mail</Label>
                      <Input
                        id="new-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={busy}
                      />
                      <Button disabled={busy}>
                        Enviar código ao novo e-mail
                      </Button>
                    </form>
                  )}
                  {pending && (
                    <div>
                      <p>
                        O código vale por 10 minutos após o envio, com até 5
                        tentativas. Máximo de 3 envios por hora.
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
                        <Label htmlFor="email-code">
                          Código do novo e-mail
                        </Label>
                        <Input
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
                        <Button disabled={busy}>Confirmar novo e-mail</Button>
                      </form>
                      <Button
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
                      </Button>
                    </div>
                  )}
                </div>
                <div className="account-security-block">
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
                      <h3>
                        <KeyRound aria-hidden="true" />
                        Alterar senha
                      </h3>
                      <Label htmlFor="current-password">Senha atual</Label>
                      <Input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        disabled={busy}
                      />
                      <Label htmlFor="new-password">Nova senha</Label>
                      <Input
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
                        Use de 12 a 128 caracteres. Todas as sessões serão
                        encerradas.
                      </p>
                      <a href="/recuperar-senha">Esqueci minha senha</a>
                      <Button disabled={busy}>Salvar nova senha</Button>
                    </form>
                  ) : (
                    <p>
                      Sua conta usa somente Google. Gerencie a senha e recupere
                      o acesso pela{' '}
                      <a href="https://accounts.google.com/signin/recovery">
                        recuperação da conta Google
                      </a>
                      .
                    </p>
                  )}
                </div>
              </CardContent>
            </section>
          </Card>
          <Card asChild>
            <section
              id="account-access"
              className="account-card account-access"
              aria-labelledby="account-access-title"
            >
              <CardHeader>
                <span className="account-icon">
                  <LogOut aria-hidden="true" />
                </span>
                <div>
                  <h2 id="account-access-title">Acesso à conta</h2>
                  <p>Gerencie seu vínculo com o Google e sua sessão atual.</p>
                </div>
              </CardHeader>
              <CardContent>{accountActions}</CardContent>
            </section>
          </Card>
        </div>
      </div>
    </div>
  );
}
