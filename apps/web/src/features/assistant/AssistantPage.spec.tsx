import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { AssistantPage } from './AssistantPage.js';
import { AuthApiError } from '../auth/auth-api.js';
import * as api from './assistant-api.js';

vi.mock('./assistant-api.js');
const prefs = {
  tasks: true,
  subjects: false,
  flashcards: false,
  ai: true,
  pomodoro: true,
  reports: true,
  routines: false,
};
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
  expect((input as HTMLTextAreaElement).value).toBe(
    'Quais tarefas vencem nesta semana?',
  );
  expect(api.assistantPost).not.toHaveBeenCalled();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(api.assistantPost).toHaveBeenCalledWith(
    '/messages',
    expect.objectContaining({ text: 'Quais tarefas vencem nesta semana?' }),
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
    text: 'Revise o conteúdo. '.repeat(300),
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

it('respeita Shift+Enter e IME e impede envios repetidos durante a resposta', async () => {
  vi.mocked(api.assistantConversations).mockResolvedValue(empty);
  vi.mocked(api.assistantMessages).mockResolvedValue(empty);
  let finish!: () => void;
  vi.mocked(api.assistantPost).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const user = userEvent.setup();
  render(<AssistantPage prefs={prefs} messageLimit={2000} />);
  const input = screen.getByRole('textbox', { name: 'Mensagem' });
  await user.type(input, 'Primeira linha');
  await user.keyboard('{Shift>}{Enter}{/Shift}Segunda linha');
  expect((input as HTMLTextAreaElement).value).toBe(
    'Primeira linha\nSegunda linha',
  );
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
  expect(api.assistantPost).not.toHaveBeenCalled();
  await user.keyboard('{Enter}');
  await user.type(input, 'Outro envio{Enter}');
  expect(api.assistantPost).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() =>
    expect(
      screen.queryByText('Aguardando resposta do Assistente IA…'),
    ).toBeNull(),
  );
});

it('pagina o histórico e mensagens e mantém o retry vinculado à mensagem original', async () => {
  vi.mocked(api.assistantConversations)
    .mockResolvedValueOnce({
      items: [conversation],
      cursor: { at: createdAt, id: conversation.id },
    })
    .mockResolvedValue({ items: [], cursor: null });
  const original = {
    id: '00000000-0000-4000-8000-000000000005',
    role: 'user' as const,
    text: 'Minha pergunta',
    createdAt,
    retryable: true,
    preview: null,
  };
  vi.mocked(api.assistantMessages)
    .mockResolvedValueOnce({
      items: [original],
      cursor: { at: createdAt, id: original.id },
    })
    .mockResolvedValue({ items: [], cursor: null });
  vi.mocked(api.assistantPost).mockResolvedValue();
  const user = userEvent.setup();
  render(<AssistantPage prefs={prefs} messageLimit={2000} />);
  await user.click(
    await screen.findByRole('button', { name: 'Mais conversas' }),
  );
  expect(api.assistantConversations).toHaveBeenLastCalledWith({
    at: createdAt,
    id: conversation.id,
  });
  await user.click(screen.getByRole('button', { name: /Conversa de/ }));
  await user.click(
    await screen.findByRole('button', { name: 'Mensagens anteriores' }),
  );
  expect(api.assistantMessages).toHaveBeenLastCalledWith(conversation.id, {
    at: createdAt,
    id: original.id,
  });
  await user.click(
    screen.getByRole('button', { name: 'Tentar responder novamente' }),
  );
  expect(api.assistantPost).toHaveBeenCalledWith(
    '/messages',
    expect.objectContaining({
      conversationId: conversation.id,
      messageId: original.id,
      text: original.text,
    }),
  );
});
