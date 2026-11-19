import { useEffect, useRef, useState, type FormEvent } from 'react';
import type {
  AssistantAction,
  AssistantConversations,
  AssistantMessages,
  ModulePreferences,
} from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import { AuthApiError } from '../auth/auth-api.js';
import {
  assistantConversations,
  assistantMessages,
  assistantPost,
} from './assistant-api.js';
import './assistant.css';

const empty = { items: [], cursor: null };
type Message = AssistantMessages['items'][number];
type Submission = {
  conversationId?: string;
  messageId: string;
  attemptId: string;
  text: string;
};
function describe(error: unknown) {
  if (!(error instanceof AuthApiError))
    return 'Não foi possível concluir a solicitação. Tente novamente.';
  switch (error.code) {
    case 'AI_ASSISTANT_INCOMPATIBLE':
    case 'AI_CREDENTIAL_REJECTED':
      return 'A configuração de IA não está disponível neste piloto. Revise o provedor e o modelo em Conta.';
    case 'AI_TIMEOUT':
      return 'A IA demorou para responder. Sua mensagem foi mantida e você pode tentar novamente.';
    case 'AI_UNAVAILABLE':
      return 'O provedor de IA está indisponível. Tente novamente mais tarde.';
    case 'AI_DISABLED':
    case 'MODULE_DISABLED':
      return 'Verifique a preferência de IA e os módulos necessários em Conta.';
    case 'ASSISTANT_NOT_FOUND':
      return 'Esta conversa ou prévia está indisponível ou expirou.';
    default:
      return error.message;
  }
}

function ActionContent({ action }: { action: AssistantAction }) {
  if (action.kind === 'flashcards')
    return (
      <ol>
        {action.cards.map((card, index) => (
          <li key={index}>
            <strong>{card.front}</strong>
            <p>{card.back}</p>
          </li>
        ))}
      </ol>
    );
  if (action.kind === 'subject')
    return (
      <dl>
        <dt>Matéria</dt>
        <dd>{action.subject.name}</dd>
        <dt>Nível</dt>
        <dd>{action.subject.currentLevel}</dd>
        {action.subject.objective && (
          <>
            <dt>Objetivo</dt>
            <dd>{action.subject.objective}</dd>
          </>
        )}
        {action.subject.dueDate && (
          <>
            <dt>Prazo</dt>
            <dd>{action.subject.dueDate}</dd>
          </>
        )}
        {action.subject.weeklyHours !== null && (
          <>
            <dt>Horas semanais</dt>
            <dd>{action.subject.weeklyHours}</dd>
          </>
        )}
        {!!action.subject.knownTopics.length && (
          <>
            <dt>Tópicos conhecidos</dt>
            <dd>{action.subject.knownTopics.join(', ')}</dd>
          </>
        )}
      </dl>
    );
  return (
    <dl>
      <dt>Tarefa</dt>
      <dd>{action.task.title}</dd>
      {action.task.description && (
        <>
          <dt>Descrição</dt>
          <dd>{action.task.description}</dd>
        </>
      )}
      {action.task.dueDate && (
        <>
          <dt>Prazo</dt>
          <dd>{action.task.dueDate}</dd>
        </>
      )}
      <dt>Prioridade</dt>
      <dd>
        {{ LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' }[action.task.priority]}
      </dd>
      <dt>Status</dt>
      <dd>
        {
          {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em andamento',
            COMPLETED: 'Concluída',
          }[action.task.status]
        }
      </dd>
    </dl>
  );
}

export function AssistantPage({
  prefs,
  messageLimit,
}: {
  prefs: ModulePreferences;
  messageLimit: number;
}) {
  const [conversations, setConversations] =
    useState<AssistantConversations>(empty);
  const [messages, setMessages] = useState<AssistantMessages>(empty);
  const [id, setId] = useState<string>();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Carregando conversas…');
  const [error, setError] = useState('');
  const [failed, setFailed] = useState<Submission>();
  const [busy, setBusy] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const suggestions = [
    prefs.tasks && 'Quais tarefas vencem nesta semana?',
    prefs.subjects && 'Quais são as minhas matérias?',
    prefs.flashcards &&
      'Crie cinco flashcards sobre SQL no meu baralho de Banco de Dados.',
  ].filter((value): value is string => Boolean(value));

  async function loadConversations(cursor?: AssistantConversations['cursor']) {
    const result = await assistantConversations(cursor);
    setConversations((existing) =>
      cursor
        ? { ...result, items: [...existing.items, ...result.items] }
        : result,
    );
  }
  useEffect(() => {
    void loadConversations()
      .catch((cause: unknown) => setError(describe(cause)))
      .finally(() => setStatus(''));
  }, []);

  async function run(label: string, work: () => Promise<void>, success = '') {
    setBusy(true);
    setStatus(label);
    setError('');
    try {
      await work();
      setStatus(success);
    } catch (cause) {
      setError(describe(cause));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }
  async function submit(input: Submission) {
    await run('Aguardando resposta do Assistente IA…', async () => {
      const destination = input.conversationId ?? input.messageId;
      try {
        await assistantPost('/messages', input);
        setFailed(undefined);
      } catch (cause) {
        setFailed(input);
        throw cause;
      } finally {
        await Promise.allSettled([
          loadConversations(),
          assistantMessages(destination).then((result) => {
            setMessages(result);
            setId(destination);
          }),
        ]);
      }
    });
  }
  function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setFailed(undefined);
    void submit({
      ...(id ? { conversationId: id } : {}),
      messageId: crypto.randomUUID(),
      attemptId: crypto.randomUUID(),
      text: text.trim(),
    });
    setText('');
  }
  async function confirm(preview: NonNullable<Message['preview']>) {
    if (!id) return;
    await run(
      'Confirmando criação…',
      async () => {
        await assistantPost('/confirmations', {
          previewId: preview.id,
          idempotencyKey: preview.key,
        });
        setMessages(await assistantMessages(id));
        composer.current?.focus();
      },
      'Criação salva com sucesso.',
    );
  }
  return (
    <section className="assistant-page">
      <h1>Assistente IA</h1>
      <p>
        Sua mensagem, um trecho recente da conversa e os dados de estudo
        necessários podem ser enviados ao provedor configurado na sua conta. O
        histórico fica disponível por 30 dias por mensagem.
      </p>
      <div className="assistant-layout">
        <aside aria-label="Conversas recentes">
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => {
              setId(undefined);
              setMessages(empty);
              setFailed(undefined);
              setError('');
              setText('');
              composer.current?.focus();
            }}
          >
            Nova conversa
          </Button>
          <ul>
            {conversations.items.map((conversation) => (
              <li key={conversation.id}>
                <Button
                  variant="ghost"
                  disabled={busy}
                  aria-pressed={conversation.id === id}
                  onClick={() =>
                    void run('Carregando mensagens…', async () => {
                      setMessages(await assistantMessages(conversation.id));
                      setId(conversation.id);
                      setFailed(undefined);
                    })
                  }
                >
                  Conversa de{' '}
                  {new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(conversation.updatedAt))}
                </Button>
              </li>
            ))}
          </ul>
          {conversations.cursor && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run('Carregando conversas…', () =>
                  loadConversations(conversations.cursor),
                )
              }
            >
              Mais conversas
            </Button>
          )}
        </aside>
        <div className="assistant-chat">
          {messages.cursor && id && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run('Carregando mensagens…', async () => {
                  const older = await assistantMessages(id, messages.cursor);
                  setMessages({
                    ...older,
                    items: [...messages.items, ...older.items],
                  });
                })
              }
            >
              Mensagens anteriores
            </Button>
          )}
          {messages.items.length === 0 && (
            <div>
              <p>Como posso ajudar nos seus estudos?</p>
              <div className="assistant-suggestions">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setText(suggestion.slice(0, messageLimit));
                      composer.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <ol className="assistant-messages" aria-label="Mensagens">
            {[...messages.items].reverse().map((message) => (
              <li key={message.id}>
                <strong>
                  {message.role === 'user' ? 'Você' : 'Assistente IA'}
                </strong>
                <p>{message.text}</p>
                {message.retryable && id && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void submit({
                        conversationId: id,
                        messageId: message.id,
                        attemptId: crypto.randomUUID(),
                        text: message.text,
                      })
                    }
                  >
                    Tentar responder novamente
                  </Button>
                )}
                {message.preview && (
                  <section aria-label="Prévia de criação">
                    <p>
                      <strong>Destino</strong> {message.preview.destination}
                    </p>
                    <ActionContent action={message.preview.action} />
                    {message.preview.confirmed ? (
                      <p>Criação confirmada.</p>
                    ) : (
                      <Button
                        disabled={busy}
                        onClick={() => void confirm(message.preview!)}
                      >
                        Confirmar criação
                      </Button>
                    )}
                  </section>
                )}
              </li>
            ))}
          </ol>
          <p role="status">{status}</p>
          {error && <p role="alert">{error}</p>}
          {failed &&
            !messages.items.some(
              (message) => message.id === failed.messageId && message.retryable,
            ) && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void submit(failed)}
              >
                Tentar envio novamente
              </Button>
            )}
          <form onSubmit={sendMessage}>
            <label htmlFor="assistant-message">Mensagem</label>
            <textarea
              id="assistant-message"
              ref={composer}
              rows={3}
              maxLength={messageLimit}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <Button type="submit" disabled={busy || !text.trim()}>
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
