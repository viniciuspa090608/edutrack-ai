# Proposal

## Why

A EduTrack ainda não permite planejar horários de estudo recorrentes. Um módulo de rotinas dá ao usuário uma visão semanal do tempo que pretende reservar para estudar, independentemente de tarefas e sessões Pomodoro.

## What Changes

- Permitir criar, visualizar, editar e excluir rotinas próprias, cada uma com nome e um ou mais horários semanais. Cada horário define dia da semana, início e fim; a mesma rotina pode ter horários diferentes em dias distintos.
- Exibir a programação recorrente em uma visão semanal ordenada por dia e horário, com o fuso da rotina identificado e estados vazios/erro claros.
- Validar horários, impedir sobreposição dentro da mesma rotina e manter as operações restritas ao usuário autenticado, inclusive em acessos diretos por ID.
- Manter rotinas como planos recorrentes: criar ou editar uma rotina não cria tarefa nem sessão Pomodoro, e o módulo continua utilizável sem esses serviços.

## Capabilities

### New Capabilities

- `study-routines`: manutenção de rotinas semanais, horários recorrentes, visualização da programação e isolamento por usuário.

### Modified Capabilities

- `shared-contracts`: adicionar contratos públicos de rotinas e horários para web e API sem compartilhar entidades de persistência.

## Impact

- `apps/api`: módulo de rotinas com rotas autenticadas, validação de recorrência, repositories e migrations MySQL versionadas.
- `packages/contracts`: schemas e tipos de rotinas, horários e programação semanal.
- `apps/web`: página protegida de rotinas com formulário e visão semanal acessível a partir de 320 px.
- Requer a autenticação de `add-user-authentication`, ainda não aplicada. Não depende da implementação de tarefas, matérias ou Pomodoro.
