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
      {busy && <p role="status">Carregando…</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <div className="routine-actions">
        <button disabled={busy} onClick={create}>
          Criar rotina
        </button>
        <button disabled={busy} onClick={() => void retry()}>
          Atualizar programação
        </button>
      </div>
      {editing && (
        <form onSubmit={(event) => void save(event)}>
          <h2>{id ? 'Editar rotina' : 'Nova rotina'}</h2>
          <label>
            Nome
            <input
              ref={nameField}
              value={name}
              required
              maxLength={120}
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Fuso horário
            <input
              value={timeZone}
              required
              aria-describedby="routine-zone-help"
              disabled={busy}
              onChange={(event) => setTimeZone(event.target.value)}
            />
          </label>
          <p id="routine-zone-help">
            Use um fuso IANA, como America/Sao_Paulo ou Europe/Lisbon. Alterar o
            fuso preserva as horas locais.
          </p>
          <p id="routine-slot-help">
            Início e fim devem estar no mesmo dia, com início anterior ao fim.
            Horários adjacentes são permitidos. Para atravessar a meia-noite,
            divida o planejamento em horários nos dois dias, dentro dos limites
            de cada dia.
          </p>
          {slots.map((slot, index) => (
            <fieldset
              key={index}
              aria-describedby="routine-slot-help"
              disabled={busy}
            >
              <legend>Horário {index + 1}</legend>
              <label>
                Dia da semana
                <select
                  value={slot.weekday}
                  onChange={(event) =>
                    change(index, { weekday: Number(event.target.value) })
                  }
                >
                  {days.map((day, i) => (
                    <option key={day} value={i + 1}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Início
                <input
                  type="time"
                  required
                  value={slot.startTime}
                  onChange={(event) =>
                    change(index, { startTime: event.target.value })
                  }
                />
              </label>
              <label>
                Fim
                <input
                  type="time"
                  required
                  value={slot.endTime}
                  onChange={(event) =>
                    change(index, { endTime: event.target.value })
                  }
                />
              </label>
              <button
                type="button"
                disabled={slots.length === 1}
                onClick={() => {
                  setSlots((items) => items.filter((_, i) => i !== index));
                  nameField.current?.focus();
                }}
              >
                Remover horário {index + 1}
              </button>
            </fieldset>
          ))}
          <div className="routine-actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => setSlots((items) => [...items, initialSlot()])}
            >
              Adicionar horário
            </button>
            <button disabled={busy} type="submit">
              Salvar rotina
            </button>
            <button
              disabled={busy}
              type="button"
              onClick={() => {
                setEditing(false);
                heading.current?.focus();
              }}
            >
              Cancelar edição
            </button>
          </div>
        </form>
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
                  <button
                    disabled={busy || !!deleting}
                    onClick={() => void edit(row)}
                    aria-label={`Editar ${row.name}`}
                  >
                    Editar
                  </button>
                  <button
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
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma rotina cadastrada. Crie sua primeira rotina.</p>
        ))}
      {deleting && (
        <div role="group" aria-label="Confirmar exclusão">
          <p>Excluir a rotina “{deleting.name}” e todos os seus horários?</p>
          <button
            autoFocus
            disabled={busy}
            onClick={() => {
              setDeleting(null);
              trigger.current?.focus();
            }}
          >
            Manter rotina
          </button>
          <button disabled={busy} onClick={() => void remove()}>
            Confirmar exclusão
          </button>
        </div>
      )}
      {list && list.totalPages > 1 && (
        <nav aria-label="Páginas de rotinas">
          <button
            disabled={busy || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page} de {list.totalPages}
          </span>
          <button
            disabled={busy || page >= list.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </button>
        </nav>
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
