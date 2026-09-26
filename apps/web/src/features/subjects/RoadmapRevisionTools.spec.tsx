import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { flattenRoadmap, sequenceBlocks } from '@study-platform/contracts';
import type {
  Roadmap,
  RoadmapRevision,
  RevisionPreview,
} from '@study-platform/contracts';
import { RoadmapRevisionTools } from './RoadmapRevisionTools.js';
import { RoadmapEditor } from './RoadmapEditor.js';
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
const original: Roadmap = {
  id: uuid(1),
  subjectId: uuid(2),
  title: 'SQL',
  description: 'Aprender SQL',
  revision: 2,
  createdAt: '2026-09-26T12:00:00Z',
  updatedAt: '2026-09-26T12:00:00Z',
  blocks: [
    {
      title: 'SQL básico',
      description: 'Comandos',
      steps: ['DDL', 'DQL', 'DML', 'TCL'].map((title, index) => ({
        id: uuid(index + 3),
        title,
        description: `Estudar ${title}`,
        completed: index === 0,
      })),
    },
  ],
};
const path = `/subjects/${original.subjectId}/roadmaps/${original.id}`;
let current: Roadmap,
  history: RoadmapRevision[],
  failed: string,
  candidate: RevisionPreview;
const calls: Array<{
  path: string;
  method: string;
  body: Record<string, unknown>;
}> = [];
const changed = vi.fn();
function snapshot(
  row: Roadmap,
  origin: RoadmapRevision['origin'] = 'manual',
  sourceRevision: number | null = null,
): RoadmapRevision {
  return {
    roadmapId: row.id,
    revision: row.revision,
    origin,
    sourceRevision,
    createdAt: row.updatedAt,
    content: {
      title: row.title,
      description: row.description,
      blocks: structuredClone(row.blocks),
    },
  };
}
beforeEach(() => {
  current = structuredClone(original);
  history = [
    snapshot(original),
    snapshot({
      ...original,
      revision: 1,
      blocks: original.blocks.map((block) => ({
        ...block,
        steps: block.steps.map((step) => ({ ...step, completed: false })),
      })),
    }),
  ];
  calls.length = 0;
  failed = '';
  changed.mockReset();
  const steps = flattenRoadmap(original);
  candidate = {
    roadmapId: original.id,
    baseRevision: 2,
    preservedCount: 2,
    steps: [
      steps[0]!,
      steps[2]!,
      { ...steps[1]!, id: uuid(10), title: 'Consulta revisada' },
      { ...steps[3]!, id: uuid(11), title: 'Transações revisadas' },
    ],
    origin: 'ia',
    sourceRevision: null,
    warnings: ['Revise a possível semelhança entre os passos 3 e 4.'],
    receipt: 'same-receipt',
    idempotencyKey: uuid(12),
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
  };
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input),
        route = url.pathname,
        method = init?.method ?? 'GET',
        body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}');
      calls.push({ path: route, method, body });
      if (failed === 'load' && method === 'GET') throw new Error('network');
      if (route.endsWith('/step-regenerations')) {
        if (failed === 'provider')
          return Response.json(
            { error: { code: 'AI_UNAVAILABLE' } },
            { status: 503 },
          );
        if (failed === 'invalid')
          return Response.json({ ...candidate, steps: [] });
        return Response.json(candidate);
      }
      if (route.endsWith('/restoration-previews')) {
        if (failed === 'incompatible')
          return Response.json(
            { error: { code: 'RESTORATION_INCOMPATIBLE' } },
            { status: 400 },
          );
        candidate = {
          ...candidate,
          origin: 'restauracao',
          sourceRevision: Number(body.sourceRevision),
          preservedCount: 1,
          steps: flattenRoadmap(original),
        };
        return Response.json(candidate);
      }
      if (route.endsWith('/revision-confirmations')) {
        if (failed === 'confirm') throw new Error('network');
        if (failed === 'conflict')
          return Response.json(
            { error: { code: 'REVISION_CONFLICT' } },
            { status: 409 },
          );
        if (failed === 'expired')
          return Response.json(
            { error: { code: 'RECEIPT_EXPIRED' } },
            { status: 400 },
          );
        current = {
          ...current,
          revision: current.revision + 1,
          blocks: sequenceBlocks(body.steps),
        };
        const saved = snapshot(
          current,
          candidate.origin,
          candidate.sourceRevision,
        );
        history = [saved, ...history];
        return Response.json(saved, { status: 201 });
      }
      if (route === `${path}/revisions`) {
        const page = Number(url.searchParams.get('page'));
        return Response.json({
          items: page === 1 ? history : [history[1]],
          page,
          pageSize: 10,
          total: 11,
          totalPages: 2,
        });
      }
      if (route.startsWith(`${path}/revisions/`))
        return Response.json(
          history.find(
            (item) => item.revision === Number(route.split('/').at(-1)),
          ),
        );
      if (route.includes('/steps/')) {
        current = {
          ...current,
          revision: current.revision + 1,
          blocks: current.blocks.map((block) => ({
            ...block,
            steps: block.steps.map((step) =>
              step.id === route.split('/').at(-1)
                ? { ...step, completed: body.completed }
                : step,
            ),
          })),
        };
        return Response.json(current);
      }
      throw new Error('unexpected request');
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const tools = (aiEnabled = true) => (
  <RoadmapRevisionTools
    roadmap={original}
    aiEnabled={aiEnabled}
    disabled={false}
    onChanged={changed}
  />
);
async function preview() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Reorganizar e regenerar passos' }),
  );
  screen.getByRole('button', { name: 'Subir DML' }).focus();
  await user.keyboard('{Enter}');
  await user.click(
    screen.getByRole('button', { name: 'Regenerar continuação' }),
  );
  await screen.findByRole('form', { name: 'Prévia da revisão' });
  return user;
}
it('allows keyboard movement only after the last completed step and preserves the active roadmap until confirmation', async () => {
  render(tools());
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Reorganizar e regenerar passos' }),
  );
  expect(screen.getByRole('button', { name: 'Subir DDL' })).toHaveProperty(
    'disabled',
    true,
  );
  expect(screen.getByRole('button', { name: 'Descer DDL' })).toHaveProperty(
    'disabled',
    true,
  );
  expect(screen.getByRole('button', { name: 'Subir DQL' })).toHaveProperty(
    'disabled',
    true,
  );
  screen.getByRole('button', { name: 'Subir DML' }).focus();
  await user.keyboard('{Enter}');
  await user.click(
    screen.getByRole('button', { name: 'Regenerar continuação' }),
  );
  await screen.findByRole('form', { name: 'Prévia da revisão' });
  expect(document.activeElement).toBe(
    screen.getByRole('heading', { name: 'Prévia da revisão' }),
  );
  expect(screen.getByText('DDL — preservado')).toBeTruthy();
  expect(screen.getByText('DML — preservado')).toBeTruthy();
  expect(current).toEqual(original);
  expect(history).toHaveLength(2);
  const sent = calls.find((call) => call.path.endsWith('/step-regenerations'))!;
  expect(sent.body).toEqual({
    baseRevision: 2,
    movedStepId: uuid(5),
    pendingOrder: [uuid(5), uuid(4), uuid(6)],
  });
});
it('edits and reorders suggestions, prevents duplicate titles, removes a suggestion and retries the same confirmation', async () => {
  render(tools());
  const user = await preview();
  fireEvent.change(screen.getByLabelText('Título do passo sugerido 3'), {
    target: { value: ' ｄｄｌ ' },
  });
  expect(screen.getByRole('alert').textContent).toContain('repetidos');
  expect(
    screen.getByRole('button', { name: 'Confirmar revisão' }),
  ).toHaveProperty('disabled', true);
  fireEvent.change(screen.getByLabelText('Título do passo sugerido 3'), {
    target: { value: 'Consulta editada' },
  });
  screen.getByRole('button', { name: 'Subir sugestão 4' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByLabelText('Título do passo sugerido 3')).toHaveProperty(
    'value',
    'Transações revisadas',
  );
  await user.click(screen.getByRole('button', { name: 'Remover sugestão 4' }));
  failed = 'confirm';
  await user.click(screen.getByRole('button', { name: 'Confirmar revisão' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'edição foi preservada',
  );
  expect(current).toEqual(original);
  failed = '';
  await user.click(screen.getByRole('button', { name: 'Confirmar revisão' }));
  await screen.findByText('Nova revisão confirmada.');
  expect(current.revision).toBe(3);
  expect(flattenRoadmap(current).map((step) => step.title)).toEqual([
    'DDL',
    'DML',
    'Transações revisadas',
  ]);
  expect(history).toHaveLength(3);
  const sends = calls.filter((call) =>
    call.path.endsWith('/revision-confirmations'),
  );
  expect(sends).toHaveLength(2);
  expect(sends[0]!.body).toEqual(sends[1]!.body);
  expect(changed).toHaveBeenCalledTimes(1);
});
it('cancels and discards previews on leaving or AI preference change without persistence', async () => {
  const { rerender, unmount } = render(tools());
  const user = await preview();
  await user.click(screen.getByRole('button', { name: 'Cancelar revisão' }));
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Reorganizar e regenerar passos' }),
  );
  expect(screen.queryByRole('form', { name: 'Prévia da revisão' })).toBeNull();
  await preview();
  rerender(tools(false));
  await waitFor(() =>
    expect(
      screen.queryByRole('form', { name: 'Prévia da revisão' }),
    ).toBeNull(),
  );
  expect(
    screen.queryByRole('button', { name: 'Reorganizar e regenerar passos' }),
  ).toBeNull();
  rerender(tools());
  await preview();
  unmount();
  expect(
    calls.some((call) => call.path.endsWith('/revision-confirmations')),
  ).toBe(false);
  expect(current).toEqual(original);
  expect(history).toHaveLength(2);
});
it('shows provider errors, rejects invalid previews, and explains conflict and expiry with retry or refresh', async () => {
  render(tools());
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Reorganizar e regenerar passos' }),
  );
  await user.click(screen.getByRole('button', { name: 'Subir DML' }));
  failed = 'provider';
  await user.click(
    screen.getByRole('button', { name: 'Regenerar continuação' }),
  );
  expect((await screen.findByRole('alert')).textContent).toContain(
    'indisponível',
  );
  failed = 'invalid';
  await user.click(
    screen.getByRole('button', { name: 'Regenerar continuação' }),
  );
  await screen.findByRole('alert');
  expect(screen.queryByRole('form', { name: 'Prévia da revisão' })).toBeNull();
  failed = '';
  await user.click(
    screen.getByRole('button', { name: 'Regenerar continuação' }),
  );
  await screen.findByRole('form', { name: 'Prévia da revisão' });
  failed = 'conflict';
  await user.click(screen.getByRole('button', { name: 'Confirmar revisão' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'roadmap mudou',
  );
  expect(
    screen.getByRole('button', { name: 'Confirmar revisão' }),
  ).toHaveProperty('disabled', true);
  await user.click(
    screen.getByRole('button', { name: 'Atualizar versão do roadmap' }),
  );
  expect(changed).toHaveBeenCalledOnce();
  failed = '';
  await preview();
  failed = 'expired';
  await user.click(screen.getByRole('button', { name: 'Confirmar revisão' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Confirmar revisão' }),
    ).toHaveProperty('disabled', true),
  );
  expect(
    screen
      .getAllByRole('alert')
      .map((item) => item.textContent)
      .join(' '),
  ).toContain('expirou');
  expect(current).toEqual(original);
});
it('paginates history, reads an immutable snapshot and explicitly restores with AI disabled', async () => {
  render(tools(false));
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Ver histórico' }));
  await screen.findByRole('button', { name: 'Consultar revisão 1' });
  await user.click(screen.getByRole('button', { name: 'Próximas revisões' }));
  await waitFor(() =>
    expect(calls.some((call) => call.path.endsWith('/revisions'))).toBe(true),
  );
  await user.click(
    await screen.findByRole('button', { name: 'Consultar revisão 1' }),
  );
  const selected = await screen.findByRole('region', {
    name: 'Revisão histórica',
  });
  expect(within(selected).getByText('DDL')).toBeTruthy();
  expect(document.activeElement).toBe(within(selected).getByRole('heading'));
  await user.click(
    screen.getByRole('button', { name: 'Preparar restauração' }),
  );
  await screen.findByRole('form', { name: 'Prévia da revisão' });
  expect(current.revision).toBe(2);
  await user.click(screen.getByRole('button', { name: 'Cancelar revisão' }));
  expect(history).toHaveLength(2);
  await user.click(
    screen.getByRole('button', { name: 'Preparar restauração' }),
  );
  await screen.findByRole('form', { name: 'Prévia da revisão' });
  await user.click(screen.getByRole('button', { name: 'Confirmar revisão' }));
  await screen.findByText('Nova revisão confirmada.');
  expect(history[0]).toMatchObject({
    revision: 3,
    origin: 'restauracao',
    sourceRevision: 1,
  });
  expect(flattenRoadmap(current)[0]).toEqual(flattenRoadmap(original)[0]);
  expect(history).toHaveLength(3);
  expect(calls.some((call) => call.path.endsWith('/step-regenerations'))).toBe(
    false,
  );
});
it('allows progress without AI and locks completed prefix fields in the manual editor', async () => {
  render(tools(false));
  const user = userEvent.setup();
  await user.click(screen.getByRole('checkbox', { name: 'Concluído: DQL' }));
  await screen.findByText('Progresso atualizado.');
  expect(flattenRoadmap(current)[1]!.completed).toBe(true);
  expect(current.revision).toBe(3);
  expect(changed).toHaveBeenCalledOnce();
  cleanup();
  render(<RoadmapEditor value={current} onChange={vi.fn()} disabled={false} />);
  expect(screen.getByLabelText('Título do bloco 1')).toHaveProperty(
    'readOnly',
    true,
  );
  expect(screen.getByRole('group', { name: 'Passo 1.1' })).toHaveProperty(
    'disabled',
    true,
  );
  expect(screen.getByRole('group', { name: 'Passo 1.2' })).toHaveProperty(
    'disabled',
    true,
  );
  expect(
    screen.getByRole('button', { name: 'Subir passo 1.3' }),
  ).toHaveProperty('disabled', true);
  expect(screen.getByRole('group', { name: 'Passo 1.3' })).toHaveProperty(
    'disabled',
    false,
  );
});
it('aborts a canceled generation and ignores its late response', async () => {
  render(tools());
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Reorganizar e regenerar passos' }),
  );
  await user.click(screen.getByRole('button', { name: 'Subir DML' }));
  let resolve: ((value: Response) => void) | undefined;
  let signal: AbortSignal | undefined;
  vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
    signal = init?.signal ?? undefined;
    return new Promise<Response>((done) => {
      resolve = done;
    });
  });
  await user.click(
    screen.getByRole('button', { name: 'Regenerar continuação' }),
  );
  await screen.findByText('Processando revisão…');
  await user.click(screen.getByRole('button', { name: 'Cancelar revisão' }));
  expect(signal?.aborted).toBe(true);
  resolve?.(Response.json(candidate));
  await waitFor(() =>
    expect(
      screen.queryByRole('form', { name: 'Prévia da revisão' }),
    ).toBeNull(),
  );
  expect(current).toEqual(original);
  expect(history).toHaveLength(2);
});
it('explains incompatible restoration and allows history retry after loading failure', async () => {
  render(tools(false));
  const user = userEvent.setup();
  failed = 'load';
  await user.click(screen.getByRole('button', { name: 'Ver histórico' }));
  await screen.findByRole('alert');
  failed = '';
  await user.click(
    screen.getByRole('button', { name: 'Tentar carregar histórico novamente' }),
  );
  await user.click(
    await screen.findByRole('button', { name: 'Consultar revisão 1' }),
  );
  failed = 'incompatible';
  await user.click(
    screen.getByRole('button', { name: 'Preparar restauração' }),
  );
  expect((await screen.findByRole('alert')).textContent).toContain(
    'incompatível',
  );
  expect(current).toEqual(original);
  expect(history).toHaveLength(2);
});
