import { useState } from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { StudyTask, Subtask } from '@study-platform/contracts';
import { TasksPage } from './TasksPage.js';
import { SubtasksSection } from './SubtasksSection.js';
import { TaskProgress, progressLabel } from './TaskProgress.js';

let task: StudyTask;
let steps: Subtask[];
let failed = '';
let loadingPromise: Promise<Response> | null;
const requests: Array<{
  method: string;
  path: string;
  body: Record<string, unknown>;
}> = [];
const idFor = (number: number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const baseStep = (number: number, title: string): Subtask => ({
  id: idFor(number),
  taskId: idFor(1),
  title,
  isCompleted: false,
  position: number - 2,
  createdAt: '2026-09-26T12:00:00Z',
  updatedAt: '2026-09-26T12:00:00Z',
});
function envelope() {
  const completed = steps.filter((item) => item.isCompleted).length;
  task = {
    ...task,
    subtaskTotal: steps.length,
    subtaskCompleted: completed,
    progressPercent: steps.length ? (completed / steps.length) * 100 : null,
    status: !steps.length
      ? task.status
      : completed === 0
        ? 'PENDING'
        : completed === steps.length
          ? 'COMPLETED'
          : 'IN_PROGRESS',
  };
  return { items: steps.map((item) => ({ ...item })), task: { ...task } };
}
beforeEach(() => {
  task = {
    id: idFor(1),
    title: 'Prova',
    description: null,
    dueDate: null,
    priority: 'MEDIUM',
    status: 'PENDING',
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-09-26T12:00:00Z',
    subtaskTotal: 0,
    subtaskCompleted: 0,
    progressPercent: null,
  };
  steps = [];
  failed = '';
  loadingPromise = null;
  requests.length = 0;
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
      this.querySelector<HTMLButtonElement>('button')?.focus();
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      const method = init?.method ?? 'GET';
      const body = JSON.parse(
        typeof init?.body === 'string' ? init.body : '{}',
      ) as Record<string, unknown>;
      requests.push({ method, path, body });
      if (failed === method || failed === `${method} ${path}`)
        throw new Error('network');
      if (path.endsWith('/subtasks') && method === 'GET')
        return loadingPromise ?? Response.json(envelope());
      if (method === 'GET' && path === '/tasks') {
        envelope();
        return Response.json({
          items: [task],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        });
      }
      if (method === 'GET') {
        envelope();
        return Response.json(task);
      }
      if (path.endsWith('/subtasks') && method === 'POST')
        steps.push({
          ...baseStep(steps.length + 2, String(body.title)),
          id: idFor(steps.length + 100),
          position: steps.length,
        });
      else if (path.endsWith('/subtasks/order'))
        steps = (body.ids as string[]).map((id, position) => ({
          ...steps.find((item) => item.id === id)!,
          position,
        }));
      else if (path.endsWith('/complete-subtasks'))
        steps = steps.map((item) => ({ ...item, isCompleted: true }));
      else if (method === 'DELETE')
        steps = steps
          .filter((item) => item.id !== path.split('/').at(-1))
          .map((item, position) => ({ ...item, position }));
      else if (path.includes('/subtasks/'))
        steps = steps.map((item) =>
          item.id === path.split('/').at(-1)
            ? ({ ...item, ...body } as Subtask)
            : item,
        );
      else {
        task = { ...task, ...body } as StudyTask;
        envelope();
        return Response.json(task);
      }
      return Response.json(envelope(), {
        status: method === 'POST' && path.endsWith('/subtasks') ? 201 : 200,
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
function Harness() {
  const [value, setValue] = useState(task);
  return (
    <>
      <TaskProgress task={value} />
      <SubtasksSection task={value} onTaskChanged={setValue} />
    </>
  );
}
async function openDetail() {
  render(<TasksPage />);
  await userEvent
    .setup()
    .click(
      await screen.findByRole('button', { name: 'Ver detalhes de Prova' }),
    );
  await screen.findByLabelText('Nova subtarefa');
  return screen.getByRole('region', { name: 'Prova' });
}

it('distinguishes loading, failure/retry and no subtasks', async () => {
  failed = `GET /tasks/${task.id}/subtasks`;
  render(<Harness />);
  expect(screen.getByText('Carregando subtarefas…')).toBeTruthy();
  await screen.findByRole('alert');
  failed = '';
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Tentar carregar subtarefas' }));
  await screen.findByText('Sem subtarefas. Adicione o primeiro passo.');
  expect(screen.queryByRole('progressbar')).toBeNull();
});
it('creates, validates, edits and preserves entered titles after network failure', async () => {
  render(<Harness />);
  await screen.findByLabelText('Nova subtarefa');
  const interaction = userEvent.setup();
  const input = screen.getByLabelText('Nova subtarefa');
  await interaction.type(input, '   ');
  await interaction.keyboard('{Enter}');
  await screen.findByText('Informe um título de 1 a 160 caracteres.');
  expect(document.activeElement).toBe(input);
  await interaction.clear(input);
  await interaction.type(input, 'Ler capítulo');
  failed = 'POST';
  await interaction.keyboard('{Enter}');
  await screen.findByRole('alert');
  expect((input as HTMLInputElement).value).toBe('Ler capítulo');
  failed = '';
  await interaction.keyboard('{Enter}');
  await screen.findByText('Subtarefa adicionada.');
  expect(steps[0]!.title).toBe('Ler capítulo');
  await interaction.click(
    screen.getByRole('button', { name: 'Editar Ler capítulo' }),
  );
  expect(document.activeElement).toBe(
    screen.getByLabelText('Título da subtarefa'),
  );
  await interaction.clear(screen.getByLabelText('Título da subtarefa'));
  await interaction.type(
    screen.getByLabelText('Título da subtarefa'),
    'Ler capítulo 2',
  );
  await interaction.keyboard('{Enter}');
  await screen.findByText('Subtarefa salva.');
  expect(steps[0]!.title).toBe('Ler capítulo 2');
});
it('reorders by keyboard, announces position and preserves focus on the moved subtask after refresh', async () => {
  steps = [baseStep(2, 'A'), baseStep(3, 'B'), baseStep(4, 'C')];
  envelope();
  render(<Harness />);
  const interaction = userEvent.setup();
  const move = await screen.findByRole('button', { name: 'Mover C para cima' });
  move.focus();
  await interaction.keyboard('{Enter}');
  await screen.findByText('C: posição 2 de 3.');
  expect(steps.map((item) => item.title)).toEqual(['A', 'C', 'B']);
  await waitFor(() =>
    expect(document.activeElement?.id).toBe(`subtask-${idFor(4)}`),
  );
  expect(requests.find((item) => item.method === 'PUT')!.body).toEqual({
    ids: [idFor(2), idFor(4), idFor(3)],
  });
  cleanup();
  render(<Harness />);
  await screen.findByRole('checkbox', { name: 'C' });
  expect(
    screen
      .getAllByRole('checkbox')
      .map((element) => element.parentElement?.textContent?.trim()),
  ).toEqual(['A', 'C', 'B']);
});
it('derives partial/complete/reopened progress and restores manual status after the last removal', async () => {
  steps = [baseStep(2, 'A'), baseStep(3, 'B')];
  envelope();
  const detail = await openDetail();
  const interaction = userEvent.setup();
  await interaction.click(within(detail).getByRole('checkbox', { name: 'A' }));
  await within(detail).findByText('1 de 2 subtarefas concluídas (50%)', {
    selector: 'p',
  });
  await interaction.click(within(detail).getByRole('checkbox', { name: 'B' }));
  await within(detail).findByText('2 de 2 subtarefas concluídas (100%)', {
    selector: 'p',
  });
  await interaction.click(within(detail).getByRole('checkbox', { name: 'B' }));
  await within(detail).findByText('1 de 2 subtarefas concluídas (50%)', {
    selector: 'p',
  });
  await interaction.click(
    within(detail).getByRole('button', { name: 'Editar tarefa' }),
  );
  expect(screen.queryByLabelText('Status')).toBeNull();
  expect(screen.getByText(/Status calculado pelas subtarefas/)).toBeTruthy();
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar tarefa' }),
  );
  await screen.findByText('Tarefa salva.');
  expect(
    requests
      .filter(
        (item) => item.method === 'PATCH' && !item.path.includes('/subtasks'),
      )
      .at(-1)!.body,
  ).not.toHaveProperty('status');
  for (const title of ['A', 'B']) {
    await interaction.click(
      await screen.findByRole('button', { name: `Excluir ${title}` }),
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Confirmar exclusão da subtarefa' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  }
  await screen.findByText('Sem subtarefas. Adicione o primeiro passo.');
  expect(within(detail).queryByRole('progressbar')).toBeNull();
  await interaction.click(
    within(detail).getByRole('button', { name: 'Editar tarefa' }),
  );
  expect(screen.getByLabelText('Status')).toBeTruthy();
});
it('cancels deletion with focus restoration and deletes only after success', async () => {
  steps = [baseStep(2, 'A')];
  envelope();
  render(<Harness />);
  const interaction = userEvent.setup();
  const remove = await screen.findByRole('button', { name: 'Excluir A' });
  await interaction.click(remove);
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Cancelar' }),
  );
  await interaction.keyboard('{Enter}');
  expect(steps).toHaveLength(1);
  expect(requests.some((item) => item.method === 'DELETE')).toBe(false);
  expect(document.activeElement).toBe(remove);
  await interaction.click(remove);
  failed = 'DELETE';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar exclusão da subtarefa' }),
  );
  await screen.findByRole('alert');
  expect(steps).toHaveLength(1);
  expect(screen.queryByText('Subtarefa excluída.')).toBeNull();
  failed = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar exclusão da subtarefa' }),
  );
  await screen.findByText('Subtarefa excluída.');
  expect(steps).toHaveLength(0);
});
it('requests explicit batch confirmation, cancels without a mutation and retries after network failure', async () => {
  steps = [baseStep(2, 'A'), baseStep(3, 'B')];
  steps[0]!.isCompleted = true;
  envelope();
  render(<Harness />);
  const interaction = userEvent.setup();
  const complete = await screen.findByRole('button', {
    name: 'Concluir tarefa',
  });
  await interaction.click(complete);
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Cancelar' }),
  );
  await interaction.keyboard('{Enter}');
  expect(
    requests.some((item) => item.path.endsWith('/complete-subtasks')),
  ).toBe(false);
  expect(steps[1]!.isCompleted).toBe(false);
  await interaction.click(complete);
  failed = 'POST';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar conclusão' }),
  );
  await screen.findByRole('alert');
  expect(steps[1]!.isCompleted).toBe(false);
  expect(screen.queryByText('Todas as subtarefas concluídas.')).toBeNull();
  failed = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar conclusão' }),
  );
  await screen.findByText('Todas as subtarefas concluídas.');
  expect(steps.every((item) => item.isCompleted)).toBe(true);
  expect(
    requests.filter((item) => item.path.endsWith('/complete-subtasks')).at(-1)!
      .body,
  ).toEqual({ confirm: true });
  expect(screen.queryByRole('button', { name: 'Concluir tarefa' })).toBeNull();
});
it('never labels partial completion as 0% or 100% after display rounding', () => {
  expect(
    progressLabel({
      subtaskTotal: 20000,
      subtaskCompleted: 19999,
      progressPercent: 99.995,
    }),
  ).toBe('menos de 100%');
  expect(
    progressLabel({
      subtaskTotal: 20000,
      subtaskCompleted: 1,
      progressPercent: 0.005,
    }),
  ).toBe('mais de 0%');
  expect(
    progressLabel({
      subtaskTotal: 4,
      subtaskCompleted: 1,
      progressPercent: 25,
    }),
  ).toBe('25%');
  expect(
    progressLabel({
      subtaskTotal: 0,
      subtaskCompleted: 0,
      progressPercent: null,
    }),
  ).toBe('');
});
