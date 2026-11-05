import {
  Card,
  CardHeader,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import classroomLogo from './assets/google-classroom.png';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@study-platform/ui/components/ui/select';
import { useCallback, useEffect, useId, useState } from 'react';

import {
  classroomAuthorizationSchema,
  classroomRevocationSchema,
  classroomConnectionSchema,
  classroomCoursesSchema,
  classroomSelectionSchema,
  classroomOperationResultSchema,
  classroomConflictSchema,
  createSubjectSchema,
} from '@study-platform/contracts';
import type {
  ClassroomConnection,
  ClassroomCourse,
  ClassroomSelection,
  ModulePreferences,
  StudySubject,
} from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import { Input } from '@study-platform/ui/components/ui/input';
import { Label } from '@study-platform/ui/components/ui/label';
import { Textarea } from '@study-platform/ui/components/ui/textarea';
import { Checkbox } from '@study-platform/ui/components/ui/checkbox';
import { listSubjects } from '../subjects/subjects-api.js';
import {
  classroomRequest as request,
  classroomPath as base,
  classroomError,
} from './classroom-api.js';
import '../../styles/classroom.css';

type Result = ReturnType<typeof classroomOperationResultSchema.parse>;
const statusLabels = {
  queued: 'Na fila',
  running: 'Em andamento',
  completed: 'Concluída',
  partial: 'Parcialmente concluída',
  failed: 'Falhou',
  cancelled: 'Interrompida',
};
const outcomeLabels = {
  added: 'Adicionado',
  updated: 'Atualizado',
  unchanged: 'Sem alteração',
  ignored: 'Ignorado',
  conflict: 'Conflito para revisar',
  error: 'Erro',
};
function SubjectDestination({
  course,
  value,
  subjects,
  onChange,
}: {
  course: ClassroomCourse;
  value: ClassroomSelection['courses'][number]['destination'];
  subjects: StudySubject[];
  onChange: (
    value: ClassroomSelection['courses'][number]['destination'],
  ) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState({
    name: value.kind === 'new' ? value.subject.name : course.name,
    currentLevel:
      value.kind === 'new' ? value.subject.currentLevel : 'BEGINNER',
    objective: value.kind === 'new' ? value.subject.objective : '',
    dueDate: value.kind === 'new' ? value.subject.dueDate : '',
    weeklyHours: value.kind === 'new' ? String(value.subject.weeklyHours) : '',
    knownTopics:
      value.kind === 'new' ? value.subject.knownTopics.join('\n') : '',
  });
  const [editing, setEditing] = useState(false),
    [error, setError] = useState('');
  function editDraft(field: keyof typeof draft, text: string) {
    setEditing(true);
    onChange({ kind: 'none' });
    setDraft((current) => ({ ...current, [field]: text }));
  }
  return (
    <div className="classroom-destination">
      <Label htmlFor={id}>Matéria para {course.name}</Label>
      <Select
        value={
          (editing
            ? 'new'
            : value.kind === 'existing'
              ? value.subjectId
              : value.kind === 'new'
                ? 'new'
                : 'none') || '__edutrack_empty__'
        }
        onValueChange={(selected) => {
          const key = selected === '__edutrack_empty__' ? '' : selected;
          setEditing(key === 'new');
          if (key === 'new') onChange({ kind: 'none' });
          if (key !== 'new')
            onChange(
              key === 'none'
                ? { kind: 'none' }
                : { kind: 'existing', subjectId: key },
            );
        }}
      >
        <SelectTrigger id={id} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="none">Escolher depois</SelectItem>
          <SelectItem value="new">Criar nova matéria</SelectItem>
          {subjects.map((subject) => (
            <SelectItem key={subject.id} value={subject.id}>
              {subject.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(editing || value.kind === 'new') && (
        <fieldset>
          <legend>Revise os dados da matéria</legend>
          {(['name', 'objective', 'dueDate', 'weeklyHours'] as const).map(
            (field) => (
              <Label key={field}>
                {
                  {
                    name: 'Nome',
                    objective: 'Objetivo',
                    dueDate: 'Prazo de estudo',
                    weeklyHours: 'Horas semanais',
                  }[field]
                }
                <Input
                  type={
                    field === 'dueDate'
                      ? 'date'
                      : field === 'weeklyHours'
                        ? 'number'
                        : 'text'
                  }
                  min={field === 'weeklyHours' ? 0.5 : undefined}
                  max={field === 'weeklyHours' ? 168 : undefined}
                  step={field === 'weeklyHours' ? 0.5 : undefined}
                  value={draft[field]}
                  onChange={(event) => editDraft(field, event.target.value)}
                />
              </Label>
            ),
          )}
          <Label>
            Nível
            <Select
              value={draft.currentLevel || '__edutrack_empty__'}
              onValueChange={(selected) =>
                editDraft(
                  'currentLevel',
                  selected === '__edutrack_empty__' ? '' : selected,
                )
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="BEGINNER">Iniciante</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediário</SelectItem>
                <SelectItem value="ADVANCED">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label>
            Assuntos conhecidos, um por linha
            <Textarea
              value={draft.knownTopics}
              onChange={(event) => editDraft('knownTopics', event.target.value)}
            />
          </Label>
          <Button
            type="button"
            onClick={() => {
              const parsed = createSubjectSchema.safeParse({
                ...draft,
                weeklyHours: Number(draft.weeklyHours),
                knownTopics: draft.knownTopics
                  .split('\n')
                  .map((value) => value.trim())
                  .filter(Boolean),
              });
              if (!parsed.success) {
                setError(
                  'Preencha nome, objetivo, nível, prazo e horas semanais válidos.',
                );
                return;
              }
              onChange({ kind: 'new', subject: parsed.data });
              setEditing(false);
              setError('');
            }}
          >
            Confirmar dados desta matéria
          </Button>
          {value.kind === 'new' && !editing && (
            <p role="status">Dados confirmados para importação.</p>
          )}
          {error && <p role="alert">{error}</p>}
        </fieldset>
      )}
    </div>
  );
}
function ConflictReview({
  entity,
  localId,
  conflictId,
  onResolved,
}: {
  entity: string;
  localId: string;
  conflictId: string;
  onResolved: () => void;
}) {
  const [conflict, setConflict] = useState<ReturnType<
      typeof classroomConflictSchema.parse
    > | null>(null),
    [error, setError] = useState('');
  const module = entity === 'subject' ? 'subjects' : 'tasks';
  return (
    <div>
      <Button
        variant="outline"
        onClick={() => {
          void request(`/${module}/${localId}/classroom-source`)
            .then((value) => {
              const entries = Array.isArray(value) ? value : [value];
              const found = entries.find((entry) => entry?.id === conflictId);
              setConflict(classroomConflictSchema.parse(found?.conflict));
            })
            .catch((cause) => setError(classroomError(cause)));
        }}
      >
        Revisar conflito
      </Button>
      {conflict && (
        <div>
          <dl>
            {conflict.fields.map((field) => (
              <div key={field.field}>
                <dt>{field.field}</dt>
                <dd>Seu valor: {field.local ?? 'Sem valor'}</dd>
                <dd>Classroom: {field.remote ?? 'Sem valor'}</dd>
              </div>
            ))}
          </dl>
          {(['keep_local', 'accept_remote'] as const).map((choice) => (
            <Button
              key={choice}
              onClick={() => {
                void request(
                  `/${module}/classroom-conflicts/${conflictId}`,
                  'POST',
                  { revision: conflict.revision, choice },
                )
                  .then(() => {
                    setConflict(null);
                    onResolved();
                  })
                  .catch((cause) => setError(classroomError(cause)));
              }}
            >
              {choice === 'keep_local'
                ? 'Confirmar: manter meu valor'
                : 'Confirmar: aceitar valor do Classroom'}
            </Button>
          ))}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function ClassroomSection({
  prefs,
}: {
  prefs: ModulePreferences | null;
}) {
  const [connection, setConnection] = useState<ClassroomConnection | null>(
      null,
    ),
    [courses, setCourses] = useState<ClassroomCourse[]>([]),
    [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [selection, setSelection] = useState<ClassroomSelection>({
      courses: [],
    }),
    [nextToken, setNextToken] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [restoreDeleted, setRestoreDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = classroomConnectionSchema.parse(
        await request(`${base}/connection`),
      );
      setConnection(status);
      const latest = await request(`${base}/operations`);
      setResult(latest ? classroomOperationResultSchema.parse(latest) : null);
      if (status.state === 'connected') {
        setSelection(
          classroomSelectionSchema.parse(await request(`${base}/selection`)),
        );
        const page = classroomCoursesSchema.parse(
          await request(`${base}/courses`),
        );
        setCourses(page.items);
        setNextToken(page.nextPageToken);
      }
      if (prefs?.subjects && status.state === 'connected') {
        let page = 1;
        const all: StudySubject[] = [];
        while (true) {
          const data = await listSubjects(page, 100);
          all.push(...data.items);
          if (page >= data.totalPages) break;
          page++;
        }
        setSubjects(all);
      }
    } finally {
      setLoading(false);
    }
  }, [prefs?.subjects]);
  useEffect(() => {
    void load().catch((cause) => setError(classroomError(cause)));
  }, [load]);
  const active =
    result?.operation.state === 'queued' ||
    result?.operation.state === 'running';
  useEffect(() => {
    if (!active || !result) return;
    let mounted = true;
    const timer = setInterval(() => {
      void request(`${base}/operations/${result.operation.id}`)
        .then((value) => {
          if (mounted) {
            const data = classroomOperationResultSchema.parse(value);
            setResult(data);
            if (!['queued', 'running'].includes(data.operation.state))
              void load().catch((cause) => setError(classroomError(cause)));
          }
        })
        .catch((cause) => {
          if (mounted) setError(classroomError(cause));
        });
    }, 2000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [active, result?.operation.id, load]);
  async function act(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível concluir.',
      );
    } finally {
      setBusy(false);
    }
  }
  function connect(purpose: 'import' | 'teacher') {
    void act(async () => {
      const value = classroomAuthorizationSchema.parse(
        await request(`${base}/connect`, 'POST', { purpose }),
      );
      window.location.assign(value.url);
    });
  }
  function replace(
    courseId: string,
    destination: ClassroomSelection['courses'][number]['destination'],
  ) {
    setSelection((value) => ({
      courses: value.courses.map((course) =>
        course.courseId === courseId ? { ...course, destination } : course,
      ),
    }));
  }
  async function start() {
    const saved = classroomSelectionSchema.parse(selection);
    await request(`${base}/selection`, 'PUT', saved);
    setResult(
      classroomOperationResultSchema.parse(
        await request(`${base}/imports`, 'POST', {
          requestId: crypto.randomUUID(),
          restoreDeleted,
          courseIds: saved.courses.map((course) => course.courseId),
        }),
      ),
    );
  }
  return (
    <Card asChild>
      <section
        tabIndex={-1}
        id="account-integrations"
        className="account-card classroom-section"
        aria-labelledby="classroom-title"
      >
        <CardHeader>
          <img
            className="classroom-logo"
            src={classroomLogo}
            alt=""
            width={48}
            height={48}
          />
          <div>
            <h2 id="classroom-title">Integrações · Google Classroom</h2>
            <p>
              Conecte para importar suas turmas e atividades. Seus fluxos
              manuais continuam disponíveis.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {new URLSearchParams(window.location.search).get('classroom') ===
            'failed' && (
            <p role="alert">
              A autorização não foi concluída. Você pode continuar ou tentar
              conectar novamente.
            </p>
          )}
          {error && (
            <p role="alert">
              {error}{' '}
              <Button variant="outline" onClick={() => void act(load)}>
                Tentar novamente
              </Button>
            </p>
          )}
          {message && <p role="status">{message}</p>}
          {!connection && !error && <p role="status">Carregando integração…</p>}
          {connection && !connection.available && (
            <p>
              A integração ainda não está configurada. Você pode conectar
              depois.
            </p>
          )}
          {connection?.available && (
            <>
              <p>
                Conexão:{' '}
                {connection.state === 'connected'
                  ? 'Conectada'
                  : connection.state === 'reconnect_required'
                    ? 'Reconexão necessária'
                    : 'Desconectada'}
                {connection.account ? ` · ${connection.account.email}` : ''}
              </p>
              <Button
                disabled={busy || active}
                onClick={() => connect('import')}
              >
                {connection.state === 'disconnected'
                  ? 'Conectar Google Classroom'
                  : 'Reconectar conta'}
              </Button>
              {connection.state !== 'disconnected' && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirmDisconnect(true)}
                >
                  Desconectar
                </Button>
              )}
              {confirmDisconnect && (
                <div role="group" aria-label="Confirmar desconexão">
                  <p>
                    Interromper futuras importações e operações pendentes?
                    Matérias, tarefas e notas já salvas serão preservadas.
                  </p>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void act(async () => {
                        const value = classroomRevocationSchema.parse(
                          await request(`${base}/connection`, 'DELETE'),
                        );
                        setConfirmDisconnect(false);
                        await load();
                        setMessage(
                          value.revocationConfirmed
                            ? 'Integração desconectada.'
                            : 'Integração desconectada localmente. Não foi possível confirmar a revogação no Google; revise o acesso na sua conta Google.',
                        );
                      })
                    }
                  >
                    Confirmar desconexão
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDisconnect(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              {connection.state === 'connected' && (
                <>
                  <h3>Turmas selecionadas</h3>
                  {!prefs?.tasks && !prefs?.subjects && (
                    <p>
                      Ative tarefas ou matérias nas preferências para importar.
                    </p>
                  )}
                  {loading && (
                    <p role="status">Carregando turmas e associações…</p>
                  )}
                  {courses.length === 0 && !loading && !error && (
                    <p>Nenhuma turma acessível encontrada nesta conta.</p>
                  )}
                  <div className="classroom-courses">
                    {courses.map((course) => {
                      const selected = selection.courses.find(
                        (item) => item.courseId === course.id,
                      );
                      return (
                        <fieldset key={course.id} disabled={busy || active}>
                          <legend>
                            <Label>
                              <Checkbox
                                checked={!!selected}
                                disabled={busy || active || loading}
                                onCheckedChange={(checked) =>
                                  setSelection((value) => ({
                                    courses: checked
                                      ? [
                                          ...value.courses,
                                          {
                                            courseId: course.id,
                                            destination: { kind: 'none' },
                                            confirmDestinationChange: false,
                                            linkExistingTasks: false,
                                            restoreDeleted: false,
                                          },
                                        ]
                                      : value.courses.filter(
                                          (item) => item.courseId !== course.id,
                                        ),
                                  }))
                                }
                              />
                              {course.name}
                              {course.section ? ` · ${course.section}` : ''}
                            </Label>
                          </legend>
                          {course.link && (
                            <a
                              href={course.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir turma no Classroom
                            </a>
                          )}
                          {selected && prefs?.subjects && (
                            <>
                              <SubjectDestination
                                course={course}
                                value={selected.destination}
                                subjects={subjects}
                                onChange={(destination) =>
                                  replace(course.id, destination)
                                }
                              />
                              <Label>
                                <Checkbox
                                  checked={selected.confirmDestinationChange}
                                  onCheckedChange={(checked) =>
                                    setSelection((value) => ({
                                      courses: value.courses.map((item) =>
                                        item.courseId === course.id
                                          ? {
                                              ...item,
                                              confirmDestinationChange:
                                                checked === true,
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                />
                                Confirmo a troca da matéria de destino, caso já
                                exista associação
                              </Label>
                              <Label>
                                <Checkbox
                                  checked={selected.linkExistingTasks}
                                  onCheckedChange={(checked) =>
                                    setSelection((value) => ({
                                      courses: value.courses.map((item) =>
                                        item.courseId === course.id
                                          ? {
                                              ...item,
                                              linkExistingTasks:
                                                checked === true,
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                />
                                Vincular também as tarefas já importadas desta
                                turma à matéria escolhida
                              </Label>
                            </>
                          )}
                        </fieldset>
                      );
                    })}
                  </div>
                  {nextToken && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          const page = classroomCoursesSchema.parse(
                            await request(
                              `${base}/courses?pageToken=${encodeURIComponent(nextToken)}`,
                            ),
                          );
                          setCourses((value) => [
                            ...value,
                            ...page.items.filter(
                              (course) =>
                                !value.some(
                                  (existing) => existing.id === course.id,
                                ),
                            ),
                          ]);
                          setNextToken(page.nextPageToken);
                        })
                      }
                    >
                      Mais turmas
                    </Button>
                  )}
                  <Label>
                    <Checkbox
                      checked={restoreDeleted}
                      onCheckedChange={(checked) =>
                        setRestoreDeleted(checked === true)
                      }
                    />
                    Confirmo restaurar registros excluídos localmente nesta nova
                    solicitação
                  </Label>
                  <div className="classroom-actions">
                    <Button
                      disabled={
                        busy ||
                        active ||
                        !selection.courses.length ||
                        (!prefs?.tasks && !prefs?.subjects)
                      }
                      onClick={() => void act(() => start())}
                    >
                      Importar seleção
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || active}
                      onClick={() =>
                        void act(async () => {
                          await request(`${base}/selection`, 'PUT', selection);
                          setMessage(
                            'Seleção salva. Nenhuma importação iniciada.',
                          );
                        })
                      }
                    >
                      Salvar seleção
                    </Button>
                    {!connection.permissions.teacherCoursework && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => connect('teacher')}
                      >
                        Autorizar atividades de turmas que ensino
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
          {result && (
            <section aria-labelledby="classroom-result">
              <h3 id="classroom-result">
                Importação: {statusLabels[result.operation.state]}
              </h3>
              <p role="status" aria-live="polite">
                {result.operation.phase === 'finished'
                  ? 'Processamento finalizado'
                  : {
                      queued: 'Aguardando processamento',
                      discovering: 'Localizando conteúdos',
                      importing: 'Importando registros',
                    }[result.operation.phase]}{' '}
                · {result.operation.processed} itens processados
                {result.operation.total === null
                  ? ''
                  : ` de ${result.operation.total}`}
              </p>
              {result.operation.message && <p>{result.operation.message}</p>}
              <dl>
                {Object.entries(result.operation.counts).map(
                  ([entity, count]) => (
                    <div key={entity}>
                      <dt>
                        {
                          {
                            subjects: 'Matérias',
                            tasks: 'Tarefas',
                          }[entity as 'subjects' | 'tasks']
                        }
                      </dt>
                      <dd>
                        {count.added} adicionadas · {count.updated} atualizadas
                        · {count.unchanged} sem alteração · {count.ignored}{' '}
                        ignoradas · {count.conflict} conflitos · {count.error}{' '}
                        erros
                      </dd>
                    </div>
                  ),
                )}
              </dl>
              {result.totalItems === 0 && !active && (
                <p>Nenhum conteúdo encontrado para processar.</p>
              )}
              <ul>
                {result.items.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>: {outcomeLabels[item.outcome]}
                    {item.reason ? ` — ${item.reason}` : ''}
                    {item.conflictId && item.localId && (
                      <ConflictReview
                        entity={item.entity}
                        localId={item.localId}
                        conflictId={item.conflictId}
                        onResolved={() =>
                          setMessage(
                            'Conflito resolvido. Sua decisão foi salva.',
                          )
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
              <div className="classroom-actions">
                {result.page > 1 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      void act(async () =>
                        setResult(
                          classroomOperationResultSchema.parse(
                            await request(
                              `${base}/operations/${result.operation.id}?page=${result.page - 1}`,
                            ),
                          ),
                        ),
                      )
                    }
                  >
                    Resultados anteriores
                  </Button>
                )}
                {result.page * 20 < result.totalItems && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      void act(async () =>
                        setResult(
                          classroomOperationResultSchema.parse(
                            await request(
                              `${base}/operations/${result.operation.id}?page=${result.page + 1}`,
                            ),
                          ),
                        ),
                      )
                    }
                  >
                    Mais resultados
                  </Button>
                )}
                {['partial', 'failed'].includes(result.operation.state) && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void act(async () =>
                        setResult(
                          classroomOperationResultSchema.parse(
                            await request(
                              `${base}/operations/${result.operation.id}/retry`,
                              'POST',
                              {},
                            ),
                          ),
                        ),
                      )
                    }
                  >
                    Tentar novamente os itens pendentes
                  </Button>
                )}
              </div>
            </section>
          )}
        </CardContent>{' '}
      </section>
    </Card>
  );
}
