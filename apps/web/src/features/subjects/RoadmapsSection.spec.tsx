import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type {
  RoadmapContent,
  RoadmapDraft,
  Roadmap,
  StudySubject,
} from '@study-platform/contracts';
import { RoadmapsSection } from './RoadmapsSection.js';
const id = '00000000-0000-4000-8000-000000000001';
const subject: StudySubject = {
  id,
  name: 'Álgebra',
  currentLevel: 'BEGINNER',
  objective: 'Aprender',
  dueDate: '2027-01-01',
  weeklyHours: 2,
  knownTopics: ['Somas'],
  planItems: [],
  createdAt: '2026-09-26T12:00:00Z',
  updatedAt: '2026-09-26T12:00:00Z',
};
const content: RoadmapContent = {
  title: 'Plano',
  description: 'Estudar',
  blocks: [
    {
      title: 'Primeiro',
      description: 'Base',
      steps: [
        { title: 'Ler', description: 'Capítulo' },
        { title: 'Praticar', description: 'Exercícios' },
      ],
    },
    {
      title: 'Segundo',
      description: 'Avançar',
      steps: [{ title: 'Projeto', description: 'Aplicar' }],
    },
  ],
};
const base = `/subjects/${id}`;
const calls: Array<{
  path: string;
  method: string;
  body: Record<string, unknown>;
}> = [];
let saved: Roadmap[];
function persisted(
  input: RoadmapDraft,
  roadmapId: string,
  revision = 1,
): Roadmap {
  let counter = 10;
  return {
    title: input.title,
    description: input.description,
    blocks: input.blocks.map((block) => ({
      ...block,
      steps: block.steps.map((step) => ({
        ...step,
        id:
          step.id ??
          `00000000-0000-4000-8000-${String(counter++).padStart(12, '0')}`,
        completed: step.completed ?? false,
      })),
    })),
    id: roadmapId,
    subjectId: id,
    revision,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}
let failed = '';
let invalid = false;
beforeEach(() => {
  calls.length = 0;
  saved = [];
  failed = '';
  invalid = false;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input),
        path = url.pathname,
        method = init?.method ?? 'GET';
      const body = JSON.parse(
        typeof init?.body === 'string' ? init.body : '{}',
      );
      calls.push({ path, method, body });
      if (failed === 'load' && method === 'GET') throw new Error('network');
      if (path === `${base}/roadmaps` && method === 'GET')
        return Response.json({
          items: saved,
          page: 1,
          pageSize: 20,
          total: saved.length,
          totalPages: saved.length ? 1 : 0,
        });
      if (path === `${base}/roadmap-generations`) {
        if (failed === 'provider')
          return Response.json(
            { error: { code: 'AI_UNAVAILABLE' } },
            { status: 503 },
          );
        return Response.json({
          subjectId: id,
          parameters: body,
          content: invalid ? { ...content, blocks: [] } : content,
          receipt: 'same-receipt',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        });
      }
      if (path === `${base}/roadmaps/confirm-ai`) {
        if (failed === 'confirm') throw new Error('network');
        if (failed === 'expired')
          return Response.json(
            { error: { code: 'RECEIPT_EXPIRED' } },
            { status: 400 },
          );
        const row = persisted(
          body.content as RoadmapDraft,
          '00000000-0000-4000-8000-000000000002',
        );
        saved = [...saved, row];
        return Response.json(row, { status: 201 });
      }
      if (method === 'DELETE') {
        saved = [];
        return new Response(null, { status: 204 });
      }
      if (method === 'POST' || method === 'PATCH') {
        if (failed === 'save') throw new Error('network');
        const row = persisted(
          body as RoadmapDraft,
          '00000000-0000-4000-8000-000000000003',
          method === 'PATCH' ? Number(body.baseRevision) + 1 : 1,
        );
        saved = [row];
        return Response.json(row, { status: 201 });
      }
      throw new Error('unexpected route');
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function preview() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Aprimorar com IA' }));
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByRole('form', { name: 'Revisar prévia' });
  return user;
}
it('keeps manual CRUD usable with AI disabled, preserves failed edits and confirms deletion', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <RoadmapsSection subject={subject} aiEnabled={false} />,
  );
  await screen.findByText(/Você ainda não tem roadmaps/);
  expect(screen.queryByRole('button', { name: 'Aprimorar com IA' })).toBeNull();
  await user.click(
    screen.getByRole('button', { name: 'Criar roadmap manual' }),
  );
  for (const [label, value] of [
    ['Título do roadmap', 'Manual'],
    ['Descrição do roadmap', 'Plano'],
    ['Título do bloco 1', 'Base'],
    ['Descrição do bloco 1', 'Ler'],
    ['Título do passo 1.1', 'Capítulo'],
    ['Descrição do passo 1.1', 'Exercitar'],
  ])
    fireEvent.change(screen.getByLabelText(label!), { target: { value } });
  failed = 'save';
  await user.click(screen.getByRole('button', { name: 'Salvar roadmap' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'edição foi preservada',
  );
  expect(screen.getByLabelText('Título do roadmap')).toHaveProperty(
    'value',
    'Manual',
  );
  failed = '';
  await user.click(screen.getByRole('button', { name: 'Salvar roadmap' }));
  await screen.findByText('Roadmap salvo.');
  await screen.findByRole('button', { name: 'Editar roadmap Manual' });
  await user.click(
    screen.getByRole('button', { name: 'Editar roadmap Manual' }),
  );
  fireEvent.change(screen.getByLabelText('Título do roadmap'), {
    target: { value: 'Revisado' },
  });
  await user.click(screen.getByRole('button', { name: 'Salvar roadmap' }));
  await screen.findByRole('button', { name: 'Excluir roadmap Revisado' });
  await user.click(
    screen.getByRole('button', { name: 'Excluir roadmap Revisado' }),
  );
  expect(saved).toHaveLength(1);
  await user.click(
    screen.getByRole('button', { name: 'Cancelar exclusão do roadmap' }),
  );
  expect(saved).toHaveLength(1);
  await user.click(
    screen.getByRole('button', { name: 'Excluir roadmap Revisado' }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Confirmar exclusão do roadmap' }),
  );
  await screen.findByText('Roadmap excluído.');
  expect(saved).toHaveLength(0);
  expect(
    calls.some((call) => /roadmap-generations|confirm-ai/.test(call.path)),
  ).toBe(false);
  rerender(<RoadmapsSection subject={subject} aiEnabled />);
  expect(screen.getByRole('button', { name: 'Aprimorar com IA' })).toBeTruthy();
});
it('validates all five parameters before generation, focuses errors and handles provider failures', async () => {
  const user = userEvent.setup();
  render(<RoadmapsSection subject={subject} aiEnabled />);
  await user.click(screen.getByRole('button', { name: 'Aprimorar com IA' }));
  fireEvent.change(screen.getByLabelText('Objetivo da geração'), {
    target: { value: '' },
  });
  fireEvent.change(screen.getByLabelText('Prazo da geração'), {
    target: { value: '2020-01-01' },
  });
  fireEvent.change(screen.getByLabelText('Horas semanais da geração'), {
    target: { value: '81' },
  });
  fireEvent.change(
    screen.getByLabelText('Assuntos conhecidos para a geração'),
    { target: { value: ' ' } },
  );
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  expect(screen.getAllByRole('alert')).toHaveLength(4);
  expect(document.activeElement).toBe(
    screen.getByLabelText('Objetivo da geração'),
  );
  expect(calls.some((call) => call.path.endsWith('roadmap-generations'))).toBe(
    false,
  );
  fireEvent.change(screen.getByLabelText('Objetivo da geração'), {
    target: { value: 'Aprender' },
  });
  fireEvent.change(screen.getByLabelText('Prazo da geração'), {
    target: { value: '2027-01-01' },
  });
  fireEvent.change(screen.getByLabelText('Horas semanais da geração'), {
    target: { value: '2' },
  });
  fireEvent.change(
    screen.getByLabelText('Assuntos conhecidos para a geração'),
    { target: { value: 'Somas' } },
  );
  failed = 'provider';
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'indisponível',
  );
  expect(screen.getByLabelText('Objetivo da geração')).toHaveProperty(
    'value',
    'Aprender',
  );
});
it('edits, adds, deletes and reorders blocks and steps by keyboard, confirms exact content and retries the same receipt', async () => {
  render(<RoadmapsSection subject={subject} aiEnabled />);
  const user = await preview();
  expect(saved).toHaveLength(0);
  const form = screen.getByRole('form', { name: 'Revisar prévia' });
  expect(within(form).getByText('Somas')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Título do roadmap'), {
    target: { value: 'Editado' },
  });
  screen.getByRole('button', { name: 'Subir bloco 2' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByLabelText('Título do bloco 1')).toHaveProperty(
    'value',
    'Segundo',
  );
  screen.getByRole('button', { name: 'Subir passo 2.2' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByLabelText('Título do passo 2.1')).toHaveProperty(
    'value',
    'Praticar',
  );
  await user.click(screen.getByRole('button', { name: 'Adicionar bloco' }));
  await user.click(screen.getByRole('button', { name: 'Excluir bloco 3' }));
  await user.click(
    screen.getByRole('button', { name: 'Adicionar passo ao bloco 1' }),
  );
  await user.click(screen.getByRole('button', { name: 'Excluir passo 1.2' }));
  failed = 'confirm';
  await user.click(screen.getByRole('button', { name: 'Salvar roadmap' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'edição foi preservada',
  );
  expect(screen.getByLabelText('Título do roadmap')).toHaveProperty(
    'value',
    'Editado',
  );
  failed = '';
  await user.click(screen.getByRole('button', { name: 'Salvar roadmap' }));
  await screen.findByText('Roadmap salvo.');
  const confirms = calls.filter((call) => call.path.endsWith('confirm-ai'));
  expect(confirms).toHaveLength(2);
  expect(confirms[0]!.body).toEqual(confirms[1]!.body);
  expect(confirms[1]!.body).toMatchObject({
    confirm: true,
    receipt: 'same-receipt',
    content: {
      title: 'Editado',
      blocks: [
        { title: 'Segundo', steps: [{ title: 'Projeto' }] },
        { title: 'Primeiro', steps: [{ title: 'Praticar' }, { title: 'Ler' }] },
      ],
    },
  });
  expect(saved).toHaveLength(1);
});
it('discards previews on cancel, unmount and disabled preference without confirmation', async () => {
  const { rerender, unmount } = render(
    <RoadmapsSection subject={subject} aiEnabled />,
  );
  const user = await preview();
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByRole('form', { name: 'Revisar prévia' })).toBeNull();
  await preview();
  rerender(<RoadmapsSection subject={subject} aiEnabled={false} />);
  await waitFor(() =>
    expect(screen.queryByRole('form', { name: 'Revisar prévia' })).toBeNull(),
  );
  expect(screen.queryByRole('button', { name: 'Aprimorar com IA' })).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Criar roadmap manual' }),
  ).toHaveProperty('disabled', false);
  rerender(<RoadmapsSection subject={subject} aiEnabled />);
  await preview();
  unmount();
  expect(calls.some((call) => call.path.endsWith('confirm-ai'))).toBe(false);
  expect(saved).toHaveLength(0);
});
it('never renders invalid provider output and explains receipt expiry while retaining edited content', async () => {
  const user = userEvent.setup();
  render(<RoadmapsSection subject={subject} aiEnabled />);
  invalid = true;
  await user.click(screen.getByRole('button', { name: 'Aprimorar com IA' }));
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByRole('alert');
  expect(screen.queryByRole('form', { name: 'Revisar prévia' })).toBeNull();
  invalid = false;
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByRole('form', { name: 'Revisar prévia' });
  fireEvent.change(screen.getByLabelText('Título do roadmap'), {
    target: { value: 'Conservar' },
  });
  failed = 'expired';
  await user.click(screen.getByRole('button', { name: 'Salvar roadmap' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Salvar roadmap' }),
    ).toHaveProperty('disabled', true),
  );
  expect(screen.getByLabelText('Título do roadmap')).toHaveProperty(
    'value',
    'Conservar',
  );
  expect(
    screen.getByRole('button', { name: 'Gerar novamente' }),
  ).toHaveProperty('disabled', false);
});
it('aborts generation on cancel and ignores a late provider response', async () => {
  const user = userEvent.setup();
  render(<RoadmapsSection subject={subject} aiEnabled />);
  await screen.findByText(/Você ainda não tem roadmaps/);
  let resolve: ((value: Response) => void) | undefined;
  let signal: AbortSignal | undefined;
  vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
    signal = init?.signal ?? undefined;
    return new Promise<Response>((done) => {
      resolve = done;
    });
  });
  await user.click(screen.getByRole('button', { name: 'Aprimorar com IA' }));
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByText('Gerando prévia…');
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(signal?.aborted).toBe(true);
  resolve?.(
    Response.json({
      subjectId: id,
      parameters: {
        currentLevel: 'BEGINNER',
        objective: 'Aprender',
        dueDate: '2027-01-01',
        weeklyHours: 2,
        knownTopics: [],
      },
      content,
      receipt: 'late',
      expiresAt: new Date(Date.now() + 10000).toISOString(),
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('form', { name: 'Revisar prévia' })).toBeNull(),
  );
  expect(saved).toHaveLength(0);
});
it('shows empty, loading failure and retry states for manual roadmaps', async () => {
  failed = 'load';
  const user = userEvent.setup();
  render(<RoadmapsSection subject={subject} aiEnabled={false} />);
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Não foi possível',
  );
  failed = '';
  await user.click(
    screen.getByRole('button', { name: 'Tentar carregar roadmaps novamente' }),
  );
  await screen.findByText(/Você ainda não tem roadmaps/);
});
