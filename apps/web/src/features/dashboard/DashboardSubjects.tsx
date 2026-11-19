import { useEffect, useRef, useState } from 'react';
import type { DashboardSubjects as Subjects } from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import { Progress } from '@study-platform/ui/components/ui/progress';
import { BookOpen } from 'lucide-react';
import { CollectionEmptyState } from '../../components/CollectionEmptyState.js';
import { navigate } from '../auth/auth-api.js';
import { dashboardSubjects } from '../subjects/subjects-api.js';

export function DashboardSubjects({ initial }: { initial: Subjects }) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  const loading = useRef(false);
  useEffect(() => {
    generation.current++;
    loading.current = false;
    setData(initial);
    setBusy(false);
    setError(false);
    return () => {
      generation.current++;
    };
  }, [initial]);
  async function more() {
    if (loading.current) return;
    loading.current = true;
    setBusy(true);
    setError(false);
    const token = generation.current;
    try {
      const next = await dashboardSubjects(data.page + 1);
      if (token !== generation.current) return;
      setData((previous) => ({
        ...next,
        items: [
          ...previous.items,
          ...next.items.filter(
            (item) => !previous.items.some((old) => old.id === item.id),
          ),
        ],
      }));
    } catch {
      if (token === generation.current) setError(true);
    } finally {
      if (token === generation.current) {
        loading.current = false;
        setBusy(false);
      }
    }
  }
  if (data.total === 0)
    return (
      <CollectionEmptyState
        icon={<BookOpen />}
        title="Nenhuma disciplina cadastrada"
        description="Crie uma disciplina e organize seu plano de estudo, com ou sem IA."
        actionLabel="Adicionar disciplina"
        onAction={() => navigate('/app/materias?create=1')}
      />
    );
  return (
    <div
      className="dashboard-subject-scroll"
      tabIndex={0}
      role="region"
      aria-label="Disciplinas cadastradas"
    >
      <ul className="dashboard-subject-list">
        {data.items.map((subject) => (
          <li key={subject.id}>
            <h3>
              <a
                href={`/app/materias?subject=${encodeURIComponent(subject.id)}${subject.roadmapId ? '#roadmap-' + encodeURIComponent(subject.roadmapId) : ''}`}
              >
                {subject.name}
              </a>
            </h3>
            <p>
              Prazo: {subject.dueDate} ·{' '}
              {subject.hasPending
                ? 'Há estudo pendente'
                : 'Sem pendências de estudo'}
            </p>
            <p>
              {subject.title} ·{' '}
              {subject.source === 'roadmap' ? 'Roadmap' : 'Plano manual'}
            </p>
            <p>
              {subject.completed} de {subject.total} concluídos ·{' '}
              {subject.progressPercent === null
                ? 'Progresso não calculável'
                : subject.progressPercent.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  }) + '%'}
            </p>
            {subject.progressPercent !== null && (
              <Progress
                value={subject.progressPercent}
                aria-label={`Progresso de ${subject.name}`}
              />
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert">
          Não foi possível carregar mais disciplinas. Tente novamente.
        </p>
      )}
      {data.page < data.totalPages && (
        <Button disabled={busy} onClick={() => void more()}>
          {busy
            ? 'Carregando disciplinas…'
            : error
              ? 'Tentar carregar mais disciplinas'
              : 'Carregar mais disciplinas'}
        </Button>
      )}
    </div>
  );
}
