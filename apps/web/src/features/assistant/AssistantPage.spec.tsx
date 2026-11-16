import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { AssistantPage } from './AssistantPage.js';
import { AuthApiError } from '../auth/auth-api.js';
import * as api from './assistant-api.js';

vi.mock('./assistant-api.js');
const prefs = { tasks: true, subjects: false, flashcards: false, ai: true };
const createdAt = '2026-11-15T23:00:00.000Z';
const conversation = {
  id: '00000000-0000-4000-8000-000000000001',
  updatedAt: createdAt,
};
const empty = { items: [], cursor: null };

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('preenche uma sugestão com o teclado e espera a confirmação do envio', async () => {
  vi.mocked(api.assistantConversations).mockResolvedValue(empty);
  vi.mocked(api.assistantMessages).mockResolvedValue(empty);
  vi.mocked(api.assistantPost).mockResolvedValue();
  const user = userEvent.setup();
  render(<AssistantPage prefs={prefs} messageLimit={2000} />);
  const suggestion = screen.getByRole('button', {
    name: 'Quais tarefas vencem nesta semana?',
  });
  expect(screen.queryByText('Quais são as minhas matérias?')).toBeNull();
  suggestion.focus();
  await user.keyboard('{Enter}');
  const input = screen.getByRole('textbox', { name: 'Mensagem' });
  expect(document.activeElement).toBe(input);
  expect((input as HTMLTextAreaElement).value).toBe(suggestion.textContent);
  expect(api.assistantPost).not.toHaveBeenCalled();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(api.assistantPost).toHaveBeenCalledWith(
    '/messages',
    expect.objectContaining({ text: suggestion.textContent }),
  );
});

it('retoma uma conversa e mantém a chave da prévia após falha de rede', async () => {
  const preview = {
    id: '00000000-0000-4000-8000-000000000002',
    key: '00000000-0000-4000-8000-000000000003',
    destination: 'Sua conta',
    action: {
      kind: 'task' as const,
      task: {
        title: 'Revisar SQL',
        subjectId: null,
        description: null,
        dueDate: null,
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const,
      },
    },
    confirmed: false,
  };
  const message = {
    id: '00000000-0000-4000-8000-000000000004',
    role: 'assistant' as const,
    text: 'Revise o conteúdo.',
    createdAt,
    retryable: false,
    preview,
  };
  vi.mocked(api.assistantConversations).mockResolvedValue({
    items: [conversation],
    cursor: null,
  });
  vi.mocked(api.assistantMessages)
    .mockResolvedValueOnce({ items: [message], cursor: null })
    .mockResolvedValueOnce({
      items: [{ ...message, preview: { ...preview, confirmed: true } }],
      cursor: null,
    });
  vi.mocked(api.assistantPost)
    .mockRejectedValueOnce(new AuthApiError(503, 'AI_UNAVAILABLE'))
    .mockResolvedValueOnce();
  const user = userEvent.setup();
  render(<AssistantPage prefs={prefs} messageLimit={2000} />);
  await user.click(await screen.findByRole('button', { name: /Conversa de/ }));
  expect(await screen.findByText('Revisar SQL')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Confirmar criação' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Confirmar criação' }));
  await waitFor(() =>
    expect(screen.getByText('Criação confirmada.')).toBeTruthy(),
  );
  expect(vi.mocked(api.assistantPost).mock.calls).toEqual(
    Array.from({ length: 2 }, () => [
      '/confirmations',
      { previewId: preview.id, idempotencyKey: preview.key },
    ]),
  );
});
