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

## Progresso, regeneração de passos e histórico

Aplique também `VersionRoadmapSteps` com `pnpm db:migration:run`. A migration conserva os UUIDs internos existentes, expõe identidade e conclusão dos passos, inicia todos como pendentes e registra o conteúdo anterior como revisão 1. Roadmaps retornam `revision`; cada passo retorna `id` e `completed`. Toda edição manual, conclusão/reabertura e substituição confirmada cria snapshot imutável com origem (`manual`, `ia`, `restauracao`), data, sequência e estado de conclusão. A revisão ativa e seu conteúdo mudam juntos em transação. A exclusão da matéria ou roadmap remove o histórico em cascata.

O PATCH manual de roadmap agora exige `baseRevision` junto de título, descrição e blocos. Conserve os IDs dos passos existentes; passos novos omitem ID. A API recusa IDs desconhecidos, IDs/títulos repetidos e alterações ao trecho até o último passo concluído, inclusive passos pendentes anteriores a ele. Os controles manuais protegem esse trecho. Para concluir ou reabrir explicitamente um passo, use `PATCH /subjects/:subjectId/roadmaps/:roadmapId/steps/:stepId` com `{ baseRevision, completed }`. Essa ação funciona sem IA e invalida prévias abertas. Enviar conclusão pelo PATCH de conteúdo é recusado.

**Reorganizar e regenerar passos** fica disponível com matérias e IA habilitadas. Mova um passo pendente depois do último concluído, usando os botões ou teclado. A prévia preserva o trecho até o último passo movido e sugere somente o que vem depois. Não há gravação antes de **Confirmar revisão**. O sufixo pode ser editado, removido e reordenado; avisos apontam possíveis semelhanças para revisão humana. Duplicatas por UUID ou título normalizado (Unicode NFKC, espaços e comparação sem maiúsculas) impedem confirmação. Passos sugeridos recebem novos IDs e começam pendentes. A sequência mantém o contexto dos blocos; grupos consecutivos são recompostos em blocos de até 20 passos, mantendo até 20 blocos. O histórico preserva a organização anterior integralmente.

Rotas sobre `/subjects/:subjectId/roadmaps/:roadmapId`:

| Método e sufixo                | Corpo / resultado                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| POST `/step-regenerations`     | `{ baseRevision, movedStepId, pendingOrder }`; ordem contém exatamente os IDs após o limite concluído |
| GET `/revisions`               | Histórico paginado por revisão decrescente; `page`/`pageSize`, padrão 1/20, máximo 100                |
| GET `/revisions/:revision`     | Snapshot confirmado com origem, data, conteúdo e revisão de origem da restauração                     |
| POST `/restoration-previews`   | `{ baseRevision, sourceRevision }`; mantém o prefixo atual e concilia passos históricos pendentes     |
| POST `/revision-confirmations` | `{ confirm: true, baseRevision, receipt, idempotencyKey, steps }`; devolve snapshot confirmado (201)  |

Prévia retorna `roadmapId`, `baseRevision`, `preservedCount`, `steps`, `origin`, `sourceRevision`, `warnings`, `receipt`, `idempotencyKey` e `expiresAt`. Cada passo plano tem `id`, `title`, `description`, `completed`, `blockTitle` e `blockDescription`. O comprovante assinado expira em 30 minutos e vincula conta, matéria, roadmap, revisão, prefixo e IDs sugeridos. Usa chave derivada de `EMAIL_HMAC_KEY` com domínio exclusivo; a restauração e o histórico funcionam sem credenciais de IA. Mantenha essa chave consistente entre réplicas; sua rotação invalida prévias pendentes.

Confirmações repetidas com a mesma chave retornam o mesmo snapshot; confirmações distintas concorrentes ou mudanças de progresso/edição invalidam a base antiga com `REVISION_CONFLICT` (409). A página oferece atualizar e preparar outra prévia. `RESTORATION_INCOMPATIBLE` explica quando conciliar uma revisão duplicaria títulos ou excederia limites. `RECEIPT_EXPIRED`, `INVALID_RECEIPT`, `PROTECTED_STEPS`, `INVALID_STEP_ID` e `DUPLICATE_STEPS` recusam alterações sem escrita parcial. Cancelar, falhar ou sair não cria snapshots. Erro de rede após envio pode ser repetido com o mesmo comprovante/chave e conteúdo editado preservado.

A restauração cria uma nova revisão com referência à escolhida, conservando todo o histórico e o trecho atualmente concluído. Não aponta a revisão ativa para um snapshot antigo. Em rollback operacional, retire as novas ações/rotas e conserve a migration e os snapshots até definir retenção; reverter a migration remove o histórico e o estado de progresso. O provedor usa os mesmos limites, schema estrito e ausência de repetição automática da geração inicial. Os testes cobrem MySQL real isolado e simulam apenas a fronteira HTTP do provedor.

## Flashcards manuais

Em `/app/flashcards`, crie baralhos com nome (até 120 caracteres), descrição opcional (até 1.000) e matéria própria opcional. Um baralho pode estar vazio. Adicione cartões com frente (até 2.000 caracteres) e verso (até 4.000); textos são exibidos como texto simples e preservam quebras de linha. Listas são paginadas; edição e exclusão individual estão disponíveis, e excluir um baralho pede confirmação e remove seus cartões.

Ao abrir um cartão, somente a frente aparece. **Revelar resposta** mostra o verso e **Mostrar frente** o oculta; trocar de cartão sempre começa com a resposta oculta. Essas ações não escrevem dados, avaliam desempenho ou agendam revisões. O uso manual funciona com `ai_enabled=false` e sem provedor configurado. A revisão programada tem uma sessão própria descrita abaixo; geração de flashcards por IA ainda não faz parte deste fluxo.

Uma matéria excluída apenas desfaz o vínculo: baralho e cartões permanecem. Desativar matérias esconde o seletor e seus dados, preserva associações existentes e permite usar baralhos sem matéria, editar outros campos e remover o vínculo. Novos vínculos exigem matérias ativas e propriedade validada no servidor. Desativar flashcards bloqueia páginas e todas as operações da API, preservando os dados para reativação.

A API autenticada oferece `POST/GET /flashcard-decks`, `GET/PATCH/DELETE /flashcard-decks/:deckId`, `POST/GET /flashcard-decks/:deckId/cards` e `GET/PATCH/DELETE /flashcard-decks/:deckId/cards/:cardId`. Paginação usa `page=1&pageSize=20`, com máximo 100; a lista de cartões não inclui o verso. `subjectId` omitido cria baralho sem matéria; em PATCH, omitido preserva o vínculo e `null` remove. Aplique `CreateManualFlashcards` com `pnpm db:migration:run` após as migrations existentes. Configure fallback da SPA para `/app/flashcards`. `synchronize` permanece falso. Rollback de código deve preservar os dados; reverter a migration remove as duas tabelas e exige decisão explícita sobre retenção. Os testes usam MySQL real em bancos temporários isolados, sem chamadas de IA.

## Importação CSV e TSV

Abra um baralho próprio em `/app/flashcards` e escolha **Importar CSV ou TSV**. Envie UTF-8 com cabeçalho obrigatório (BOM é aceito), até 2 MiB, 1.000 registros não vazios e 100 colunas. CSV usa vírgula; TSV usa tabulação. Aspas dobradas, delimitadores e quebras de linha dentro de campos entre aspas são reconhecidos. XLSX, codificação inválida e estruturas de aspas malformadas são recusados. Uma linha com largura diferente do cabeçalho é rejeitada individualmente.

Selecione duas colunas distintas pela posição, mesmo quando os nomes do cabeçalho se repetem. Confira a amostra de até 20 registros, as contagens previstas e todas as rejeições com seus números de linha física. Voltar ao mapeamento recalcula a prévia; cancelar descarta o arquivo sem criar cartões. A importação ignora pares frente/verso repetidos no arquivo ou no baralho comparando espaços externos aparados, Unicode NFC e caixa; espaços internos continuam significativos. A primeira ocorrência válida prevalece e o texto original aparado é preservado. Frente e verso seguem os limites dos cartões manuais. Cabeçalho e linhas totalmente vazias não entram nas contagens.

**Confirmar importação** grava somente os cartões válidos novos, em uma transação. Duplicatas são recalculadas sob o mesmo bloqueio usado pelas mutações manuais do baralho; as contagens efetivas podem diferir da prévia. O resultado informa importados, ignorados por duplicidade e rejeitados por erro, cuja soma é o total de registros. A mesma tentativa pode ser confirmada novamente sem duplicar cartões. Se a resposta não chegar, use **Consultar estado final** antes de repetir. Falhas de gravação revertem todos os lotes e permitem repetir a mesma tentativa. Uma importação sem linhas válidas também retorna resultado explícito.

O fluxo funciona com IA desativada e sem provedor. Sessão, origem, propriedade do baralho/tentativa e preferência de flashcards protegem todas as etapas. Tentativas privadas expiram em 15 minutos; arquivo e prévia são apagados ao cancelar ou concluir. O resultado sem conteúdo do arquivo fica disponível por 24 horas. O servidor verifica a expiração nas operações e limpa registros vencidos ao iniciar e a cada minuto; conteúdo não é registrado em logs. Desativar flashcards impede acesso e gravação sem remover resultados ainda válidos.

A API usa `POST /decks/:deckId/imports?format=csv|tsv` com o arquivo no corpo bruto e Content-Type `text/csv`, `text/tab-separated-values` ou `application/octet-stream`. `GET/DELETE /decks/:deckId/imports/:attemptId` consulta ou cancela a tentativa; `PUT .../preview` recebe `{ "frontColumn": 0, "backColumn": 1 }`, com índices começando em zero; `POST .../confirm` exige `{ "confirm": true }`. Aplique `CreateFlashcardImports` com `pnpm db:migration:run` após `CreateManualFlashcards`; `synchronize` permanece falso. Em rollback de código, retire o fluxo/rotas e preserve os cartões importados; a reversão dessa migration remove somente as tentativas temporárias e resultados.

## Revisão espaçada

Em **Revisões pendentes**, consulte a fila de todos os baralhos ou filtre pelo baralho aberto. Ela mostra frente, baralho e vencimento, em ordem de data e ID, com paginação. Cartões criados manualmente ou importados ficam pendentes imediatamente. Cartões futuros reaparecem quando a data chega. Abra um cartão, use **Revelar resposta** e escolha **De novo (AGAIN)**, **Difícil (HARD)**, **Bom (GOOD)** ou **Fácil (EASY)**. A confirmação mostra a próxima data no horário local e permite avançar. Sair sem avaliar preserva agendamento e histórico; a consulta manual continua independente. O fluxo funciona com IA desativada.

A política `sm2-inspired-v1` calcula durações exatas em UTC a partir do relógio do servidor. Os intervalos iniciais são 10 minutos, 1, 3 e 5 dias, respectivamente. Depois de um intervalo consolidado `I` em dias, HARD usa `max(1, ceil(I × 1,2))`, GOOD usa `max(3, ceil(I × facilidade), HARD + 1)` e EASY usa `max(5, ceil(I × facilidade × 1,3), GOOD + 1)`, antes do teto de 365 dias. A facilidade inicial é 2,5, limitada entre 1,3 e 3; AGAIN reduz 0,20, HARD reduz 0,15, GOOD mantém e EASY aumenta 0,15. O cálculo usa a facilidade anterior. AGAIN agenda 10 minutos, zera a sequência e faz a próxima avaliação positiva voltar ao intervalo inicial. É uma política inspirada no princípio de ampliar intervalos, sem equivalência ao SM-2 original.

Cada confirmação grava estado e evento juntos. A chave idempotente é preservada ao repetir uma tentativa sem resposta, retornando o evento original; a mesma chave com conteúdo diferente é recusada. Revisão obsoleta ou cartão futuro recebe conflito (409), permitindo recarregar a fila. O histórico paginado informa avaliação, instante, intervalo, próxima data, geração do conteúdo e versão da política. Versões incompatíveis exigem migração explícita. Alterar efetivamente frente ou verso reinicia o agendamento e incrementa revisão/geração, conservando os eventos antigos; PATCH idêntico preserva o estado. Exclusão de cartão/baralho remove estado e eventos em cascata. Desativar o módulo bloqueia acesso sem apagar dados.

| Rota autenticada                                    | Uso                                                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| GET `/flashcard-decks/reviews/pending`              | `page`, `pageSize` e `deckId` opcional; somente cartões próprios vencidos, sem verso                            |
| GET `/flashcard-decks/:deckId/cards/:cardId/review` | Snapshot consistente do conteúdo e estado para iniciar a sessão                                                 |
| GET `.../review-state`                              | Estado atual, revisão, geração e política                                                                       |
| POST `.../reviews`                                  | `{ rating, expectedRevision, idempotencyKey }`; chave UUID, sem horário ou proprietário fornecidos pelo cliente |
| GET `.../reviews`                                   | Histórico por instante/ID decrescentes, com `page` e `pageSize`                                                 |

Aplique `CreateSpacedRepetition` após as migrations de cartões e importação usando `pnpm db:migration:run`. O backfill idempotente coloca cartões existentes pendentes, com estado inicial e nenhum evento inventado. `synchronize` continua falso. Em rollback operacional do código, oculte as ações/rotas e preserve estado e eventos para reinstalação; reverter a migration apaga essas duas tabelas, preserva cartões e exige decisão explícita sobre retenção do histórico. Testes usam MySQL real isolado, relógio controlado e verificam concorrência, repetição e rollback.
