# Integração local do Assistente IA — 18/11/2026

## Integração e histórico

- Branch: `codex/integrate-ai-assistant-pilot`. O working tree estava limpo antes do merge.
- Base preserva master e a melhoria posterior de dashboard e preferências. O piloto é integrado por merge, sem squash, amend, novo archive ou publicação. A mudança OpenSpec original já estava arquivada; esta operação não é um novo apply.
- Conflitos resolvidos semanticamente em app.ts, FlashcardsService, AuthenticatedShell e na spec do shell. Dashboard e Assistente usam a mesma instância de FlashcardsService e preservam seus métodos públicos. A navegação mantém ordem de módulos, filtros e link IA da Conta; Assistente tem destino próprio na sidebar e em Mais.
- Testes adaptados às preferências recentes e à reversão/reaplicação da migration do Assistente com migrations posteriores.

## Configuração e segurança

- `.env` permanece ignorado. Piloto habilitado com `GEMINI_MODEL=gemini-3.5-flash-lite` e `AI_ASSISTANT_MODELS=gemini:gemini-3.5-flash-lite`, selecionados explicitamente após homologação.
- Limites locais de chat: 2 chamadas por conta/dia, 4 globais/dia e 1 simultânea. Timeout total de 120000 ms; 1 repetição e base de espera de 1000 ms. Tetos gerais permanecem separados e validados.
- As chaves necessárias de MySQL, Gemini, recibos e criptografia estavam presentes. Nenhum segredo foi impresso ou versionado; contas pessoais não foram alteradas. Para outro provedor, será necessária uma credencial própria e homologação do par correspondente.
- Consulta agregada encontrou cinco contas locais com preferência IA ativa e nenhuma configuração pessoal de provedor. Elegibilidade foi testada também com IA desativada. Nenhuma preferência de conta foi alterada.
- Uma migration pendente foi aplicada no desenvolvimento; consulta posterior confirmou zero pendências. MySQL mantém `synchronize: false`.
- Reinicie a API existente para carregar o código e o ambiente atualizados.

## Resiliência e correção funcional

- Chat Gemini usa raciocínio LOW. O catálogo mantém 3.8 Flash e adiciona 3.5 Flash-Lite, com seleção explícita; não há fallback automático entre modelos, provedores ou credenciais.
- Respostas HTTP 502/503/504 podem ser repetidas de zero a duas vezes, padrão uma, dentro do timeout total. Backoff exponencial com jitter respeita Retry-After; esperas acima de 10 segundos ou sem prazo suficiente encerram a tentativa.
- Cada chamada reserva e consome cota própria e libera a reserva ao terminar. Chave recusada, 429, transporte, timeout, resposta inválida ou cota local esgotada não iniciam repetição automática.
- A orientação do modelo distingue pedido, contexto e ação autorizada. Ela explicita os padrões para os campos opcionais de tarefas; uma resposta 200 que apenas repetia o pedido não foi considerada homologação suficiente.
- Toda resposta com prévia é apresentada como “Revise a prévia e confirme para salvar.” A criação depende da confirmação, mesmo se o texto original do modelo alegar gravação. Teste garante ausência de tarefa antes de confirmar e idempotência depois.

## Provedor real e MySQL isolado

Todas as execuções usaram contas sintéticas em bancos exclusivos com prefixo TEST_DB_NAME e sufixo aleatório. As 23 migrations foram aplicadas; os bancos foram removidos em finally.

| Fluxo homologado com Flash-Lite | Geração no endpoint | Confirmação | Replay               | Persistência                    |
| ------------------------------- | ------------------- | ----------- | -------------------- | ------------------------------- |
| Tarefa, smoke final             | 200 em 1266 ms      | 200         | 200, mesmo resultado | 1 tarefa com título correto     |
| Matéria                         | 200 em 8394 ms      | 200         | 200, mesmo resultado | 1 matéria                       |
| Flashcards                      | 200 em 1381 ms      | 200         | 200, mesmo resultado | 2 cartões no baralho autorizado |

- Cada geração bem-sucedida fez uma chamada real ao provedor; confirmação e replay não geraram nova chamada. Histórico, prévia, preferência desativada/ativada e matriz de modelos foram verificados.
- Os primeiros smokes falharam nas consultas finais da ferramenta local de verificação por nomes de tabela/colunas incorretos. As consultas foram corrigidas e os fluxos repetidos até verificar as quantidades persistidas; essas falhas não foram aceitas como sucesso.
- Repetições foram verificadas com falhas sintéticas na fronteira externa, preservando MySQL real: limite diário de 1 bloqueia a segunda chamada; limite de 2 permite 503 seguido de sucesso, com contador igual a 2 e nenhuma reserva remanescente. Testes de transporte cobrem HTTP 502/503/504, snapshot estável, prazo total, Retry-After, limite de repetições e erros não repetíveis.

## Investigação dos timeouts

- A homologação histórica de 3.8 Flash registrou sucesso em aproximadamente 67 s e 119 s, além de timeouts de 120 s. A primeira integração desta sessão recebeu três HTTP 503 por alta demanda em aproximadamente 5 s, 15 s e 3 s.
- Uma nova tentativa do 3.8 Flash com raciocínio reduzido atingiu 120 s e foi abortada; não houve repetição de timeout. Logo, reduzir raciocínio e aumentar timeout não resolveram esse modelo nesta sessão.
- Flash-Lite respondeu com sucesso. A troca explícita resolveu o bloqueio observado, mas as amostras não garantem latência ou disponibilidade futuras.
- Fontes oficiais: [raciocínio](https://aistudio.google.com/docs/thinking), [Flash-Lite](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite), [falhas transitórias](https://aistudio.google.com/docs/troubleshooting). Não foi atribuída uma causa definitiva aos timeouts históricos; alta demanda foi confirmada apenas nas respostas 503 inspecionadas.

## Qualidade

- Passaram pnpm lint, pnpm typecheck, pnpm test e pnpm build.
- Suíte completa: 22 testes de workflow, 42 de contratos, 309 da API (44 arquivos com MySQL real) e 314 da web (38 arquivos). Após proteger a mensagem da prévia, os 11 testes HTTP do Assistente e o smoke real final foram executados novamente.
- O build apresenta aviso de tamanho do bundle principal da web (aproximadamente 1,2 MB antes de gzip).
- Diff revisado, sem marcadores de conflito; git diff --cached --check e verificação de segredos locais no diff staged exigidos antes do commit.
- As restrições iniciais de Git/MSYS e acesso ao MySQL no sandbox foram resolvidas por execução autorizada. Testes de banco não foram substituídos por mocks.
- Nenhum push, tag ou versão foi criado. Master e commits históricos permanecem preservados.

## Arquivos da integração

- .env.example
- README.md
- apps/api/package.json
- apps/api/src/app.ts
- apps/api/src/assistant-cleanup.ts
- apps/api/src/config/env.ts
- apps/api/src/database/cleanup-assistant.ts
- apps/api/src/database/migrations/20261115000000-CreateStudyAssistant.ts
- apps/api/src/demo/database.ts
- apps/api/src/middlewares/request-context.ts
- apps/api/src/modules/ai-settings/ai-usage.repository.ts
- apps/api/src/modules/ai/assistant-history.ts
- apps/api/src/modules/ai/assistant.routes.ts
- apps/api/src/modules/ai/assistant.service.ts
- apps/api/src/modules/auth/google.service.ts
- apps/api/src/modules/flashcards/flashcards.repository.ts
- apps/api/src/modules/flashcards/flashcards.service.ts
- apps/api/src/modules/subjects/subjects.repository.ts
- apps/api/src/modules/subjects/subjects.service.ts
- apps/api/src/modules/tasks/tasks.repository.ts
- apps/api/src/modules/tasks/tasks.service.ts
- apps/api/src/server.ts
- apps/api/src/shared/structured-provider.ts
- apps/api/test/ai-providers.spec.ts
- apps/api/test/assistant.http.spec.ts
- apps/api/test/env.spec.ts
- apps/web/src/app/App.tsx
- apps/web/src/app/private-navigation.ts
- apps/web/src/features/assistant/AssistantPage.spec.tsx
- apps/web/src/features/assistant/AssistantPage.tsx
- apps/web/src/features/assistant/assistant-api.ts
- apps/web/src/features/assistant/assistant.css
- apps/web/src/features/auth/AuthenticatedShell.spec.tsx
- apps/web/src/features/auth/AuthenticatedShell.tsx
- apps/web/src/features/auth/PrivatePage.tsx
- apps/web/src/features/auth/auth-api.ts
- docs/validation/ai-assistant-integration.md
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/.openspec.yaml
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/design.md
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/proposal.md
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/specs/ai-provider-routing/spec.md
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/specs/ai-study-assistant/spec.md
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/specs/authenticated-shell-visual-experience/spec.md
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/tasks.md
- openspec/changes/archive/2026-11-15-add-ai-assistant-pilot/validation.md
- openspec/specs/ai-provider-routing/spec.md
- openspec/specs/ai-study-assistant/spec.md
- openspec/specs/authenticated-shell-visual-experience/spec.md
- packages/contracts/src/ai-assistant.ts
- packages/contracts/src/ai-settings.ts
- packages/contracts/src/index.ts
