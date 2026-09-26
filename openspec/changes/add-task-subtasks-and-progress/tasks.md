# Tasks

## 1. Pré-requisitos e contratos

- [x] 1.1 Confirmar que `add-user-authentication` e `add-study-tasks` foram aplicadas, com sessão, `study_tasks`, rotas e testes funcionando; verificar `GET/PATCH /tasks/:id` autenticados e migrations antes de estender o módulo.
- [x] 1.2 Quando `study-tasks` estiver publicada, reconciliar nesta mudança o requisito integral de status manual com a regra condicional para tarefas com subtarefas, ajustando proposal e delta MODIFIED conforme o OpenSpec; verificar `openspec validate add-task-subtasks-and-progress --strict` sem conflito entre specs.
- [x] 1.3 Estender `packages/contracts` com subtarefa, ordem, contadores e percentual calculado ou `null` nas respostas de tarefa; verificar schemas de título, atualização parcial, IDs duplicados na ordem e confirmação explícita por testes de contrato.

## 2. Persistência e regras da API

- [x] 2.1 Criar migration versionada e entidade de `task_subtasks` com FK de exclusão em cascata, posição, conclusão e índices, sem coluna de percentual; verificar aplicação/reversão no MySQL isolado e exclusão da tarefa principal com suas subtarefas.
- [x] 2.2 Implementar repository e rotas de listagem/criação/edição/exclusão de subtarefas com escopo obrigatório pelo usuário e tarefa; verificar em HTTP/MySQL real que IDs alheios ou de outra tarefa retornam 404 sem alterar dados.
- [x] 2.3 Implementar inclusão ao fim e reordenação por lista completa de IDs, com posições contíguas e transação por tarefa; verificar ordem após recarga, compactação após exclusão e rejeição integral de conjuntos inválidos.
- [x] 2.4 Calcular contagem e percentual em leituras de lista/detalhe, retornando `null` sem subtarefas, e sincronizar o status da tarefa em cada mudança de quantidade/conclusão; verificar 0%, 25%, 100%, reabertura, primeira e última subtarefa em testes HTTP/MySQL.
- [x] 2.5 Proteger `PATCH /tasks/:id` contra status manual incompatível quando houver subtarefas, com 409 `SUBTASK_CONFIRMATION_REQUIRED` para tentativa de `COMPLETED` pendente sem confirmação; verificar que payload misto em conflito não altera nenhum campo.
- [x] 2.6 Implementar conclusão confirmada de todas as subtarefas pendentes em uma transação e repetição idempotente; verificar confirmação ausente/cancelada, sucesso atômico, repetição e concorrência com reabertura ou criação de subtarefa no MySQL real.

## 3. Experiência web

- [x] 3.1 Adicionar ao detalhe da tarefa lista de subtarefas e ações de criar, editar, concluir, reabrir e excluir com confirmação; verificar carregamento, erro, vazio, cancelamento da exclusão e atualização após sucesso por testes de interface.
- [x] 3.2 Adicionar botões acessíveis para mover subtarefas para cima/baixo, preservando foco e anunciando posição; verificar reordenação por teclado, persistência após recarga e layout de 320 px.
- [x] 3.3 Exibir contagem e progresso calculado apenas com subtarefas, sem arredondar visualmente uma conclusão parcial para 100%, e alternar entre status manual e derivado conforme a presença delas; verificar 0/parcial/100%, primeira e última subtarefa na interface.
- [x] 3.4 Adicionar diálogo de confirmação antes de concluir todas as pendentes e chamar a operação explícita apenas após confirmação; verificar cancelamento sem mutação, sucesso, falha de rede e foco do diálogo por testes de interação.

## 4. Verificações e conclusão

- [x] 4.1 Atualizar README com ordem de uso, status derivado, percentual não persistido e confirmação de conclusão; verificar que exemplos e limites correspondem à API e à interface implementadas.
- [x] 4.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` com MySQL real em `TEST_DB_NAME` e `pnpm build`; verificar código zero nos quatro comandos e corrigir falhas antes de concluir.
- [x] 4.3 Executar `openspec validate add-task-subtasks-and-progress --strict` e conferir manualmente propriedade, reordenação, reabertura, status e confirmação em tela de 320 px; verificar todos os cenários e specs reconciliadas.
- [x] 4.4 Revisar e adicionar somente arquivos/hunks desta mudança, incluindo `tasks.md` final, executar `git diff --cached --check` e criar o único commit de conclusão no formato de `AGENTS.md`; verificar hash e lista de arquivos incluídos.

## Aplicabilidade

A condição de 1.2 foi verificada: a spec principal study-tasks ainda não foi publicada. Proposal e design registram a condição e a regra de status manual somente sem subtarefas; nenhum delta MODIFIED foi criado contra um caminho inexistente. A reconciliação da spec principal pertence ao sync/archive após a publicação do predecessor.
