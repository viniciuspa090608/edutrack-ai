import { useCallback, useEffect, useRef, useState } from 'react';
import type { PomodoroSession } from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import { currentPomodoro } from '../pomodoro/pomodoro-api.js';
import { formatPomodoro, projectPomodoro } from '../pomodoro/pomodoro-clock.js';

export function DashboardPomodoro({ initial }: { initial: PomodoroSession }) {
  const [session, setSession] = useState<PomodoroSession | null>(initial);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState(false);
  const receivedAt = useRef(performance.now());
  const pending = useRef(false);
  const generation = useRef(0);
  const reconcile = useCallback(async () => {
    if (pending.current || document.visibilityState === 'hidden') return;
    pending.current = true;
    const request = generation.current;
    try {
      const value = await currentPomodoro();
      if (request !== generation.current) return;
      receivedAt.current = performance.now();
      setTick(0);
      setSession(value);
      setError(false);
    } catch {
      if (request === generation.current) setError(true);
    } finally {
      pending.current = false;
    }
  }, []);
  useEffect(() => {
    generation.current++;
    receivedAt.current = performance.now();
    setSession(initial);
    setTick(0);
    setError(false);
    return () => {
      generation.current++;
    };
  }, [initial]);
  useEffect(() => {
    void reconcile();
    const refresh = () => {
      void reconcile();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const poll = window.setInterval(() => {
      if (session) void reconcile();
    }, 5000);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reconcile, !!session]);
  useEffect(() => {
    if (session?.state !== 'RUNNING' || error) return;
    const timer = window.setInterval(
      () =>
        setTick(Math.floor((performance.now() - receivedAt.current) / 1000)),
      250,
    );
    return () => window.clearInterval(timer);
  }, [session, error]);
  const { remaining, state, boundary } = projectPomodoro(session, tick);
  useEffect(() => {
    if (boundary) void reconcile();
  }, [boundary, reconcile]);
  return (
    <>
      {error ? (
        <div role="alert">
          <p>Não foi possível sincronizar o Pomodoro.</p>
          <Button
            onClick={() => {
              void reconcile();
            }}
          >
            Tentar sincronizar Pomodoro
          </Button>
        </div>
      ) : session ? (
        <>
          <strong
            className="dashboard-pomodoro-clock"
            role="timer"
            aria-label="Tempo restante do Pomodoro"
          >
            {formatPomodoro(remaining)}
          </strong>
          <p>
            {state === 'RUNNING'
              ? 'Em andamento'
              : state === 'PAUSED'
                ? 'Pausada'
                : 'Entre blocos'}
          </p>
        </>
      ) : (
        <p>Sessão encerrada.</p>
      )}
      <a className="dashboard-action" href="/app/pomodoro">
        Retomar Pomodoro
      </a>
    </>
  );
}
