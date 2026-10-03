# Proposal

## Why

Após entrar, o usuário precisa de uma visão imediata do que estudar e de como está avançando. Os módulos já planejados têm seus próprios dados e regras; o dashboard deve reuni-los sem criar outra fonte de verdade.

## What Changes

- Substituir a área inicial mínima de `/app` por um dashboard privado, destino após login e abertura direta de uma sessão válida.
- Resumir próximas tarefas e seu progresso, matéria/roadmap em destaque, início ou retomada de Pomodoro, sessões realizadas, sequência de dias, flashcards pendentes e progresso da semana.
- Selecionar automaticamente a matéria em destaque entre as próprias matérias com estudo pendente, com ordenação previsível; mostrar seu roadmap quando houver um ativo.
- Omitir cartões de tarefas, matérias e flashcards quando os respectivos módulos estiverem desativados; preservar informações dos demais módulos e atualizar após mudança de preferência.
- Oferecer links para o módulo de cada resumo e orientações úteis para primeiros passos ou ausência de dados, sem simular dados.

## Capabilities

### New Capabilities

- `user-dashboard`: composição privada de resumos de estudo, navegação contextual, estados vazios e visibilidade por preferência.

### Modified Capabilities

- `shared-contracts`: contrato público do resumo composto e de seus estados de disponibilidade para web e API.

## Impact

- `apps/api`: leitura composta por serviços públicos de tarefas, matérias/roadmaps, Pomodoro, repetição espaçada, estatísticas semanais, sequência e preferências, sempre no escopo da sessão.
- `apps/web`: `/app` como dashboard responsivo, cartões, links contextuais e ação de Pomodoro.
- `packages/contracts`: schemas e tipos de resposta do dashboard.
- O apply depende de autenticação, preferências, tarefas/subtarefas, matérias/roadmaps, Pomodoro, flashcards/repetição espaçada, estatísticas e `add-study-streaks-and-achievements`. O dashboard não define regras internas desses módulos.
