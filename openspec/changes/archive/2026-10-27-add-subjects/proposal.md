# Proposal

## Why

A EduTrack ainda não oferece um lugar para reunir o objetivo, a disponibilidade e o progresso de estudo de cada matéria. O planejamento precisa funcionar por edição manual, inclusive quando os recursos de IA estiverem desativados.

## What Changes

- Criar, listar, consultar, editar e excluir matérias próprias com nome, nível atual, objetivo, prazo, horas disponíveis por semana e assuntos já conhecidos.
- Permitir uma lista manual e ordenável de assuntos a estudar, com progresso individual, independente de geração por IA.
- Permitir associação opcional de tarefas e sessões Pomodoro a uma matéria própria, preservando essas entidades e seus fluxos autônomos quando não houver matéria ou ela for excluída.
- Aplicar a preferência do módulo de matérias à navegação, páginas e ações, sem apagar dados; a preferência de IA não bloqueia o planejamento manual.
- Deixar geração de roadmaps com IA para `generate-subject-roadmaps-with-ai`.

## Capabilities

### New Capabilities

- `study-subjects`: dados e plano manual da matéria, isolamento por usuário e associações opcionais com tarefas e Pomodoro.

### Modified Capabilities

- `shared-contracts`: acrescentar schemas públicos de matérias, itens de estudo e associações opcionais para uso comum da web e API.

## Impact

- `apps/api`: módulo de matérias, rotas autenticadas, migrations MySQL e integração por contratos públicos com tarefas e Pomodoro.
- `apps/web`: página protegida de matérias, edição do plano manual e seletores opcionais de matéria nos fluxos de tarefas e Pomodoro.
- `packages/contracts`: validação de entradas e DTOs de matérias e vínculos.
- Depende, para o apply completo, de autenticação, tarefas e Pomodoro. A preferência de módulos planejada em `add-profile-and-module-preferences` deve ser respeitada quando aplicada. Nenhum serviço de IA é necessário.
