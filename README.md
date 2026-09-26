# EduTrack

Plataforma de estudos em construção. A página inicial apresenta os recursos planejados; a página técnica React continua em `/status`. A API Express oferece `GET /health` e autenticação local ou Google, com contratos compartilhados e conexão MySQL.

## Pré-requisitos

- Node.js 24 ou 25 e pnpm 11.25.0 (ver `packageManager` no `package.json`).
- Docker com Compose para MySQL local, ou MySQL 8.4 equivalente.

## Preparação local

Na raiz do repositório, instale e configure o ambiente:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

O arquivo `.env` é local e ignorado pelo Git. Ajuste `DB_PASSWORD` para uma senha local e mantenha `DB_NAME` e `TEST_DB_NAME` diferentes. `DB_PORT=3307` evita conflito com um MySQL local na porta padrão. Defina `API_PUBLIC_ORIGIN` como a origem pública da API e `WEB_ORIGIN` como a origem da web. `VITE_API_BASE_URL` contém somente a origem pública da API; nunca coloque segredos em variáveis `VITE_*`.

Para ativar o Google, configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no servidor e registre exatamente `http://localhost:3001/auth/google/callback` como URI de redirecionamento no projeto Google local. Em produção, use `${API_PUBLIC_ORIGIN}/auth/google/callback`; web e API precisam estar em HTTPS e no mesmo site. As duas credenciais Google são exigidas em produção. Mantenha o segredo somente na API.

Para confirmação de e-mail e recuperação de senha, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `EMAIL_HMAC_KEY` e `EMAIL_ENCRYPTION_KEY` na API em todos os ambientes. As chaves são valores hexadecimais independentes de 32 bytes cada; gere cada uma com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Use `SMTP_USER` e `SMTP_PASSWORD` juntos quando o provedor exigir autenticação. A porta 465 usa TLS direto; em produção, as demais portas exigem STARTTLS. Nunca exponha essas variáveis em `VITE_*` ou registre seus valores em logs. A API valida as configurações antes de iniciar; configure o SMTP e inicie o worker de entrega antes de habilitar os novos fluxos.

Inicie o banco e consulte as migrations:

```powershell
pnpm db:up
pnpm db:migration:show
pnpm db:migration:run
```

O Compose cria os bancos de desenvolvimento e teste na primeira inicialização. O volume mantém os dados entre reinicializações. Se usar um MySQL já instalado, crie os dois bancos conforme `.env` e dê ao usuário configurado permissão para conectar, criar e remover tabelas no banco de teste. As migrations criam autenticação e os dados de confirmação/recuperação. Execute `pnpm db:migration:run` antes de iniciar a API; `synchronize` continua desativado. Contas locais existentes passam a exigir confirmação; contas exclusivas do Google previamente validadas por OIDC permanecem confirmadas. Sessões antigas de contas locais pendentes perdem acesso privado no servidor.

Em terminais separados:

```powershell
pnpm dev:api
pnpm dev:web
pnpm --filter @study-platform/api email:worker
```

A landing abre em <http://localhost:5173/> sem depender da API. Cadastro e login ficam em `/acesso`; a área protegida fica em `/app` e a vinculação explícita do Google em `/conta`. O diagnóstico técnico fica em `/status`. A API abre em <http://localhost:3001>; `GET http://localhost:3001/health` responde `{"status":"ok"}` após a conexão com o banco. Para executar o build da API, use `pnpm build` e depois `pnpm --filter @study-platform/api start`.

A sessão usa cookie opaco `HttpOnly`, `SameSite=Lax` e `Secure` em HTTPS, com hash do segredo no MySQL. Ela expira após 24 horas sem atividade ou 7 dias desde a entrada, e a saída revoga a sessão no servidor. Em produção o cookie usa o prefixo `__Host-`; no HTTP local, usa o nome sem prefixo. Cadastro e login local pendente usam somente um cookie temporário de confirmação, sem acesso privado. Após confirmar o e-mail, a pessoa entra novamente. A recuperação usa outro cookie temporário de cinco minutos, consome a autorização uma vez e revoga todas as sessões ao trocar a senha.

## Tarefas de estudo

Após entrar com uma conta confirmada, abra **Tarefas** na navegação ou `/app/tarefas`. O módulo precisa estar ativo nas preferências da conta. Use **Criar tarefa** para informar um título (1–160 caracteres), descrição opcional (até 2.000 caracteres), importância e prazo opcional. A importância padrão é Média e o status padrão é Pendente. No detalhe, **Editar tarefa** permite alterar os campos e escolher Pendente, Em andamento ou Concluída, em qualquer ordem. Limpar descrição ou prazo remove esses valores. A exclusão exige confirmação; em caso de falha, os dados permanecem e a interface oferece nova tentativa.

Combine filtros de status, importância e prazo **de/até**, com limites inclusivos. Tarefas sem prazo ficam fora de filtros por data. **Limpar filtros** restaura a lista; a paginação de 20 itens preserva os filtros. O prazo é uma data `YYYY-MM-DD`, aceita datas passadas e não é convertido para um instante ou outro dia por fuso horário.

A API autenticada expõe `POST /tasks` (201), `GET /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id` (200) e `DELETE /tasks/:id` (204). POST/PATCH aceitam `title`, `description`, `priority` (`LOW`, `MEDIUM`, `HIGH`), `dueDate` e `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`). PATCH preserva campos omitidos e aceita `null` para limpar descrição e prazo; payload vazio e campos desconhecidos são rejeitados. A lista aceita `status`, `priority`, `dueFrom`, `dueTo`, `page` e `pageSize` (padrão 1/20, máximo 100), e retorna `items`, `page`, `pageSize`, `total` e `totalPages`, ordenados por criação e ID decrescentes. Toda operação usa o proprietário da sessão; IDs alheios respondem 404. Escritas reutilizam a proteção de origem/JSON da autenticação.

Aplique as migrations de autenticação e preferências, seguidas de `CreateStudyTasks` e `CreateTaskSubtasks`, antes de iniciar a nova API. Configure o fallback da SPA também para `/app/tarefas`. Os testes de tarefas usam bancos MySQL temporários com prefixo `TEST_DB_NAME`, incluindo aplicação única e reversão das migrations. O fluxo funciona com IA desativada e sem matérias ou flashcards. A associação com matérias fica para uma mudança posterior. Em rollback de código, preserve as tabelas até decidir a retenção dos dados; a versão anterior permite status manual irrestrito, então não a exponha a tarefas com subtarefas sem definir como manter a coerência delas.

### Subtarefas e progresso

No detalhe de uma tarefa, informe **Nova subtarefa** e use **Adicionar subtarefa**. O título tem 1–160 caracteres, é aparado e novos passos entram como pendentes ao fim. Edite o título, marque/desmarque a conclusão pelo checkbox e confirme a exclusão quando precisar remover um passo. **Mover para cima/baixo** salva a ordem, mantém foco no passo e anuncia sua posição; essas ações funcionam pelo teclado. Excluir a tarefa principal remove suas subtarefas por cascata.

Com subtarefas, o status é calculado: nenhuma concluída → Pendente; conclusão parcial → Em andamento; todas concluídas → Concluída. A contagem e o percentual (`concluídas / total * 100`) são calculados nas leituras, sem colunas de percentual ou contadores. Lista, detalhe e filtros refletem esse estado. Reabrir um passo ou adicionar outro pendente pode reabrir a tarefa principal. A primeira subtarefa de uma tarefa concluída manualmente muda o status para Pendente. Após excluir a última, o percentual desaparece e o status atual passa a ser manual. A interface nunca arredonda uma conclusão parcial para 100%: usa “menos de 100%” (ou “mais de 0%” no limite inferior).

Enquanto houver subtarefas, editar os campos da tarefa não envia status manual. **Concluir tarefa** pede confirmação para concluir todas as pendentes numa transação; cancelar não envia uma mutação. Repetir a confirmação tem o mesmo resultado. Operações concorrentes são serializadas pelo bloqueio da tarefa principal, inclusive PATCH e exclusão dela.

A API expõe `GET/POST /tasks/:taskId/subtasks`, `PATCH/DELETE /tasks/:taskId/subtasks/:subtaskId`, `PUT /tasks/:taskId/subtasks/order` com `{ "ids": ["uuid-1", "uuid-2"] }` (lista completa, sem repetições) e `POST /tasks/:taskId/complete-subtasks` com `{ "confirm": true }`. Criar aceita `{ "title": "Ler capítulo" }`; editar aceita título e/ou `isCompleted`. POST de criação retorna 201 e as demais operações retornam 200 com `{ "items": [...], "task": {...} }`, incluindo ordem e estado atualizado. Respostas de tarefa agora incluem `subtaskTotal`, `subtaskCompleted` e `progressPercent` (`null` sem passos).

IDs alheios ou fora da tarefa retornam 404. Ordens incompletas/duplicadas e payloads inválidos são rejeitados sem alterações. PATCH da tarefa com subtarefas rejeita status manual Pendente/Em andamento com 409 `TASK_STATUS_DERIVED`; tentar Concluída com pendências ou chamar a conclusão sem `{ "confirm": true }` retorna 409 `SUBTASK_CONFIRMATION_REQUIRED`. Um PATCH com outros campos e status em conflito não salva nenhum campo. Quando todas já estiverem concluídas, pedir novamente `COMPLETED` é inócuo.

## Operação de e-mail

Configure um provedor SMTP alcançável antes de iniciar o worker. Na configuração local, `localhost:1025` pode apontar para um capturador de e-mail de desenvolvimento; se ele não estiver ativo, os itens ficam na fila e são repetidos com atraso. O worker é um processo separado da API e deve ficar em execução em cada ambiente que oferece cadastro ou recuperação. Use `pnpm --filter @study-platform/api email:worker` em desenvolvimento ou execute `node apps/api/dist/email-worker.js` após o build em produção. O código de seis dígitos só vence dez minutos após a entrega. Reenvios revogam códigos anteriores. Um item é reservado por vez, repetido até cinco tentativas e descartado quando o desafio foi revogado.

Monitore contagens e idade de itens em `email_outbox` por `state`, desafios por `state` e falhas do processo, sem consultar ou registrar `ciphertext`, destinatários, códigos, cookies, hashes ou chaves. O worker registra somente eventos de envio, descarte e falha; a API registra tipo de falha e identificador da requisição. Para deploy, aplique as migrations, confira SMTP e worker com uma entrega controlada, depois exponha API e web. Em rollback, interrompa emissão e worker e mantenha as tabelas e o estado de confirmação. Use uma versão da API que preserve o bloqueio de contas pendentes; não volte à API anterior que ignorava esse estado. Se essa versão compatível não estiver disponível, suspenda o acesso privado até restaurar o serviço. Expire desafios, autorizações, contextos e itens antigos em uma rotina de retenção do banco após o prazo operacional escolhido.

Para publicar a web em hospedagem estática, configure o servidor para devolver `index.html` nas aberturas diretas de `/acesso`, `/confirmar-email`, `/recuperar-senha`, `/app`, `/conta` e `/status` (fallback de SPA). Arquivos em `/illustrations/` devem continuar servidos diretamente. O servidor de desenvolvimento e o preview do Vite já oferecem esse fallback.

## Verificações

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` inclui integração real com o MySQL em `TEST_DB_NAME`; o banco precisa estar ativo. Os testes de autenticação criam e removem bancos temporários com prefixo `TEST_DB_NAME`. O usuário MySQL de teste precisa de permissão para isso. Os demais comandos cobrem todos os workspaces aplicáveis. O CI executa os mesmos comandos com MySQL temporário e instalação por lockfile congelado.

## Organização

- `apps/web`: React, Vite e interface mobile-first.
- `apps/api`: Express, TypeORM, migrations e módulos `health` e `auth`.
- `packages/contracts`: schemas Zod e tipos de fronteira usados por API e web.
- `packages/ui`: apresentação compartilhada efetivamente usada pela página técnica.
- `packages/config`: presets TypeScript, ESLint e Prettier.
- `openspec/changes`: planejamento e tarefas por mudança.

Leia `AGENTS.md` para as regras de arquitetura e versionamento. O planejamento desta fundação está em `openspec/changes/bootstrap-study-platform`.

## Rotinas de estudo

A página protegida `/app/rotinas` permite criar, editar e excluir rotinas com nome de 1 a 120 caracteres, fuso IANA explícito e um ou mais horários semanais. Adicione linhas para dias e horas diferentes. A programação exibe segunda a domingo, ordenada pelo início local, com nome e fuso de cada rotina. O fuso do navegador é apenas a sugestão inicial: a leitura em outro dispositivo não converte os horários, e trocar o fuso da rotina preserva suas horas locais.

Cada horário usa dia ISO de 1 (segunda) a 7 (domingo) e início/fim `HH:mm`, de `00:00` a `23:59`, com início anterior ao fim no mesmo dia. Os intervalos são `[início, fim)`: horários adjacentes são aceitos; sobreposição no mesmo dia da mesma rotina é rejeitada. Rotinas diferentes podem coincidir. Janelas que atravessam meia-noite devem ser planejadas em horários separados nos dois dias, respeitando os limites de cada dia. Não são criadas ocorrências datadas, lembretes, tarefas ou sessões Pomodoro.

A API oferece `POST /routines` (201), `GET /routines`, `GET /routines/schedule`, `GET /routines/:id`, `PATCH /routines/:id` (200) e `DELETE /routines/:id` (204). Criação exige `name`, `timeZone` e `slots` com `weekday`, `startTime` e `endTime`. PATCH preserva campos omitidos; enviar `slots` substitui o conjunto inteiro em uma transação. A lista aceita `page` e `pageSize` (padrão 1/20, máximo 100). Todas as rotas exigem sessão; escritas exigem origem permitida e JSON. IDs alheios respondem 404. Rotinas funcionam independentemente das preferências e disponibilidade de tarefas, matérias e Pomodoro. Aplique a migration com `pnpm db:migration:run` antes de usar o módulo.

## Roadmaps de matérias e geração por IA

Em `/app/materias`, abra uma matéria para consultar ou criar roadmaps manuais. Um roadmap contém título, descrição e blocos ordenados com passos. Os controles permitem editar, adicionar, excluir e mover blocos e passos por teclado. A exclusão pede confirmação. O plano simples de assuntos continua disponível na mesma matéria.

O CRUD usa `POST/GET /subjects/:subjectId/roadmaps` e `GET/PATCH/DELETE /subjects/:subjectId/roadmaps/:roadmapId`. A lista aceita `page` e `pageSize` (padrão 1/20, máximo 100) e ordena por criação/ID decrescentes. POST e PATCH recebem `{ title, description, blocks: [{ title, description, steps: [{ title, description }] }] }`; PATCH substitui o conteúdo completo em uma transação. Títulos têm 1–120 caracteres e descrições 1–1000, aparados. São aceitos 1–20 blocos e 1–20 passos por bloco. Sessão e preferência de matérias são exigidas; escritas exigem origem permitida. Identificadores fora da conta ou da matéria retornam 404.

Com matérias e IA habilitadas nas preferências, **Aprimorar com IA** abre os parâmetros. `POST /subjects/:subjectId/roadmap-generations` recebe `currentLevel` (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), `objective` (1–500 caracteres), `dueDate` (data de calendário futura até cinco anos, comparada em UTC), `weeklyHours` (0,5–80) e `knownTopics` (até 30 textos de 1–120 caracteres, podendo estar vazio). Apenas o nome da matéria e esses parâmetros são enviados ao provedor. A API valida a resposta antes de retornar `{ subjectId, parameters, content, receipt, expiresAt }`. Gerar, editar a prévia, cancelar ou sair da página não grava conteúdo.

**Salvar roadmap** envia `POST /subjects/:subjectId/roadmaps/confirm-ai` com `{ confirm: true, receipt, content }`. O comprovante é assinado, vinculado à conta e matéria, e expira em 30 minutos. A confirmação revalida preferências, propriedade e conteúdo; grava um novo roadmap em transação. Repetições e confirmações simultâneas do mesmo comprovante retornam o mesmo registro. Uma falha preserva a edição para tentar novamente; prévia expirada exige nova geração. Roadmaps anteriores são preservados.

### Configuração opcional de IA

O uso manual e a inicialização da API funcionam sem configuração de IA. Para habilitar geração, configure **juntos** `AI_API_KEY`, `AI_MODEL` e `AI_RECEIPT_KEY` no ambiente da API. Use um modelo da sua conta que aceite Structured Outputs na Responses API. `AI_RECEIPT_KEY` deve conter 64 caracteres hexadecimais aleatórios (32 bytes); crie um segredo exclusivo com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Preserve-o entre réplicas e reinicializações; trocar a chave invalida prévias pendentes. Credenciais nunca são enviadas à web ou registradas em erros.

| Variável                | Padrão | Limites                                             |
| ----------------------- | ------ | --------------------------------------------------- |
| `AI_TIMEOUT_MS`         | 30000  | 100–120000 ms, incluindo leitura da resposta        |
| `AI_MAX_RESPONSE_BYTES` | 524288 | 1024–1048576 bytes para toda a resposta do provedor |

O adaptador usa [Structured Outputs da OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs), `store: false`, JSON Schema estrito e limite de 16000 tokens de saída, com validação Zod local adicional. Cada ação chama o provedor uma vez; não há repetição automática. Falhas retornam `AI_UNAVAILABLE`, `AI_TIMEOUT` ou `AI_INVALID_RESPONSE`, sem corpo bruto, prompt ou credenciais. Sem configuração, geração responde 503; operações manuais continuam disponíveis.

Aplique `CreateSubjectRoadmaps` e `AddRoadmapGeneration` com `pnpm db:migration:run` após as migrations de autenticação, preferências e matérias. `synchronize` permanece falso. O rollback apenas da configuração/código de IA preserva roadmaps confirmados para uso manual; retirar a migration da base manual remove suas tabelas, portanto preserve os dados antes de uma reversão destrutiva. Os testes usam MySQL real em bancos temporários isolados e provedor simulado na fronteira HTTP; não exigem chave paga nem consomem chamadas reais.
