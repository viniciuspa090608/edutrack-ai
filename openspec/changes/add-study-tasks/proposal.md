# Proposal

## Why

A EduTrack ainda não oferece um lugar para o usuário organizar compromissos de estudo. Um módulo de tarefas próprio cria o primeiro fluxo de planejamento utilizável após a autenticação, sem depender de IA ou dos demais módulos.

## What Changes

- Adicionar criação, visualização, edição e exclusão de tarefas do usuário autenticado, com título, descrição opcional, importância, prazo opcional e status `PENDING`, `IN_PROGRESS` ou `COMPLETED`.
- Permitir mudança manual de status e listagem com filtros combináveis por status, importância e intervalo de prazo.
- Restringir todas as operações e consultas às tarefas do usuário autenticado, inclusive quando um ID de outro usuário for informado diretamente.
- Expor a funcionalidade em uma área web protegida, com estados de carregamento, erro, vazio e sucesso e uso por teclado em telas a partir de 320 px.
- Deixar subtarefas e cálculo automático de progresso para `add-task-subtasks-and-progress`. A associação com matérias será planejada quando o módulo de matérias existir; este módulo funciona sem essa relação.

## Capabilities

### New Capabilities

- `study-tasks`: ciclo de vida, status, importância, prazo, filtros e isolamento por usuário das tarefas.

### Modified Capabilities

- `shared-contracts`: ampliar os contratos de fronteira para a funcionalidade de tarefas implementada, preservando a separação entre DTOs públicos e entidades da API.

## Impact

- `apps/api`: módulo de tarefas com controller, service, repository, rotas protegidas e migration MySQL versionada.
- `packages/contracts`: schemas e tipos para entradas, filtros e respostas das tarefas.
- `apps/web`: página de tarefas na área autenticada, formulários, filtros e navegação.
- Dependência de execução da autenticação definida em `add-user-authentication`, ainda não aplicada; não se cria uma segunda identidade ou sessão neste módulo. Testes de integração usam MySQL real isolado.
