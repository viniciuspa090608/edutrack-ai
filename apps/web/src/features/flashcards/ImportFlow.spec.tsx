import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { ImportAttempt, ImportPreview } from '@study-platform/contracts';
import { ImportFlow } from './ImportFlow.js';
import { FlashcardsPage } from './FlashcardsPage.js';
const id = '00000000-0000-4000-8000-000000000001',
  deckId = '00000000-0000-4000-8000-000000000002';
const root = `/decks/${deckId}/imports`,
  path = `${root}/${id}`;
let attempt: ImportAttempt, fail: string, lost: boolean, completed: boolean;
const imported = vi.fn(),
  closed = vi.fn();
const calls: Array<{
  path: string;
  method: string;
  body: unknown;
  query: string;
  contentType: string;
}> = [];
const preview: ImportPreview = {
  mapping: { frontColumn: 0, backColumn: 1 },
  counts: { records: 3, imported: 1, ignored: 1, rejected: 1 },
  sample: [
    {
      line: 2,
      front: '<img src=x onerror=alert(1)>',
      back: 'Resposta',
      status: 'imported',
    },
    { line: 3, front: 'Pergunta', back: 'Resposta', status: 'ignored' },
    {
      line: 4,
      front: '',
      back: 'Resposta',
      status: 'rejected',
      reason: 'Frente vazia.',
    },
  ],
  errors: [{ line: 4, reason: 'Frente vazia.' }],
};
beforeEach(() => {
  attempt = {
    id,
    deckId,
    state: 'uploaded',
    format: 'csv',
    columns: ['x', 'x'],
    records: 3,
    expiresAt: new Date(Date.now() + 900000).toISOString(),
  };
  fail = '';
  lost = false;
  completed = false;
  calls.length = 0;
  imported.mockReset();
  closed.mockReset();
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input),
        method = init?.method ?? 'GET';
      const body =
        typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
      calls.push({
        path: url.pathname,
        method,
        body,
        query: url.search,
        contentType:
          (init?.headers as Record<string, string>)?.['Content-Type'] ?? '',
      });
      const deck = {
        id: deckId,
        name: 'Baralho',
        description: null,
        subjectId: null,
        createdAt: '2026-09-27T01:00:00Z',
        updatedAt: '2026-09-27T01:00:00Z',
      };
      if (url.pathname === '/flashcard-decks')
        return Response.json({
          items: [deck],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        });
      if (url.pathname === `/flashcard-decks/${deckId}`)
        return Response.json(deck);
      if (url.pathname === `/flashcard-decks/${deckId}/cards`)
        return Response.json({
          items: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        });
      if (fail === method)
        return Response.json(
          { error: { code: 'INVALID_IMPORT_FILE' } },
          { status: 400 },
        );
      if (fail === 'expired')
        return Response.json(
          { error: { code: 'IMPORT_EXPIRED' } },
          { status: 410 },
        );
      if (url.pathname === root) {
        attempt = {
          ...attempt,
          format: url.searchParams.get('format') === 'tsv' ? 'tsv' : 'csv',
        } as ImportAttempt;
        return Response.json(attempt, { status: 201 });
      }
      if (url.pathname === `${path}/preview`) {
        attempt = {
          id,
          deckId,
          expiresAt: attempt.expiresAt,
          state: 'preview',
          format: 'csv',
          columns: ['x', 'x'],
          records: 3,
          preview: {
            ...preview,
            mapping: body,
            sample:
              body.frontColumn === 1
                ? preview.sample.map((row) => ({
                    ...row,
                    front: row.back,
                    back: row.front,
                  }))
                : preview.sample,
          },
        };
        return Response.json(attempt);
      }
      if (url.pathname === `${path}/confirm`) {
        completed = true;
        attempt = {
          id,
          deckId,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          state: 'completed',
          result: {
            counts: { records: 3, imported: 0, ignored: 2, rejected: 1 },
            errors: preview.errors,
          },
        };
        if (lost) {
          lost = false;
          throw new Error('Resposta perdida');
        }
        return Response.json(attempt);
      }
      if (url.pathname === path) {
        if (method === 'DELETE') return new Response(null, { status: 204 });
        return Response.json(attempt);
      }
      throw new Error(`Unexpected ${url.pathname}`);
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function open() {
  return render(
    <ImportFlow deckId={deckId} onImported={imported} onClose={closed} />,
  );
}
async function upload(format: 'csv' | 'tsv' = 'csv') {
  const interaction = userEvent.setup();
  await interaction.upload(
    screen.getByLabelText('Arquivo UTF-8'),
    new File(
      [format === 'csv' ? 'x,x\na,b' : 'x\tx\na\tb'],
      `cards.${format}`,
      { type: format === 'csv' ? 'text/csv' : 'text/tab-separated-values' },
    ),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Enviar arquivo' }),
  );
  await screen.findByLabelText('Coluna da frente');
  return interaction;
}
it.each(['csv', 'tsv'] as const)(
  'completes %s without AI with indexed repeated headers, plain text samples and three final counts',
  async (format) => {
    open();
    const interaction = await upload(format);
    expect(screen.getAllByRole('option', { name: '1: x' })).toHaveLength(2);
    expect(screen.getAllByRole('option', { name: '2: x' })).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: 'Confirmar importação' }),
    ).toBeNull();
    await interaction.click(
      screen.getByRole('button', { name: 'Pré-visualizar' }),
    );
    const table = await screen.findByRole('table');
    expect(
      within(table).getByText('<img src=x onerror=alert(1)>'),
    ).toBeTruthy();
    expect(table.querySelector('img')).toBeNull();
    expect(screen.getByText('Linha 4: Frente vazia.')).toBeTruthy();
    await interaction.click(
      screen.getByRole('button', { name: 'Voltar ao mapeamento' }),
    );
    await interaction.selectOptions(
      screen.getByLabelText('Coluna da frente'),
      '1',
    );
    await interaction.selectOptions(
      screen.getByLabelText('Coluna do verso'),
      '0',
    );
    await interaction.click(
      screen.getByRole('button', { name: 'Pré-visualizar' }),
    );
    await screen.findByRole('table');
    const confirm = screen.getByRole('button', {
      name: 'Confirmar importação',
    });
    confirm.focus();
    await interaction.keyboard('{Enter}');
    await screen.findByText(
      'Importação concluída. Estas são as contagens efetivas.',
    );
    expect(imported).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Importados').nextElementSibling?.textContent).toBe(
      '0',
    );
    expect(
      screen.getByText('Ignorados por duplicidade').nextElementSibling
        ?.textContent,
    ).toBe('2');
    expect(
      screen.getByText('Rejeitados por erro').nextElementSibling?.textContent,
    ).toBe('1');
    expect(calls[0]).toMatchObject({
      query: `?format=${format}`,
      contentType: format === 'csv' ? 'text/csv' : 'text/tab-separated-values',
    });
    expect(calls.some((call) => call.path.includes('/ai'))).toBe(false);
    await interaction.click(
      screen.getByRole('button', { name: 'Fechar resultado' }),
    );
    expect(closed).toHaveBeenCalled();
  },
);
it('rejects duplicate column choices before requesting preview and cancels without confirmation', async () => {
  open();
  const interaction = await upload();
  await interaction.selectOptions(
    screen.getByLabelText('Coluna do verso'),
    '0',
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Pré-visualizar' }),
  );
  await screen.findByText('Selecione duas colunas distintas do cabeçalho.');
  expect(calls.filter((call) => call.method === 'PUT')).toHaveLength(0);
  await interaction.click(
    screen.getByRole('button', { name: 'Cancelar importação' }),
  );
  await waitFor(() => expect(closed).toHaveBeenCalled());
  expect(completed).toBe(false);
  expect(calls.at(-1)?.method).toBe('DELETE');
});
it('preserves file/mapping on errors and shows size/format errors with retry', async () => {
  open();
  const interaction = userEvent.setup();
  await interaction.click(
    screen.getByRole('button', { name: 'Enviar arquivo' }),
  );
  await screen.findByText('Selecione um arquivo CSV ou TSV.');
  const input = screen.getByLabelText('Arquivo UTF-8') as HTMLInputElement;
  await interaction.upload(
    input,
    new File(['a'.repeat(2_097_153)], 'large.csv', { type: 'text/csv' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Enviar arquivo' }),
  );
  await screen.findByText('O arquivo deve ter no máximo 2 MiB.');
  expect(calls).toHaveLength(0);
  fail = 'POST';
  await interaction.upload(
    input,
    new File(['x,x\na,b'], 'cards.csv', { type: 'text/csv' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Enviar arquivo' }),
  );
  await screen.findByText(/Arquivo inválido/);
  expect(input.files?.[0]?.name).toBe('cards.csv');
  fail = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Enviar arquivo' }),
  );
  await screen.findByLabelText('Coluna da frente');
  fail = 'PUT';
  await interaction.click(
    screen.getByRole('button', { name: 'Pré-visualizar' }),
  );
  await screen.findByRole('alert');
  expect(
    (screen.getByLabelText('Coluna do verso') as HTMLSelectElement).value,
  ).toBe('1');
});
it('recovers a lost confirmation response by reading the same attempt without resubmitting', async () => {
  open();
  const interaction = await upload();
  await interaction.click(
    screen.getByRole('button', { name: 'Pré-visualizar' }),
  );
  await screen.findByRole('table');
  lost = true;
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar importação' }),
  );
  await screen.findByText('Resposta perdida');
  expect(completed).toBe(true);
  expect(
    screen.queryByRole('button', { name: 'Confirmar importação' }),
  ).toBeNull();
  await interaction.click(
    screen.getByRole('button', { name: 'Consultar estado final' }),
  );
  await screen.findByText(
    'Importação concluída. Estas são as contagens efetivas.',
  );
  expect(calls.filter((call) => call.path.endsWith('/confirm'))).toHaveLength(
    1,
  );
  expect(calls.at(-1)?.method).toBe('GET');
});
it('recovers a failed transaction as preview, allows retry and explains expired attempts', async () => {
  open();
  const interaction = await upload();
  await interaction.click(
    screen.getByRole('button', { name: 'Pré-visualizar' }),
  );
  await screen.findByRole('table');
  fail = 'POST';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar importação' }),
  );
  await screen.findByRole('alert');
  expect(completed).toBe(false);
  fail = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Consultar estado final' }),
  );
  await screen.findByRole('button', { name: 'Confirmar importação' });
  fail = 'expired';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar importação' }),
  );
  await screen.findByText('A tentativa expirou. Envie o arquivo novamente.');
  await interaction.click(
    screen.getByRole('button', { name: 'Voltar à seleção do arquivo' }),
  );
  expect(screen.getByLabelText('Arquivo UTF-8')).toBeTruthy();
});
it('returns focus to the import button after cancelling and after closing a result', async () => {
  render(<FlashcardsPage subjectsEnabled={false} />);
  const interaction = userEvent.setup();
  await interaction.click(
    await screen.findByRole('button', { name: 'Abrir Baralho' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Importar CSV ou TSV' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Cancelar importação' }),
  );
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Importar CSV ou TSV' }),
    ),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Importar CSV ou TSV' }),
  );
  await upload();
  await interaction.click(
    screen.getByRole('button', { name: 'Pré-visualizar' }),
  );
  await screen.findByRole('table');
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar importação' }),
  );
  await screen.findByText(
    'Importação concluída. Estas são as contagens efetivas.',
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Fechar resultado' }),
  );
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Importar CSV ou TSV' }),
    ),
  );
});
