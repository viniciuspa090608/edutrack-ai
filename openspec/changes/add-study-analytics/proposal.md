# Proposal

## Why

A EduTrack registra atividades de estudo em módulos separados, mas ainda não reúne esses dados para mostrar frequência e evolução. Uma área de estatísticas permite acompanhar o trabalho realizado sem introduzir regras de recompensas ou sequências de dias.

## What Changes

- Criar uma área privada de estatísticas por dia, semana, trimestre, semestre e ano, com comparação ao período anterior e série diária no fuso escolhido pelo usuário.
- Mostrar tempo ativo estudado, sessões Pomodoro concluídas, tarefas concluídas, flashcards avaliados em revisão, itens concluídos do plano manual de matérias e, separadamente, blocos concluídos de roadmaps.
- Calcular frequência como dias com ao menos uma atividade registrada no período, sem transformar esse número em sequência de dias.
- Derivar resultados de registros de atividade por usuário, incluindo tempo parcial de Pomodoro cancelado, com proteção contra eventos duplicados.
- Mostrar só métricas de módulos habilitados e estados claros para ausência de dados ou histórico não disponível.
- Reservar regras de sequência de dias e conquistas para `add-study-streaks-and-achievements`.

## Capabilities

### New Capabilities

- `study-analytics`: agregações por período e fuso, comparação, frequência, autorização e apresentação das métricas de estudo.

### Modified Capabilities

- `shared-contracts`: schemas e tipos públicos de filtros de período, fuso, séries e resultados de estatísticas.

## Impact

- `apps/api`: projeções idempotentes dos registros de tarefas, Pomodoro, revisão de flashcards e matérias/roadmaps; consultas autenticadas e migrations para eventos ou intervalos que faltam.
- `apps/web`: página privada responsiva de estatísticas com seletor de período/fuso, métricas, evolução e estados vazios.
- `packages/contracts`: contratos de consulta e resposta.
- O apply depende dos módulos produtores e de preferências: `add-study-tasks`, `add-pomodoro-sessions`, `add-subjects`, `generate-subject-roadmaps-with-ai`, `add-spaced-repetition`, autenticação e `add-profile-and-module-preferences`. Não depende de IA habilitada.
