# Revisão da implementação

Mudança: `add-task-subtasks-and-progress`, schema `spec-driven`.

## Resultado

Subtarefas com CRUD, ordem persistida, conclusão e reabertura. Contadores e percentual são calculados nas leituras; o status é derivado enquanto houver subtarefas. Conclusão de todas as pendentes exige confirmação explícita, é atômica e idempotente. Mutações usam transação e lock da tarefa principal, com escopo obrigatório de usuário e tarefa.

O predecessor `add-study-tasks` foi concluído no commit `e7c0849d106aa854a869d34039fa61d300ac97db`. As alterações preexistentes de outros planejamentos, arquivos arquivados e skills foram preservadas. A spec principal `study-tasks` ainda não está publicada; a condição da tarefa 1.2 foi verificada e registrada em proposal/design, sem delta contra caminho inexistente.

## Verificações

- `pnpm lint`: passou.
- `pnpm typecheck`: passou.
- `pnpm test`: passou, 132 testes (12 contratos, 75 API, 45 web). API e migrations usam MySQL real com bancos isolados.
- `pnpm build`: passou; Vite informou o aviso de bundle acima de 500 kB.
- `openspec validate add-task-subtasks-and-progress --strict`: passou.
- HTTP/MySQL: isolamento de proprietário/tarefa, validação, reordenação integral, compactação, progresso 0/25/100%, primeira/última subtarefa, conflitos 409 sem atualização parcial, rollback por falha SQL e concorrência com criação/reabertura.
- Navegador em 320 px: largura interna 320, clientWidth e scrollWidth 305; sem overflow horizontal. Reordenação por Enter manteve foco no item e anunciou posição. Recarga preservou ordem e conclusão. Cancelar por Escape preservou o progresso parcial e devolveu foco ao botão. Confirmar concluiu 3/3; reabrir voltou a 2/3 e Em andamento.
- Testes da web cobrem loading/erro/vazio, título inválido, falha de rede, foco, cancelamento sem requisição, status manual condicional e arredondamento parcial sem 100%.

A primeira execução completa encontrou uma corrida preexistente em `email-flow.spec.ts`: após uma confirmação, o contexto da segunda requisição pode ser invalidado antes de consumir o código, retornando 401 em vez de 400. Uma nova execução completa passou sem alteração no módulo de autenticação. Essa intermitência permanece registrada.

O banco, servidores, página e aba temporários de QA foram removidos. A mudança não foi arquivada nem enviada ao remoto.

Durante a revisão final, outra execução criou arquivos de Pomodoro no workspace e o lint passou a apontar formatação nesses arquivos. Para preservar esse trabalho, os quatro comandos de qualidade foram executados também em uma cópia do conteúdo staged, com dependências locais e pacotes compartilhados dentro da cópia. Nenhum arquivo de Pomodoro foi incluído no commit de subtarefas.

## Arquivos da mudança

- README.md
- apps/api/src/database/data-source.ts
- apps/api/src/database/migrations/20260926190000-CreateTaskSubtasks.ts
- apps/api/src/modules/tasks/subtask.entity.ts
- apps/api/src/modules/tasks/task.entity.ts
- apps/api/src/modules/tasks/tasks.repository.ts
- apps/api/src/modules/tasks/tasks.routes.ts
- apps/api/src/modules/tasks/tasks.service.ts
- apps/api/test/tasks-migration.spec.ts
- apps/api/test/subtasks-migration.spec.ts
- apps/api/test/subtasks.http.spec.ts
- apps/web/src/features/tasks/TasksPage.tsx
- apps/web/src/features/tasks/TasksPage.spec.tsx
- apps/web/src/features/tasks/tasks-api.ts
- apps/web/src/features/tasks/SubtasksSection.tsx
- apps/web/src/features/tasks/SubtasksSection.spec.tsx
- apps/web/src/features/tasks/TaskConfirmation.tsx
- apps/web/src/features/tasks/TaskProgress.tsx
- apps/web/src/styles/tasks.css
- packages/contracts/src/tasks.ts
- packages/contracts/src/subtasks.spec.ts
- openspec/changes/add-task-subtasks-and-progress/proposal.md
- openspec/changes/add-task-subtasks-and-progress/design.md
- openspec/changes/add-task-subtasks-and-progress/tasks.md
- openspec/changes/add-task-subtasks-and-progress/implementation-review.md
