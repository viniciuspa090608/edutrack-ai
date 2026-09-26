# Design

## Context

Ver [proposal.md](proposal.md) e [spec.md](specs/task-subtasks-and-progress/spec.md). A autenticação e `add-study-tasks` estão implementadas; o predecessor foi concluído no commit `e7c0849`. Este apply estende `study_tasks`, `/tasks` e `/app/tarefas` no módulo existente, reutilizando sessão e proteção de origem. A spec principal `study-tasks` ainda não está publicada, portanto a condição da tarefa 1.2 não se aplica agora e não se cria delta MODIFIED contra um caminho inexistente. O requisito integral de edição/status deverá ser reconciliado quando o predecessor for sincronizado, pois descreve a etapa sem subtarefas.

## Goals / Non-Goals

**Goals:** fazer o estado de subtarefas e o status da tarefa principal mudarem de forma atômica; derivar o percentual sempre dos registros atuais; preservar a operação manual das tarefas sem subtarefas; manter o controle de propriedade em todos os caminhos HTTP.

**Non-Goals:** armazenar percentual, atribuir responsáveis diferentes a subtarefas, prazo/importância próprios de subtarefas, hierarquia de subtarefas, conclusão por IA, recompensas ou associação a matérias.

## Decisions

### 1. Dados e cálculo

Adicionar migration versionada `task_subtasks` com `id`, `task_id` referenciando `study_tasks.id` com exclusão em cascata, `title`, `is_completed`, `position`, `created_at` e `updated_at`. `title` será aparado e limitado a 160 caracteres, como o título da tarefa principal. A posição é inteira iniciada em zero, contígua dentro de cada tarefa; índice `(task_id, position, id)` suporta leitura ordenada. Não criar coluna de percentual nem contadores persistidos. A exclusão da tarefa principal removerá as subtarefas pela FK.

As leituras obtêm `total` e `completed` por agregação das subtarefas; se `total > 0`, retornam `progressPercent = completed / total * 100` e status coerente com os três casos `completed = 0`, `0 < completed < total`, `completed = total`. O percentual do DTO é um número calculado, sem arredondamento no dado; a interface formata o valor e mostra também “concluídas de total”. Se o arredondamento visual alcançaria 100% com pendências, mostrar “menos de 100%”; se alcançaria 0% com alguma conclusão, mostrar “mais de 0%”. Para `total = 0`, `progressPercent` é `null` e o status vem de `study_tasks.status`, definido manualmente. A coluna de status existente é atualizada junto com cada mutação de subtarefa para que filtros de status da lista continuem corretos; a contagem/percentual nunca é armazenada. Alternativa rejeitada: coluna `progress_percent`, que pode ficar obsoleta e viola a regra pedida.

### 2. Escritas serializadas por tarefa

Criar, concluir, reabrir, excluir e reordenar subtarefas e concluir todas as pendentes serão transações do módulo de tarefas. Cada operação primeiro localiza e bloqueia a linha da tarefa principal com `user_id = authenticatedUserId`; em seguida opera apenas subtarefas com `task_id` correspondente. Esse bloqueio serializa operações concorrentes na mesma tarefa. Após mudança de conclusão ou quantidade, o service recalcula os contadores e grava o status derivado na mesma transação. Ao criar a primeira subtarefa pendente, uma tarefa manualmente `COMPLETED` passa a `PENDING`. Ao excluir a última subtarefa, não há razão matemática para progresso; manter o status que a tarefa tinha imediatamente antes da exclusão, que passa a ser manual. Repetir a ação “concluir” numa subtarefa já concluída ou “reabrir” numa pendente não produz nova transição.

Para reordenar, aceitar a lista completa dos IDs da tarefa na ordem desejada e rejeitar duplicados, faltantes ou estranhos antes de qualquer gravação. Atualizar posições de 0 a N−1 na transação. Novas subtarefas entram no fim; exclusões compactam as posições. Não criar índice único de posição neste incremento, pois trocas simultâneas de posições sob restrição única exigiriam valores temporários; o bloqueio da tarefa e a validação do conjunto garantem a ordem pelo serviço. Alternativa rejeitada: confiar na ordem apenas no cliente, que se perderia em recargas e entre dispositivos.

### 3. Rotas, contratos e escopo

Estender os contratos de `packages/contracts` com DTO de subtarefa, mutações, ordenação, contadores e `progressPercent: number | null` nas respostas de tarefa. Expor `GET/POST /tasks/:taskId/subtasks`, `PATCH/DELETE /tasks/:taskId/subtasks/:subtaskId`, `PUT /tasks/:taskId/subtasks/order` e `POST /tasks/:taskId/complete-subtasks`. O último endpoint exige corpo `{ "confirm": true }`. `PATCH` de subtarefa aceita título e/ou `isCompleted`; corpo vazio ou campos desconhecidos são inválidos. Todas as rotas usam a sessão e a checagem de origem/CSRF de `add-user-authentication`. IDs de tarefa alheia ou subtarefa fora da tarefa informada produzem 404 sem revelar sua existência. Repository nunca consulta subtarefa por ID sozinho.

Alterar o `PATCH /tasks/:id` já planejado: sem subtarefas, status manual permanece. Com subtarefas, `PENDING` e `IN_PROGRESS` enviados manualmente geram conflito; `COMPLETED` com pendentes retorna 409 `SUBTASK_CONFIRMATION_REQUIRED` sem modificar nenhum campo do PATCH. Se todas já estiverem concluídas, o status já será `COMPLETED` e o pedido é inócuo. A confirmação explícita usa `POST /tasks/:id/complete-subtasks` e conclui todas as pendentes na mesma transação, atualizando o status uma vez. Repetir a operação retorna o estado concluído sem criar efeito adicional. A proteção no servidor impede que uma chamada direta burle o diálogo da web.

### 4. Interface e confirmação

Adicionar uma seção de subtarefas ao detalhe da tarefa em `/app/tarefas`: lista ordenada, inclusão/edição, controle de conclusão/reabertura, exclusão com confirmação e botões “Mover para cima/baixo”. Botões permitem reordenação por teclado sem depender de arrastar; a interface anuncia a nova posição e preserva foco após a mudança. Mostrar contagem e barra de progresso somente quando houver subtarefas, com texto equivalente acessível. Quando o conjunto estiver vazio, manter o seletor manual de status. Com subtarefas, a web apresenta o status derivado e não oferece seleção direta de `PENDING`/`IN_PROGRESS`.

Ao acionar **Concluir tarefa** com pendências, apresentar diálogo acessível explicando que as pendentes serão concluídas. Cancelar fecha o diálogo sem requisição de mutação; confirmar chama o endpoint explícito com `confirm: true`. Em caso de erro ou 409 de estado alterado, atualizar os dados e informar a pessoa sem anunciar sucesso. A UI espera a resposta antes de atualizar o estado definitivo. Estados de carregamento, vazio, erro e sucesso, foco visível e largura mínima de 320 px seguem as regras do projeto.

### 5. Testes e migração de specs

Integração HTTP com MySQL real em `TEST_DB_NAME` deve cobrir dois usuários, ordem persistente, acesso cruzado negado, 0/parcial/100%, reabertura, primeira e última subtarefa, confirmação cancelada/ausente, conclusão em lote, repetição idempotente e concorrência entre reabertura/conclusão. Testes web cobrem confirmação, ações por teclado e estados de rede. Reconciliar o requisito `Editar campos e alterar status manualmente` da spec `study-tasks` quando ela for publicada: preservar a edição de campos da tarefa e limitar status manual a `total = 0`, mantendo esta capability para as regras de subtarefa. Como `study-tasks` ainda não está em `openspec/specs/`, não criar agora um delta MODIFIED contra um caminho inexistente; revisar os artefatos desta mudança antes do sync/archive, após o predecessor ser publicado.

## Risks / Trade-offs

- [As mudanças precursoras ainda não foram aplicadas] → implementar autenticação e tarefas primeiro; verificar IDs, contratos e migration reais antes de estender o módulo.
- [Status e contagem divergem sob concorrência] → transações e bloqueio da tarefa principal em toda mutação de subtarefa e conclusão em lote; testes concorrentes no MySQL real.
- [Porcentagem arredondada sugere conclusão incorreta] → manter o cálculo integral no DTO, formatar apenas na apresentação e mostrar contagem; 100% visível somente quando todas estiverem concluídas.
- [Ordem quebrada por duas abas] → validar o conjunto completo e serializar por tarefa; a última reordenação válida prevalece.
- [Spec `study-tasks` publicada com status manual irrestrito] → reconciliar seu requisito integral antes do sync/archive desta mudança, respeitando a ordem dos proposals.

## Migration Plan

1. Aplicar `add-user-authentication` e `add-study-tasks` e confirmar a migration `study_tasks`, o middleware de sessão e o contrato `PATCH /tasks/:id`.
2. Aplicar a migration de subtarefas; para tarefas existentes, não criar subtarefas artificiais e preservar os status manuais.
3. Publicar API e web com leitura do progresso derivado, guardas de status e confirmação. Verificar casos de 0, conclusão parcial, 100%, reabertura e exclusão da última subtarefa.
4. Antes do sync/archive, reconciliar a spec principal `study-tasks` com a regra condicional e validar ambas as capabilities. Em rollback de código, preservar a tabela de subtarefas e não apagar dados criados; voltar à interface anterior apenas após decidir como lidar com tarefas que já possuem subtarefas.
