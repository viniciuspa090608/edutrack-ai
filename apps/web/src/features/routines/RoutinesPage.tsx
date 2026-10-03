import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import { FieldSet, FieldLegend } from '@study-platform/ui/components/ui/field';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@study-platform/ui/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@study-platform/ui/components/ui/pagination';

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoutineSchema } from '@study-platform/contracts';
import type {
  RoutineSlot,
  StudyRoutine,
  RoutineList,
  RoutineSchedule,
} from '@study-platform/contracts';
import {
  listRoutines,
  routineSchedule,
  routineDetail,
  saveRoutine,
  deleteRoutine,
} from './routines-api.js';
import '../../styles/routines.css';

const days = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];
const initialSlot = (): RoutineSlot => ({
  weekday: 1,
  startTime: '08:00',
  endTime: '09:00',
});
export function RoutinesPage() {
  const [list, setList] = useState<RoutineList | null>(null);
  const [schedule, setSchedule] = useState<RoutineSchedule | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [timeZone, setTimeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );
  const [slots, setSlots] = useState<RoutineSlot[]>([initialSlot()]);
  const [deleting, setDeleting] = useState<StudyRoutine | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nameField = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const readVersion = useRef(0);
  useEffect(() => {
    if (!deleting && trigger.current) {
      trigger.current.focus();
      trigger.current = null;
    }
  }, [deleting]);
  const refresh = useCallback(async () => {
    const version = ++readVersion.current;
    const [rows, week] = await Promise.all([
      listRoutines(page),
      routineSchedule(),
    ]);
    if (version !== readVersion.current) return;
    if (page > 1 && rows.items.length === 0) {
      setPage(page - 1);
      return;
    }
    setList(rows);
    setSchedule(week);
  }, [page]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    void refresh()
      .catch(() => {
        if (active)
          setError('Não foi possível carregar as rotinas. Tente novamente.');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
      readVersion.current += 1;
    };
  }, [refresh]);
  useEffect(() => {
    if (editing) nameField.current?.focus();
  }, [editing]);
  async function retry() {
    setBusy(true);
    setError('');
    try {
      await refresh();
    } catch {
      setError('Não foi possível carregar as rotinas.');
    } finally {
      setBusy(false);
    }
  }
  function create() {
    setId(null);
    setName('');
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    setSlots([initialSlot()]);
    setError('');
    setMessage('');
    setEditing(true);
    nameField.current?.focus();
  }
  async function edit(row: StudyRoutine) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const value = await routineDetail(row.id);
      setId(value.id);
      setName(value.name);
      setTimeZone(value.timeZone);
      setSlots(value.slots);
      setEditing(true);
      nameField.current?.focus();
    } catch {
      setError('Não foi possível abrir a rotina para editar.');
    } finally {
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const parsed = createRoutineSchema.safeParse({ name, timeZone, slots });
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(' '));
      return;
    }
    setBusy(true);
    readVersion.current += 1;
    try {
      await saveRoutine(id, parsed.data);
    } catch {
      setError(
        'Não foi possível confirmar a gravação. Seus dados foram mantidos.',
      );
      setBusy(false);
      return;
    }
    setEditing(false);
    setMessage('Rotina salva.');
    heading.current?.focus();
    try {
      await refresh();
    } catch {
      setError(
        'A rotina foi salva, mas não foi possível atualizar a programação. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError('');
    setMessage('');
    readVersion.current += 1;
    try {
      await deleteRoutine(deleting.id);
    } catch {
      setError(
        'Não foi possível confirmar a exclusão. A programação foi mantida.',
      );
      setBusy(false);
      return;
    }
    if (id === deleting.id) setEditing(false);
    trigger.current = null;
    setDeleting(null);
    setMessage('Rotina excluída.');
    heading.current?.focus();
    try {
      await refresh();
    } catch {
      setError(
        'A rotina foi excluída, mas não foi possível atualizar a programação. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  function change(index: number, value: Partial<RoutineSlot>) {
    setSlots((items) =>
      items.map((item, i) => (i === index ? { ...item, ...value } : item)),
    );
  }
  return (
    <section className="routines-page" aria-busy={busy}>
      <h1 ref={heading} tabIndex={-1}>
        Rotinas de estudo
      </h1>
      <p>
        Planeje sua semana com horários locais recorrentes. Rotinas não criam
        tarefas nem iniciam Pomodoro.
      </p>
      {busy && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando…</p>
        </div>
      )}
      {error && !deleting && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && <p role="status">{message}</p>}
      <div className="routine-actions">
        <Button disabled={busy} onClick={create}>
          Criar rotina
        </Button>
        <Button disabled={busy} onClick={() => void retry()}>
          Atualizar programação
        </Button>
      </div>
      {editing && (
        <Card asChild>
          <form onSubmit={(event) => void save(event)}>
            <CardHeader>
              <h2>{id ? 'Editar rotina' : 'Nova rotina'}</h2>
            </CardHeader>
            <CardContent>
              <Label>
                Nome
                <Input
                  ref={nameField}
                  value={name}
                  required
                  maxLength={120}
                  disabled={busy}
                  onChange={(event) => setName(event.target.value)}
                />
              </Label>
              <Label>
                Fuso horário
                <Input
                  value={timeZone}
                  required
                  aria-describedby="routine-zone-help"
                  disabled={busy}
                  onChange={(event) => setTimeZone(event.target.value)}
                />
              </Label>
              <p id="routine-zone-help">
                Use um fuso IANA, como America/Sao_Paulo ou Europe/Lisbon.
                Alterar o fuso preserva as horas locais.
              </p>
              <p id="routine-slot-help">
                Início e fim devem estar no mesmo dia, com início anterior ao
                fim. Horários adjacentes são permitidos. Para atravessar a
                meia-noite, divida o planejamento em horários nos dois dias,
                dentro dos limites de cada dia.
              </p>
              {slots.map((slot, index) => (
                <FieldSet
                  key={index}
                  aria-describedby="routine-slot-help"
                  disabled={busy}
                >
                  <FieldLegend>Horário {index + 1}</FieldLegend>
                  <Label>
                    Dia da semana
                    <NativeSelect
                      value={slot.weekday}
                      onChange={(event) =>
                        change(index, { weekday: Number(event.target.value) })
                      }
                    >
                      {days.map((day, i) => (
                        <NativeSelectOption key={day} value={i + 1}>
                          {day}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Label>
                  <Label>
                    Início
                    <Input
                      type="time"
                      required
                      value={slot.startTime}
                      onChange={(event) =>
                        change(index, { startTime: event.target.value })
                      }
                    />
                  </Label>
                  <Label>
                    Fim
                    <Input
                      type="time"
                      required
                      value={slot.endTime}
                      onChange={(event) =>
                        change(index, { endTime: event.target.value })
                      }
                    />
                  </Label>
                  <Button
                    type="button"
                    disabled={slots.length === 1}
                    onClick={() => {
                      setSlots((items) => items.filter((_, i) => i !== index));
                      nameField.current?.focus();
                    }}
                  >
                    Remover horário {index + 1}
                  </Button>
                </FieldSet>
              ))}
              <div className="routine-actions">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => setSlots((items) => [...items, initialSlot()])}
                >
                  Adicionar horário
                </Button>
                <Button disabled={busy} type="submit">
                  Salvar rotina
                </Button>
                <Button
                  disabled={busy}
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    heading.current?.focus();
                  }}
                >
                  Cancelar edição
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}
      <h2>Minhas rotinas</h2>
      {list &&
        (list.items.length ? (
          <ul className="routine-list">
            {list.items.map((row) => (
              <li key={row.id}>
                <h3>{row.name}</h3>
                <p>Fuso: {row.timeZone}</p>
                <p>{row.slots.length} horário(s) semanal(is)</p>
                <div className="routine-actions">
                  <Button
                    disabled={busy || !!deleting}
                    onClick={() => void edit(row)}
                    aria-label={`Editar ${row.name}`}
                  >
                    Editar
                  </Button>
                  <Button
                    disabled={busy || !!deleting}
                    onClick={(event) => {
                      trigger.current = event.currentTarget;
                      setDeleting(row);
                      setError('');
                      setMessage('');
                    }}
                    aria-label={`Excluir ${row.name}`}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma rotina cadastrada. Crie sua primeira rotina.</p>
        ))}
      {deleting && (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open && !busy) setDeleting(null);
          }}
        >
          <AlertDialogContent
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              if (!busy) setDeleting(null);
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <AlertDialogTitle className="sr-only">
              Confirmar exclusão
            </AlertDialogTitle>
            <div role="group" aria-label="Confirmar exclusão">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <AlertDialogDescription asChild>
                <p>
                  Excluir a rotina “{deleting.name}” e todos os seus horários?
                </p>
              </AlertDialogDescription>
              <Button
                autoFocus
                disabled={busy}
                onClick={() => {
                  setDeleting(null);
                  trigger.current?.focus();
                }}
              >
                Manter rotina
              </Button>
              <Button disabled={busy} onClick={() => void remove()}>
                Confirmar exclusão
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {list && list.totalPages > 1 && (
        <Pagination aria-label="Páginas de rotinas">
          <PaginationContent className="flex-wrap">
            <PaginationItem>
              <Button
                disabled={busy || page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span>
                Página {page} de {list.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                disabled={busy || page >= list.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <h2>Programação semanal</h2>
      {schedule && (
        <div className="routine-week">
          {days.map((day, index) => (
            <section key={day} aria-label={day}>
              <h3>{day}</h3>
              {schedule.items.filter((item) => item.weekday === index + 1)
                .length ? (
                <ul>
                  {schedule.items
                    .filter((item) => item.weekday === index + 1)
                    .map((item, i) => (
                      <li key={`${item.routineId}-${i}`}>
                        <strong>{item.name}</strong>
                        <p>
                          {item.startTime}–{item.endTime}
                        </p>
                        <p>Fuso: {item.timeZone}</p>
                      </li>
                    ))}
                </ul>
              ) : (
                <p>Sem horários.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
