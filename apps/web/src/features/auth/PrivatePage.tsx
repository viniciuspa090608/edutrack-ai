import { navigatePrivateLink } from '../../app/private-navigation.js';
import { waitForExit } from '../../app/navigation-motion.js';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';

import { Button } from '@study-platform/ui/components/ui/button';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthUser } from '@study-platform/contracts';
import type { ModulePreferences } from '@study-platform/contracts';
import { ProfilePage } from '../profile/ProfilePage.js';
import { FlashcardsPage } from '../flashcards/FlashcardsPage.js';
import { preferences } from '../profile/profile-api.js';
import { moduleAtPath } from '../profile/module-catalog.js';
import { AuthenticatedShell } from './AuthenticatedShell.js';
import type { ConfirmedAvatar } from './ShellAvatar.js';
import { TasksPage } from '../tasks/TasksPage.js';
import { PomodoroPage } from '../pomodoro/PomodoroPage.js';
import { SubjectsPage } from '../subjects/SubjectsPage.js';
import { RoutinesPage } from '../routines/RoutinesPage.js';
import { AnalyticsPage } from '../analytics/AnalyticsPage.js';
import { StudyProgressPage } from '../study-progress/StudyProgressPage.js';
import { DashboardPage } from '../dashboard/DashboardPage.js';
import { OnboardingGate } from '../classroom/OnboardingGate.js';
import {
  AuthApiError,
  currentUser,
  logout,
  navigate,
  startGoogleLink,
} from './auth-api.js';

export function PrivatePage({
  page,
}: {
  page:
    | 'app'
    | 'conta'
    | 'module'
    | 'pomodoro'
    | 'rotinas'
    | 'estatisticas'
    | 'progresso';
}) {
  const content = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const sessionRequest = useRef(0);
  const [exiting, setExiting] = useState(false);
  const location = window.location.pathname + window.location.search;
  useEffect(() => {
    content.current?.focus({ preventScroll: true });
  }, [location]);
  useEffect(() => {
    const expired = () =>
      navigate(
        '/acesso?returnTo=' + encodeURIComponent(window.location.pathname),
      );
    window.addEventListener('edutrack:session-expired', expired);
    return () =>
      window.removeEventListener('edutrack:session-expired', expired);
  }, []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<ModulePreferences | null>(null);
  const [confirmedAvatar, setConfirmedAvatar] =
    useState<ConfirmedAvatar | null>(null);
  const updateAvatar = useCallback(
    (version: string | null) => setConfirmedAvatar({ version }),
    [],
  );
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
    const token = ++sessionRequest.current;
    const returnTo = [
      '/app/tarefas',
      '/app/flashcards',
      '/app/pomodoro',
      '/app/rotinas',
      '/app/materias',
      '/app/estatisticas',
      '/app/progresso',
    ].includes(window.location.pathname)
      ? window.location.pathname
      : window.location.pathname === '/conta'
        ? '/conta'
        : '/app';
    setChecking(true);
    setError('');
    try {
      const current = await currentUser();
      if (token === sessionRequest.current) setUser(current);
    } catch (cause) {
      if (token !== sessionRequest.current) return;
      if (
        cause instanceof AuthApiError &&
        (cause.status === 401 || cause.code === 'EMAIL_VERIFICATION_REQUIRED')
      ) {
        navigate(`/acesso?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      setError('Não foi possível verificar sua sessão. Tente novamente.');
    } finally {
      if (token === sessionRequest.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
    return () => {
      sessionRequest.current += 1;
    };
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
    if (leaving.current) return;
    leaving.current = true;
    setExiting(true);
    const motion = waitForExit(content.current);
    setBusy(true);
    setError('');
    try {
      await logout();
      await motion;
      navigate('/acesso');
    } catch {
      setExiting(false);
      setError('Não foi possível sair agora. Tente novamente.');
    } finally {
      leaving.current = false;
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
      <main
        className={`private-page${page === 'conta' ? ' account-session-state' : ''}`}
      >
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Verificando sessão…</p>
        </div>
      </main>
    );
  if (!user)
    return (
      <main
        className={`private-page${page === 'conta' ? ' account-session-state' : ''}`}
      >
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => {
            void check();
          }}
        >
          Tentar novamente
        </Button>
      </main>
    );

  return (
    <AuthenticatedShell
      user={user}
      prefs={prefs}
      busy={busy}
      onLogout={() => {
        void leave();
      }}
      confirmedAvatar={confirmedAvatar}
      account={page === 'conta'}
      error={error}
    >
      <main
        className="private-content"
        tabIndex={-1}
        onClick={navigatePrivateLink}
      >
        <OnboardingGate
          key={user.id}
          initialStep={user.onboardingStep}
          prefs={prefs}
          onPreferences={updatePreferences}
        >
          <div
            key={location}
            ref={content}
            tabIndex={-1}
            aria-busy={exiting}
            inert={exiting}
            className={`private-route-content animate__animated ${exiting ? 'animate__backOutLeft' : 'animate__fadeIn'}`}
          >
            {page === 'progresso' ? (
              <StudyProgressPage />
            ) : page === 'estatisticas' ? (
              <AnalyticsPage />
            ) : page === 'rotinas' ? (
              <RoutinesPage />
            ) : page === 'pomodoro' ? (
              <PomodoroPage
                tasksEnabled={prefs?.tasks ?? false}
                subjectsEnabled={prefs?.subjects ?? false}
              />
            ) : page === 'app' ? (
              <DashboardPage displayName={user.displayName ?? user.email} />
            ) : page === 'module' ? (
              <section
                className={
                  window.location.pathname === '/app/materias'
                    ? 'subjects-module'
                    : window.location.pathname === '/app/tarefas'
                      ? 'tasks-module'
                      : undefined
                }
              >
                <h1>{moduleAtPath(window.location.pathname)?.label}</h1>
                {!prefs ? (
                  <p role="status">
                    Não foi possível verificar as preferências.{' '}
                    <a href="/conta">Abrir conta e tentar novamente</a>
                  </p>
                ) : !prefs[
                    moduleAtPath(window.location.pathname)!.capability
                  ] ? (
                  <p>
                    Este módulo está desativado.{' '}
                    <a href="/conta">Reativar nas preferências</a>
                  </p>
                ) : window.location.pathname === '/app/tarefas' ? (
                  <TasksPage subjectsEnabled={prefs.subjects} />
                ) : window.location.pathname === '/app/flashcards' ? (
                  <FlashcardsPage
                    subjectsEnabled={prefs.subjects}
                    aiEnabled={prefs.ai}
                  />
                ) : window.location.pathname === '/app/materias' ? (
                  <SubjectsPage
                    tasksEnabled={prefs.tasks}
                    aiEnabled={prefs.ai}
                  />
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
                  onAvatar={updateAvatar}
                  onPreferences={updatePreferences}
                  accountActions={
                    <div className="account-access-actions">
                      <div className="account-detail">
                        <h3>Google</h3>
                        <p>
                          {user.googleLinked
                            ? 'Google vinculado à sua conta.'
                            : 'Vincule sua conta Google para usar esse meio de entrada.'}
                        </p>
                      </div>
                      {!user.googleLinked && (
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            void linkGoogle();
                          }}
                        >
                          Vincular Google
                        </Button>
                      )}
                      {new URLSearchParams(window.location.search).get(
                        'google',
                      ) === 'linked' && (
                        <p role="status">Google vinculado com sucesso.</p>
                      )}
                      {['failed', 'conflict'].includes(
                        new URLSearchParams(window.location.search).get(
                          'google',
                        ) ?? '',
                      ) && (
                        <Alert variant="destructive" role="alert">
                          <AlertDescription>
                            Não foi possível vincular o Google. Sua conta
                            continua ativa. Tente novamente.
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="account-signout">
                        <div>
                          <h3>Sessão atual</h3>
                          <p>Encerre seu acesso ao EduTrack neste navegador.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            void leave();
                          }}
                        >
                          Encerrar sessão
                        </Button>
                      </div>
                      <p role="status">
                        {busy ? 'Processando ação da conta…' : ''}
                      </p>
                      {error && (
                        <Alert variant="destructive" role="alert">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  }
                />
              </>
            )}
            {error && page !== 'conta' && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </OnboardingGate>
      </main>
    </AuthenticatedShell>
  );
}
