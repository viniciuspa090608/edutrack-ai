import { useEffect, useRef, useState } from 'react';
import {
  subjectGoalInputSchema,
  type GoalIndicator,
  type SubjectInsights,
} from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import { Input } from '@study-platform/ui/components/ui/input';
import { Label } from '@study-platform/ui/components/ui/label';
import { Progress } from '@study-platform/ui/components/ui/progress';
import {
  Card,
  CardContent,
  CardHeader,
} from '@study-platform/ui/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@study-platform/ui/components/ui/select';
import { readSubjectInsights, saveSubjectGoal } from './subject-goals-api.js';

const labels: Record<GoalIndicator, string> = {
  tasks: 'Tarefas concluídas',
  studyHours: 'Horas de foco',
  reviewAccuracy: 'Acertos nas revisões (%)',
};
const format = (value: number) => {
  if (value > 0 && value < 0.01) return 'menos de 0,01';
  if (value < 100 && value > 99.99) return 'menos de 100';
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};
export function SubjectInsightsPanel({ subjectId }: { subjectId: string }) {
  const [data, setData] = useState<SubjectInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [indicator, setIndicator] = useState<GoalIndicator>('tasks');
  const [target, setTarget] = useState('10');
  const [dueDate, setDueDate] = useState('');
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const editButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      sequence.current += 1;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (document.visibilityState === 'hidden' || submitting.current) return;
      const token = ++sequence.current;
      setLoading(true);
      setError('');
      try {
        const next = await readSubjectInsights(subjectId);
        if (active && token === sequence.current) setData(next);
      } catch {
        if (active && token === sequence.current) {
          setData(null);
          setError('Não foi possível atualizar a meta e os insights.');
        }
      } finally {
        if (active && token === sequence.current) setLoading(false);
      }
    };
    void refresh();
    const focused = () => {
      void refresh();
    };
    window.addEventListener('focus', focused);
    document.addEventListener('visibilitychange', focused);
    const interval = window.setInterval(focused, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', focused);
      document.removeEventListener('visibilitychange', focused);
    };
  }, [subjectId, revision]);
  const edit = () => {
    if (!data) return;
    setIndicator(
      data.goal && data.availableIndicators.includes(data.goal.indicator)
        ? data.goal.indicator
        : (data.availableIndicators[0] ?? 'tasks'),
    );
    setTarget(String(data.goal?.target ?? 10));
    setDueDate(data.goal?.dueDate ?? '');
    setEditing(true);
    setFormError('');
    setSuccess('');
  };
  return (
    <Card asChild>
      <section
        className="subject-card subject-insights min-w-0 break-words"
        aria-label="Meta e insights da disciplina"
      >
        <CardHeader>
          <h3>Meta e insights</h3>
          <p>Orientações calculadas com os registros desta disciplina.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <p role="status">Atualizando meta e insights…</p>}
          {error && (
            <div role="alert">
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => setRevision((value) => value + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          {success && <p role="status">{success}</p>}
          {data && (
            <>
              {data.goal ? (
                <div className="space-y-2">
                  <p>
                    <strong>
                      {labels[data.goal.indicator]}: {format(data.goal.target)}
                    </strong>
                  </p>
                  <p>
                    Prazo: {data.goal.dueDate} ({data.goal.timeZone})
                  </p>
                  {data.progress?.percent !== null &&
                    data.progress?.percent !== undefined && (
                      <Progress
                        value={data.progress.percent}
                        aria-label="Progresso da meta"
                      />
                    )}
                  <p>
                    {data.progress?.current === null
                      ? 'Sem medida disponível.'
                      : `${format(data.progress?.current ?? 0)} de ${format(data.goal.target)} — ${format(data.progress?.percent ?? 0)}% da meta.`}
                  </p>
                </div>
              ) : (
                <p>Nenhuma meta definida para esta disciplina.</p>
              )}
              {!data.availableIndicators.length && (
                <p>
                  Ative tarefas, Pomodoro ou flashcards nas preferências para
                  definir uma meta.
                </p>
              )}
              {!editing && (
                <Button
                  ref={editButton}
                  variant="outline"
                  disabled={!data.availableIndicators.length}
                  onClick={edit}
                >
                  {data.goal ? 'Editar meta' : 'Definir meta'}
                </Button>
              )}
              {editing && (
                <form
                  className="space-y-3"
                  aria-label="Configurar meta da disciplina"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (submitting.current) return;
                    const parsed = subjectGoalInputSchema.safeParse({
                      indicator,
                      target: Number(target),
                      dueDate,
                      timeZone:
                        data.goal?.timeZone ??
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                    });
                    if (!parsed.success) {
                      setFormError(
                        'Revise o valor, o indicador e o prazo da meta.',
                      );
                      return;
                    }
                    submitting.current = true;
                    sequence.current += 1;
                    setSaving(true);
                    setLoading(false);
                    setFormError('');
                    setSuccess('');
                    try {
                      const next = await saveSubjectGoal(
                        subjectId,
                        parsed.data,
                      );
                      if (!mounted.current) return;
                      setData(next);
                      setEditing(false);
                      setSuccess(
                        'Meta salva. Progresso e insights atualizados.',
                      );
                      requestAnimationFrame(() => editButton.current?.focus());
                    } catch {
                      if (mounted.current)
                        setFormError(
                          'Não foi possível salvar. Revise o prazo (hoje ou depois) e tente novamente.',
                        );
                    } finally {
                      submitting.current = false;
                      if (mounted.current) setSaving(false);
                    }
                  }}
                >
                  <div>
                    <Label htmlFor="goal-indicator">Indicador</Label>
                    <Select
                      value={indicator}
                      onValueChange={(value) =>
                        setIndicator(value as GoalIndicator)
                      }
                      disabled={saving}
                    >
                      <SelectTrigger id="goal-indicator" autoFocus>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {data.availableIndicators.map((value) => (
                          <SelectItem key={value} value={value}>
                            {labels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="goal-target">Valor desejado</Label>
                    <Input
                      id="goal-target"
                      type="number"
                      min={indicator === 'tasks' ? 1 : 0.01}
                      max={indicator === 'reviewAccuracy' ? 100 : 100000}
                      step={indicator === 'tasks' ? 1 : 0.01}
                      required
                      value={target}
                      disabled={saving}
                      onChange={(event) => setTarget(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal-deadline">Prazo da meta</Label>
                    <Input
                      id="goal-deadline"
                      type="date"
                      required
                      value={dueDate}
                      disabled={saving}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>
                  <p>
                    Tarefas incluem o histórico vinculado. Horas e acertos
                    contam desde o início da meta. Trocar o indicador inicia uma
                    nova janela.
                  </p>
                  {formError && <p role="alert">{formError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Salvando meta…' : 'Salvar meta'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving}
                      onClick={() => {
                        setEditing(false);
                        requestAnimationFrame(() =>
                          editButton.current?.focus(),
                        );
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
              <ul className="space-y-3">
                {data.insights.map((insight) => (
                  <li
                    key={insight.code}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <p>
                      <strong>{insight.information}</strong>
                    </p>
                    <p>{insight.evidence}</p>
                    <p>{insight.suggestion}</p>
                    {insight.action && (
                      <a className="underline" href={insight.action.href}>
                        {insight.action.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-sm">
                Atualizado em{' '}
                {new Date(data.calculatedAt).toLocaleString('pt-BR')}. Esses
                indicadores não representam notas acadêmicas.
              </p>
            </>
          )}
        </CardContent>
      </section>
    </Card>
  );
}
