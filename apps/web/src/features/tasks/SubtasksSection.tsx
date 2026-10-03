import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { FieldSet } from '@study-platform/ui/components/ui/field';

import { Button } from '@study-platform/ui/components/ui/button';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import { Label } from '@study-platform/ui/components/ui/label';
import { Checkbox } from '@study-platform/ui/components/ui/checkbox';
import { Input } from '@study-platform/ui/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import { createSubtaskSchema } from '@study-platform/contracts';
import type {
  StudyTask,
  SubtasksResponse,
  Subtask,
} from '@study-platform/contracts';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import { listSubtasks, mutateSubtask } from './tasks-api.js';
import { TaskConfirmation } from './TaskConfirmation.js';

function errorText(cause: unknown) {
  if (cause instanceof AuthApiError && cause.status === 401) {
    navigate('/acesso?returnTo=%2Fapp%2Ftarefas');
    return 'Entre novamente para continuar.';
  }
  if (cause instanceof AuthApiError && cause.status === 409)
    return 'O estado mudou. Confira as subtarefas e tente novamente.';
  return 'Não foi possível alterar as subtarefas. Tente novamente.';
}
export function SubtasksSection({
  task,
  onTaskChanged,
}: {
  task: StudyTask;
  onTaskChanged: (task: StudyTask) => void;
}) {
  const [data, setData] = useState<SubtasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [editError, setEditError] = useState('');
  const [confirmation, setConfirmation] = useState<
    { kind: 'delete'; item: Subtask } | { kind: 'complete' } | null
  >(null);
  const [focusId, setFocusId] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void listSubtasks(task.id)
      .then((value) => {
        if (active) {
          setData(value);
          onTaskChanged(value.task);
        }
      })
      .catch((cause) => {
        if (active) setError(errorText(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [task.id, revision, onTaskChanged]);
  useEffect(() => {
    if (!busy && focusId) {
      document.getElementById(focusId)?.focus();
      setFocusId('');
    }
  }, [busy, focusId, data]);
  async function run(
    action: () => Promise<SubtasksResponse>,
    message: string,
    focus: string,
    dialog = false,
  ) {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const value = await action();
      setData(value);
      onTaskChanged(value.task);
      setSuccess(message);
      setFocusId(focus);
      return true;
    } catch (cause) {
      if (cause instanceof AuthApiError && cause.status === 409)
        try {
          const value = await listSubtasks(task.id);
          setData(value);
          onTaskChanged(value.task);
        } catch {
          /* Retain the last confirmed state when refresh fails. */
        }
      if (dialog) throw new Error(errorText(cause), { cause });
      setError(errorText(cause));
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function move(item: Subtask, direction: -1 | 1) {
    if (!data) return;
    const ids = data.items.map((item) => item.id);
    const destination = item.position + direction;
    [ids[item.position], ids[destination]] = [
      ids[destination]!,
      ids[item.position]!,
    ];
    await run(
      () => mutateSubtask(task.id, '/subtasks/order', 'PUT', { ids }),
      `${item.title}: posição ${destination + 1} de ${ids.length}.`,
      `subtask-${item.id}`,
    );
  }
  return (
    <section className="subtasks-section" aria-labelledby="subtasks-heading">
      <h3 id="subtasks-heading">Subtarefas</h3>
      {loading && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando subtarefas…</p>
        </div>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <p role="status" aria-live="polite">
          {success}
        </p>
      )}
      {!loading && !data && (
        <Button type="button" onClick={() => setRevision((value) => value + 1)}>
          Tentar carregar subtarefas
        </Button>
      )}
      {data && (
        <>
          <FieldSet disabled={busy || loading} className="subtasks-controls">
            {data.items.length === 0 ? (
              <p>Sem subtarefas. Adicione o primeiro passo.</p>
            ) : (
              <ol className="subtask-list">
                {data.items.map((item) => (
                  <Card key={item.id} asChild>
                    <li
                      id={`subtask-${item.id}`}
                      tabIndex={-1}
                      className="task-card"
                    >
                      <CardContent>
                        <Label>
                          <Checkbox
                            id={`subtask-toggle-${item.id}`}
                            checked={item.isCompleted}
                            onCheckedChange={() => {
                              void run(
                                () =>
                                  mutateSubtask(
                                    task.id,
                                    `/subtasks/${item.id}`,
                                    'PATCH',
                                    { isCompleted: !item.isCompleted },
                                  ),
                                item.isCompleted
                                  ? 'Subtarefa reaberta.'
                                  : 'Subtarefa concluída.',
                                `subtask-toggle-${item.id}`,
                              );
                            }}
                          />{' '}
                          {item.title}
                        </Label>
                        <p>
                          Posição {item.position + 1} de {data.items.length}
                        </p>
                        <div className="task-actions">
                          <Button
                            type="button"
                            onClick={() => {
                              setEditing({ id: item.id, title: item.title });
                              setEditError('');
                              setSuccess('');
                              setFocusId('subtask-edit-title');
                            }}
                          >
                            Editar {item.title}
                          </Button>
                          <Button
                            id={`subtask-delete-${item.id}`}
                            type="button"
                            onClick={() => {
                              setConfirmation({ kind: 'delete', item });
                              setSuccess('');
                            }}
                          >
                            Excluir {item.title}
                          </Button>
                          <Button
                            type="button"
                            aria-label={`Mover ${item.title} para cima`}
                            disabled={item.position === 0}
                            onClick={() => {
                              void move(item, -1);
                            }}
                          >
                            Mover para cima
                          </Button>
                          <Button
                            type="button"
                            aria-label={`Mover ${item.title} para baixo`}
                            disabled={item.position === data.items.length - 1}
                            onClick={() => {
                              void move(item, 1);
                            }}
                          >
                            Mover para baixo
                          </Button>
                        </div>
                      </CardContent>
                    </li>
                  </Card>
                ))}
              </ol>
            )}
            {editing && (
              <form
                className="task-form"
                aria-label="Editar subtarefa"
                noValidate
                onSubmit={async (event) => {
                  event.preventDefault();
                  const parsed = createSubtaskSchema.safeParse({
                    title: editing.title,
                  });
                  if (!parsed.success) {
                    setEditError('Informe um título de 1 a 160 caracteres.');
                    document.getElementById('subtask-edit-title')?.focus();
                    return;
                  }
                  if (
                    await run(
                      () =>
                        mutateSubtask(
                          task.id,
                          `/subtasks/${editing.id}`,
                          'PATCH',
                          parsed.data,
                        ),
                      'Subtarefa salva.',
                      `subtask-${editing.id}`,
                    )
                  )
                    setEditing(null);
                }}
              >
                <Label htmlFor="subtask-edit-title">Título da subtarefa</Label>
                <Input
                  id="subtask-edit-title"
                  maxLength={160}
                  value={editing.title}
                  aria-invalid={!!editError}
                  aria-describedby={
                    editError ? 'subtask-edit-error' : undefined
                  }
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                />
                {editError && <p id="subtask-edit-error">{editError}</p>}
                <div className="task-actions">
                  <Button type="submit">Salvar subtarefa</Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setFocusId(`subtask-${editing.id}`);
                      setEditing(null);
                    }}
                  >
                    Cancelar edição da subtarefa
                  </Button>
                </div>
              </form>
            )}
            <form
              className="task-form"
              aria-label="Adicionar subtarefa"
              noValidate
              onSubmit={async (event) => {
                event.preventDefault();
                const parsed = createSubtaskSchema.safeParse({ title });
                if (!parsed.success) {
                  setTitleError('Informe um título de 1 a 160 caracteres.');
                  document.getElementById('subtask-title')?.focus();
                  return;
                }
                setTitleError('');
                if (
                  await run(
                    () =>
                      mutateSubtask(task.id, '/subtasks', 'POST', parsed.data),
                    'Subtarefa adicionada.',
                    'subtask-title',
                  )
                )
                  setTitle('');
              }}
            >
              <Label htmlFor="subtask-title">Nova subtarefa</Label>
              <Input
                id="subtask-title"
                maxLength={160}
                value={title}
                aria-invalid={!!titleError}
                aria-describedby={
                  titleError ? 'subtask-title-error' : undefined
                }
                onChange={(event) => setTitle(event.target.value)}
              />
              {titleError && <p id="subtask-title-error">{titleError}</p>}
              <Button type="submit">
                {busy ? 'Aguarde…' : 'Adicionar subtarefa'}
              </Button>
            </form>
            {data.items.some((item) => !item.isCompleted) && (
              <Button
                id="subtask-complete"
                type="button"
                onClick={() => {
                  setSuccess('');
                  setConfirmation({ kind: 'complete' });
                }}
              >
                Concluir tarefa
              </Button>
            )}
          </FieldSet>
        </>
      )}
      {confirmation && (
        <TaskConfirmation
          returnFocusId={
            confirmation.kind === 'delete'
              ? `subtask-delete-${confirmation.item.id}`
              : 'subtask-complete'
          }
          title={
            confirmation.kind === 'delete'
              ? 'Excluir subtarefa?'
              : 'Concluir todas as subtarefas?'
          }
          description={
            confirmation.kind === 'delete'
              ? `“${confirmation.item.title}” será removida. A ordem e o progresso serão atualizados.`
              : 'Todas as subtarefas pendentes serão concluídas e a tarefa ficará concluída. Cancelar mantém os dados atuais.'
          }
          action={
            confirmation.kind === 'delete'
              ? 'Confirmar exclusão da subtarefa'
              : 'Confirmar conclusão'
          }
          onCancel={() => setConfirmation(null)}
          onConfirm={async () => {
            const deleted = confirmation.kind === 'delete';
            const path = deleted
              ? `/subtasks/${confirmation.item.id}`
              : '/complete-subtasks';
            if (
              await run(
                () =>
                  mutateSubtask(
                    task.id,
                    path,
                    deleted ? 'DELETE' : 'POST',
                    deleted ? {} : { confirm: true },
                  ),
                deleted
                  ? 'Subtarefa excluída.'
                  : 'Todas as subtarefas concluídas.',
                'subtask-title',
                true,
              )
            ) {
              setConfirmation(null);
              if (deleted) setEditing(null);
            }
          }}
        />
      )}
    </section>
  );
}
