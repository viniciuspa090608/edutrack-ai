import {
  Card,
  CardHeader,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import classroomLogo from './assets/google-classroom.png';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@study-platform/ui/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@study-platform/ui/components/ui/select';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import {
  classroomAuthorizationSchema,
  classroomRevocationSchema,
  classroomConnectionSchema,
  classroomCoursesSchema,
  classroomSelectionSchema,
  classroomOperationResultSchema,
  classroomConflictSchema,
  createSubjectSchema,
  newSubjectDefaults,
  defaultSubjectObjective,
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
  subjectsLoading,
  subjectsError,
  onChange,
}: {
  course: ClassroomCourse;
  value: ClassroomSelection['courses'][number]['destination'];
  subjects: StudySubject[];
  subjectsLoading: boolean;
  subjectsError: boolean;
  onChange: (
    value: ClassroomSelection['courses'][number]['destination'],
  ) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(() => {
    const subject =
      value.kind === 'new' ? value.subject : newSubjectDefaults(course.name);
    return {
      ...subject,
      weeklyHours: String(subject.weeklyHours),
      knownTopics: subject.knownTopics.join('\n'),
    };
  });
  const [mode, setMode] = useState(
    value.kind === 'existing' ? 'existing' : 'new',
  );
  const [editing, setEditing] = useState(value.kind !== 'new');
  const [automaticObjective, setAutomaticObjective] = useState(
    value.kind !== 'new',
  );
  const [error, setError] = useState('');
  function editDraft(field: keyof typeof draft, text: string) {
    setEditing(true);
    onChange({ kind: 'none' });
    if (field === 'objective') setAutomaticObjective(false);
    setDraft((current) => ({
      ...current,
      [field]: text,
      ...(field === 'name' && automaticObjective
        ? { objective: defaultSubjectObjective(text) }
        : {}),
    }));
  }
  return (
    <div className="classroom-destination">
      <Label htmlFor={id}>Disciplina de destino</Label>
      <Select
        value={mode}
        onValueChange={(key) => {
          setMode(key);
          setEditing(true);
          onChange({ kind: 'none' });
        }}
      >
        <SelectTrigger id={id} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="new">Criar nova disciplina</SelectItem>
          <SelectItem value="existing">Usar disciplina existente</SelectItem>
          <SelectItem value="none">Escolher depois</SelectItem>
        </SelectContent>
      </Select>
      {mode === 'existing' && (
        <>
          <Label htmlFor={id + '-existing'}>Disciplina cadastrada</Label>
          <Select
            disabled={subjectsLoading || subjectsError}
            value={
              value.kind === 'existing' ? value.subjectId : '__edutrack_empty__'
            }
            onValueChange={(subjectId) =>
              onChange({ kind: 'existing', subjectId })
            }
          >
            <SelectTrigger id={id + '-existing'} className="w-full min-w-0">
              <SelectValue placeholder="Selecione uma disciplina" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="__edutrack_empty__" disabled>
                Selecione uma disciplina
              </SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {subjectsLoading && <p role="status">Carregando disciplinas…</p>}
          {subjectsError && (
            <p>
              Não foi possível carregar as disciplinas. Use Tentar novamente
              para recarregar.
            </p>
          )}
          {!subjectsLoading && !subjectsError && !subjects.length && (
            <p>
              Nenhuma disciplina cadastrada disponível. Você pode criar uma
              nova.
            </p>
          )}
        </>
      )}
      {mode === 'new' && (
        <fieldset className="classroom-subject-fields">
          <legend>Revise os dados da disciplina</legend>
          {(
            [
              'name',
              'objective',
              'currentLevel',
              'dueDate',
              'weeklyHours',
            ] as const
          ).map((field) => (
            <Label key={field} data-field={field}>
              {
                {
                  name: 'Nome',
                  objective: 'Objetivo',
                  currentLevel: 'Nível',
                  dueDate: 'Prazo de estudo',
                  weeklyHours: 'Horas semanais',
                }[field]
              }
              {field === 'currentLevel' ? (
                <Select
                  value={draft.currentLevel}
                  onValueChange={(value) => editDraft(field, value)}
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
              ) : (
                <Input
                  type={
                    field === 'dueDate'
                      ? 'date'
                      : field === 'weeklyHours'
                        ? 'number'
                        : 'text'
                  }
                  required={field === 'name' || field === 'dueDate'}
                  maxLength={
                    field === 'name'
                      ? 120
                      : field === 'objective'
                        ? 1000
                        : undefined
                  }
                  min={field === 'weeklyHours' ? 0.5 : undefined}
                  max={field === 'weeklyHours' ? 168 : undefined}
                  step={field === 'weeklyHours' ? 0.5 : undefined}
                  value={draft[field]}
                  onChange={(event) => editDraft(field, event.target.value)}
                />
              )}
            </Label>
          ))}
          <Label className="classroom-field-wide">
            Assuntos conhecidos, um por linha
            <Textarea
              value={draft.knownTopics}
              onChange={(event) => editDraft('knownTopics', event.target.value)}
            />
          </Label>
          <Button
            className="classroom-field-wide"
            type="button"
            onClick={() => {
              const parsed = createSubjectSchema.safeParse({
                ...draft,
                weeklyHours: draft.weeklyHours.trim()
                  ? Number(draft.weeklyHours)
                  : undefined,
                knownTopics: draft.knownTopics
                  .split('\n')
                  .map((value) => value.trim())
                  .filter(Boolean),
              });
              if (!parsed.success) {
                setError(
                  'Revise nome, nível e prazo e os campos opcionais informados.',
                );
                return;
              }
              onChange({ kind: 'new', subject: parsed.data });
              setEditing(false);
              setError('');
            }}
          >
            Confirmar dados desta disciplina
          </Button>
          {value.kind === 'new' && !editing && (
            <p className="classroom-field-wide" role="status">
              Dados confirmados para importação.
            </p>
          )}
          {error && (
            <p className="classroom-field-wide" role="alert">
              {error}
            </p>
          )}
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
  embedded = false,
  origin = 'account',
}: {
  prefs: ModulePreferences | null;
  embedded?: boolean;
  origin?: 'account' | 'onboarding';
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
  const [showSelection, setShowSelection] = useState(false);
  const [tasksOnly, setTasksOnly] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    id: string;
    state: string;
    text: string;
  } | null>(null);
  const observedOperation = useRef<{ id: string; active: boolean } | null>(
    null,
  );
  const notified = useRef(new Set<string>());
  const generation = useRef(0);
  const connectButton = useRef<HTMLButtonElement>(null);
  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const status = classroomConnectionSchema.parse(
        await request(`${base}/connection`),
      );
      if (current !== generation.current) return;
      setConnection(status);
      if (status.state !== 'connected') {
        setResult(null);
        setNotification(null);
        observedOperation.current = null;
        setCourses([]);
        setSubjects([]);
        setSelection({ courses: [] });
        setTasksOnly([]);
        setShowSelection(false);
        return;
      }
      const latest = await request(`${base}/operations`);
      if (current !== generation.current) return;
      setResult(latest ? classroomOperationResultSchema.parse(latest) : null);
      if (status.state === 'connected') {
        const saved = classroomSelectionSchema.parse(
          await request(`${base}/selection`),
        );
        if (current !== generation.current) return;
        setSelection(saved);
        const page = classroomCoursesSchema.parse(
          await request(`${base}/courses`),
        );
        if (current !== generation.current) return;
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
        if (current !== generation.current) return;
        setSubjects(all);
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [prefs?.subjects]);
  useEffect(() => {
    void load().catch((cause) => setError(classroomError(cause)));
  }, [load]);
  const active =
    result?.operation.state === 'queued' ||
    result?.operation.state === 'running';
  useEffect(() => {
    if (!result || connection?.state !== 'connected') return;
    const { id, state } = result.operation;
    const previous = observedOperation.current;
    if (active) setNotification(null);
    if (
      !active &&
      previous?.id === id &&
      previous.active &&
      !notified.current.has(id)
    ) {
      notified.current.add(id);
      const text =
        state === 'completed'
          ? result.operation.processed === 0
            ? 'Importação concluída sem adições.'
            : 'Importação concluída.'
          : state === 'partial'
            ? 'Importação parcialmente concluída. Consulte as pendências no resumo.'
            : state === 'cancelled'
              ? 'Importação interrompida.'
              : 'A importação falhou. Consulte o resumo e tente novamente.';
      setNotification({ id, state, text });
    }
    observedOperation.current = { id, active };
  }, [result, active, connection?.state]);
  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 10000);
    return () => window.clearTimeout(timer);
  }, [notification]);
  useEffect(() => {
    if (result && !active) setShowSelection(false);
  }, [result?.operation.id, result?.operation.state, active]);
  useEffect(() => {
    if (!active || !result || connection?.state !== 'connected') return;
    const current = generation.current;
    let mounted = true;
    const timer = setInterval(() => {
      void request(`${base}/operations/${result.operation.id}`)
        .then((value) => {
          if (mounted && current === generation.current) {
            const data = classroomOperationResultSchema.parse(value);
            setResult(data);
            if (!['queued', 'running'].includes(data.operation.state))
              void load().catch((cause) => setError(classroomError(cause)));
          }
        })
        .catch((cause) => {
          if (mounted && current === generation.current)
            setError(classroomError(cause));
        });
    }, 2000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [active, result?.operation.id, load, connection?.state]);
  async function act(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
    } catch (cause) {
      setMessage('');
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
        await request(`${base}/connect`, 'POST', { purpose, origin }),
      );
      window.location.assign(value.url);
    });
  }
  function replace(
    courseId: string,
    destination: ClassroomSelection['courses'][number]['destination'],
  ) {
    setTasksOnly((value) => value.filter((id) => id !== courseId));
    setSelection((value) => ({
      courses: value.courses.map((course) =>
        course.courseId === courseId ? { ...course, destination } : course,
      ),
    }));
  }
  async function start() {
    const saved = classroomSelectionSchema.parse(selection);
    if (
      prefs?.subjects &&
      saved.courses.some(
        (course) =>
          course.destination.kind === 'none' &&
          (!prefs.tasks || !tasksOnly.includes(course.courseId)),
      )
    )
      throw new Error(
        'Escolha uma disciplina para cada matéria ou confirme importar somente tarefas nas matérias sem destino.',
      );
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
    setShowSelection(false);
  }
  async function selectAll() {
    const all = [...courses];
    let token = nextToken;
    const seen = new Set<string>();
    setMessage('Buscando todas as matérias ativas…');
    while (token) {
      if (seen.has(token))
        throw new Error(
          'Não foi possível concluir a seleção: a paginação não avançou. Tente novamente.',
        );
      seen.add(token);
      const page = classroomCoursesSchema.parse(
        await request(`${base}/courses?pageToken=${encodeURIComponent(token)}`),
      );
      all.push(...page.items);
      token = page.nextPageToken;
    }
    const unique = [
      ...new Map(
        all
          .filter((course) => course.state === 'ACTIVE')
          .map((course) => [course.id, course]),
      ).values(),
    ];
    setCourses(unique);
    setNextToken(null);
    setSelection((value) => ({
      courses: unique.map(
        (course) =>
          value.courses.find((item) => item.courseId === course.id) ?? {
            courseId: course.id,
            destination: { kind: 'none' },
            confirmDestinationChange: false,
            linkExistingTasks: false,
            restoreDeleted: false,
          },
      ),
    }));
    setMessage(
      'Todas as matérias ativas foram selecionadas. Revise os destinos antes de importar.',
    );
  }
  const Heading = embedded ? 'h3' : 'h2';
  const section = (
    <section
      tabIndex={-1}
      id="account-integrations"
      className={
        embedded
          ? 'classroom-section classroom-embedded'
          : 'account-card classroom-section'
      }
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
          <div className="classroom-title-row">
            <Heading id="classroom-title">
              {embedded ? 'Google Classroom' : 'Integrações · Google Classroom'}
            </Heading>
            {connection && (
              <span className="classroom-status" data-state={connection.state}>
                {!connection.available
                  ? 'Indisponível'
                  : connection.state === 'connected'
                    ? 'Conectado'
                    : connection.state === 'reconnect_required'
                      ? 'Reconexão necessária'
                      : 'Desconectado'}
              </span>
            )}
          </div>
          <p>
            Conecte para importar suas turmas e atividades. Seus fluxos manuais
            continuam disponíveis.
          </p>
          {connection?.state === 'connected' && connection.account && (
            <p>{connection.account.email}</p>
          )}
        </div>
        {connection?.available && (
          <div className="classroom-connection-row">
            <Button
              ref={connectButton}
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
          </div>
        )}
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
        {new URLSearchParams(window.location.search).get('classroom') ===
          'failed' && (
          <p role="alert">
            Não foi possível autorizar o Classroom. Tente conectar novamente ou
            continue sem importar.
          </p>
        )}
        {notification && connection?.state === 'connected' && (
          <div
            className="classroom-toast"
            data-state={notification.state}
            role="status"
            aria-live="polite"
          >
            <span>{notification.text}</span>
            <Button
              variant="outline"
              onClick={() => setNotification(null)}
              aria-label="Fechar notificação da importação"
            >
              Fechar
            </Button>
          </div>
        )}
        {!connection && !error && <p role="status">Carregando integração…</p>}
        {connection && !connection.available && (
          <p>
            A integração ainda não está configurada. Você pode conectar depois.
          </p>
        )}
        {connection?.available && (
          <>
            {confirmDisconnect && (
              <div role="group" aria-label="Confirmar desconexão">
                <p>
                  Interromper futuras importações e operações pendentes?
                  Disciplinas, tarefas e notas já salvas serão preservadas.
                </p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      const value = classroomRevocationSchema.parse(
                        await request(`${base}/connection`, 'DELETE'),
                      );
                      ++generation.current;
                      setResult(null);
                      setNotification(null);
                      observedOperation.current = null;
                      setCourses([]);
                      setSubjects([]);
                      setSelection({ courses: [] });
                      setTasksOnly([]);
                      setConnection((previous) =>
                        previous
                          ? {
                              ...previous,
                              state: 'disconnected',
                              account: null,
                            }
                          : previous,
                      );
                      setConfirmDisconnect(false);
                      connectButton.current?.focus();
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
            {connection.state === 'connected' &&
              result &&
              !active &&
              !showSelection && (
                <Button
                  variant="outline"
                  onClick={() => setShowSelection(true)}
                >
                  Alterar seleção de matérias
                </Button>
              )}
            {connection.state === 'connected' &&
              (!result || active || showSelection) && (
                <>
                  <h3>Turmas selecionadas</h3>
                  <Button
                    variant="link"
                    disabled={busy || active || loading || !courses.length}
                    onClick={() => void act(selectAll)}
                  >
                    Selecionar todas as matérias
                  </Button>
                  {!prefs?.tasks && !prefs?.subjects && (
                    <p>
                      Ative tarefas ou disciplinas nas preferências para
                      importar.
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
                                subjectsLoading={loading}
                                subjectsError={!!error}
                                onChange={(destination) =>
                                  replace(course.id, destination)
                                }
                              />
                              {selected.destination.kind === 'none' && (
                                <div>
                                  <p>
                                    Escolha uma disciplina existente ou preencha
                                    e confirme os dados de uma nova disciplina
                                    para importar esta matéria.
                                  </p>
                                  {prefs.tasks && (
                                    <Label>
                                      <Checkbox
                                        checked={tasksOnly.includes(course.id)}
                                        onCheckedChange={(checked) =>
                                          setTasksOnly((value) =>
                                            checked === true
                                              ? [...value, course.id]
                                              : value.filter(
                                                  (id) => id !== course.id,
                                                ),
                                          )
                                        }
                                      />
                                      Importar somente tarefas
                                    </Label>
                                  )}
                                </div>
                              )}
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
                                Confirmo a troca da disciplina de destino, caso
                                já exista associação
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
                                turma à disciplina escolhida
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
        {connection?.state === 'connected' && result && (
          <section
            className="classroom-result"
            aria-labelledby="classroom-result"
          >
            <h3 id="classroom-result">
              Importação:{' '}
              <span
                className="classroom-badge"
                data-outcome={result.operation.state}
              >
                {statusLabels[result.operation.state]}
              </span>
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
            <progress
              className="classroom-progress"
              aria-label="Progresso da importação"
              max={
                result.operation.total && result.operation.total > 0
                  ? result.operation.total
                  : undefined
              }
              value={
                result.operation.total && result.operation.total > 0
                  ? Math.min(result.operation.processed, result.operation.total)
                  : active
                    ? undefined
                    : 1
              }
              aria-valuetext={
                result.operation.total && result.operation.total > 0
                  ? undefined
                  : active
                    ? 'Total ainda não conhecido'
                    : 'Processamento finalizado'
              }
            />
            {result.operation.message && <p>{result.operation.message}</p>}
            <dl>
              {Object.entries(result.operation.counts).map(
                ([entity, count]) => (
                  <div key={entity}>
                    <dt>
                      {
                        {
                          subjects: 'Disciplinas',
                          tasks: 'Tarefas',
                        }[entity as 'subjects' | 'tasks']
                      }
                    </dt>
                    <dd>
                      <div className="classroom-badges">
                        {Object.entries(count).map(([outcome, total]) => (
                          <span
                            key={outcome}
                            className="classroom-badge"
                            data-outcome={outcome}
                          >
                            {total}{' '}
                            {
                              {
                                added: 'adicionadas',
                                updated: 'atualizadas',
                                unchanged: 'sem alteração',
                                ignored: 'ignoradas',
                                conflict: 'conflitos',
                                error: 'erros',
                              }[outcome]
                            }
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                ),
              )}
            </dl>
            {result.totalItems === 0 && !active && (
              <p>Nenhum conteúdo encontrado para processar.</p>
            )}
            <div className="classroom-actions">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Mais detalhes</Button>
                </DialogTrigger>
                <DialogContent className="classroom-details">
                  <DialogTitle>Detalhes da importação</DialogTitle>
                  <DialogDescription>
                    Confira os resultados por disciplina e tarefa. Itens
                    ignorados não foram importados; erros podem ser tentados
                    novamente.
                  </DialogDescription>
                  <p role="status">
                    Página {result.page} de{' '}
                    {Math.max(1, Math.ceil(result.totalItems / 20))} ·{' '}
                    {result.totalItems} itens no total
                  </p>
                  {(['subject', 'task', 'course'] as const)
                    .filter(
                      (entity) =>
                        entity !== 'course' ||
                        result.items.some((item) => item.entity === 'course'),
                    )
                    .map((entity) => (
                      <section key={entity}>
                        <h3>
                          {
                            {
                              subject: 'Disciplinas',
                              task: 'Tarefas',
                              course: 'Turmas com pendências',
                            }[entity]
                          }
                        </h3>
                        {!result.items.some(
                          (item) => item.entity === entity,
                        ) && <p>Nenhum item nesta página.</p>}
                        <ul>
                          {result.items
                            .filter((item) => item.entity === entity)
                            .map((item) => (
                              <li key={item.id}>
                                <strong>{item.title}</strong>{' '}
                                <span
                                  className="classroom-badge"
                                  data-outcome={item.outcome}
                                >
                                  {outcomeLabels[item.outcome]}
                                </span>
                                {item.reason && <p>{item.reason}</p>}
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
                      </section>
                    ))}
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
                  </div>
                </DialogContent>
              </Dialog>
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
                  Tentar novamente
                </Button>
              )}
            </div>
          </section>
        )}
      </CardContent>
    </section>
  );
  return embedded ? section : <Card asChild>{section}</Card>;
}
