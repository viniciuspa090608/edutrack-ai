# Proposal

## Why

O módulo de tarefas planejado em `add-study-tasks` trata cada tarefa como uma unidade única. Subtarefas permitem acompanhar passos menores e manter o status da tarefa principal coerente com o trabalho concluído.

## What Changes

- Permitir criar, editar, excluir, concluir, reabrir e reordenar subtarefas de uma tarefa própria.
- Quando houver subtarefas, calcular o progresso como **concluídas ÷ total × 100** sem persistir o percentual; derivar o status da tarefa principal: `PENDING` sem nenhuma concluída, `IN_PROGRESS` com conclusão parcial e `COMPLETED` quando todas estiverem concluídas.
- Atualizar o status da tarefa principal ao reabrir ou alterar subtarefas. Sem subtarefas, manter o status manual da tarefa.
- Ao tentar concluir manualmente uma tarefa com subtarefas pendentes, pedir confirmação antes de concluir todas elas em uma única operação; cancelamento não altera dados.
- Manter operações e consultas restritas ao usuário autenticado, sem depender de IA ou de outros módulos.

## Capabilities

### New Capabilities

- `task-subtasks-and-progress`: ciclo de vida e ordenação das subtarefas, progresso calculado e status derivado da tarefa principal, com conclusão em lote confirmada.

### Modified Capabilities

`add-study-tasks` foi implementada e concluída no commit `e7c0849`, mas sua spec principal ainda não foi publicada em `openspec/specs/study-tasks/`. Por isso a condição da tarefa 1.2 foi verificada e não se aplica neste apply: não existe requisito principal contra o qual criar um delta MODIFIED. Esta capability define status manual somente sem subtarefas. Quando a spec predecessora for sincronizada, o requisito integral de edição/status deverá ser reconciliado com essa regra antes do sync/archive desta mudança, conforme o design.

## Impact

- `apps/api`: tabela de subtarefas e operações transacionais no módulo de tarefas; leitura de progresso derivado e proteção de conclusão manual.
- `packages/contracts`: contratos de subtarefa, ordenação, contagem/progresso e confirmação explícita.
- `apps/web`: controles de subtarefas na página de tarefas, reordenação acessível, progresso e diálogo de confirmação.
- Requer `add-user-authentication` e `add-study-tasks` implementados antes do apply. O percentual não ganhará coluna no banco.
