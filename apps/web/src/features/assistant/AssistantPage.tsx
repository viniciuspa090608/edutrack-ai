import { useEffect, useRef, useState, type FormEvent } from 'react';
import type {
  AssistantAction,
  AssistantConversations,
  AssistantMessages,
  ModulePreferences,
} from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  History,
  Info,
  Layers,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () =>
      document.documentElement.style.setProperty(
        '--assistant-viewport-height',
        `${viewport?.height ?? window.innerHeight}px`,
      );
    resize();
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    return () => {
      viewport?.removeEventListener('resize', resize);
      window.removeEventListener('resize', resize);
      document.documentElement.style.removeProperty(
        '--assistant-viewport-height',
      );
    };
  }, []);
  const suggestions = [
    {
      enabled: prefs.tasks,
      text: 'Quais tarefas vencem nesta semana?',
      category: 'Prazos',
      description: 'Consulte suas próximas entregas e organize a semana.',
      icon: CalendarDays,
    },
    {
      enabled: prefs.subjects,
      text: 'Quais são as minhas matérias?',
      category: 'Disciplinas',
      description: 'Explore as disciplinas que fazem parte dos seus estudos.',
      icon: BookOpen,
    },
    {
      enabled: prefs.flashcards,
      text: 'Crie cinco flashcards sobre SQL no meu baralho de Banco de Dados.',
      category: 'Flashcards',
      description: 'Prepare cartões de estudo e revise antes de salvar.',
      icon: Layers,
    },
  ].filter((suggestion) => suggestion.enabled);

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
      <header className="assistant-header">
        <div>
          <span className="assistant-brand-icon">
            <Sparkles aria-hidden="true" />
          </span>
          <h1>Assistente de IA</h1>
        </div>
        <Button
          disabled={busy}
          variant="outline"
          onClick={() => {
            setId(undefined);
            setMessages(empty);
            setFailed(undefined);
            setError('');
            setText('');
            setHistoryOpen(false);
            composer.current?.focus();
          }}
        >
          <Plus aria-hidden="true" />
          Nova conversa
        </Button>
      </header>
      <div className="assistant-layout">
        <div className="assistant-history">
          <Button
            className="assistant-history-toggle"
            variant="outline"
            aria-expanded={historyOpen}
            aria-controls="assistant-history"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History aria-hidden="true" />
            Histórico de conversas
          </Button>
          <aside
            id="assistant-history"
            data-open={historyOpen}
            aria-label="Conversas recentes"
          >
            <h2>
              Histórico <span>30 dias por mensagem</span>
            </h2>
            {!conversations.items.length && !status && !error && (
              <p>Nenhuma conversa recente.</p>
            )}
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
                        setHistoryOpen(false);
                        composer.current?.focus();
                      })
                    }
                  >
                    <MessageSquare aria-hidden="true" />
                    <span className="assistant-conversation-label">
                      <span
                        className="assistant-conversation-title"
                        title={conversation.title}
                      >
                        {conversation.title}
                      </span>
                      <time dateTime={conversation.createdAt}>
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(conversation.createdAt))}
                      </time>
                    </span>
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
        </div>
        <div className="assistant-chat">
          <p className="assistant-privacy">
            <Info aria-hidden="true" />
            <span>
              Sua mensagem, um trecho recente da conversa e os dados de estudo
              necessários podem ser enviados ao provedor configurado na sua
              conta. O histórico fica disponível por 30 dias por mensagem.
            </span>
          </p>
          <div
            className="assistant-transcript"
            role="region"
            tabIndex={0}
            aria-label="Conteúdo da conversa"
          >
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
              <div className="assistant-welcome">
                <span className="assistant-welcome-icon">
                  <BookOpen aria-hidden="true" />
                </span>
                <h2>Como posso ajudar nos seus estudos hoje?</h2>
                <p>
                  Organize seus prazos, explore suas disciplinas e prepare
                  flashcards.
                </p>
                <div className="assistant-suggestions">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion.category}
                      className="assistant-suggestion"
                      aria-label={suggestion.text}
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setText(suggestion.text.slice(0, messageLimit));
                        composer.current?.focus();
                      }}
                    >
                      <span className="assistant-suggestion-category">
                        <suggestion.icon aria-hidden="true" />
                        {suggestion.category}
                        <ArrowUpRight aria-hidden="true" />
                      </span>
                      <strong>{suggestion.text}</strong>
                      <span className="assistant-suggestion-description">
                        {suggestion.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <ol className="assistant-messages" aria-label="Mensagens">
              {[...messages.items].reverse().map((message) => (
                <li key={message.id} data-author={message.role}>
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
          </div>
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
          <form className="assistant-composer" onSubmit={sendMessage}>
            <label htmlFor="assistant-message">Mensagem</label>
            <span
              className="assistant-keyboard-hint"
              id="assistant-keyboard-hint"
            >
              Enter para enviar · Shift+Enter para nova linha
            </span>
            <textarea
              id="assistant-message"
              ref={composer}
              rows={2}
              maxLength={messageLimit}
              value={text}
              placeholder="Pergunte sobre suas disciplinas, tarefas ou flashcards…"
              aria-describedby="assistant-keyboard-hint"
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              onChange={(event) => setText(event.target.value)}
            />
            <Button type="submit" disabled={busy || !text.trim()}>
              Enviar <Send aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
