# Proposal

## Why

A EduTrack ainda não registra períodos de foco. Um Pomodoro com tempo ativo apurado de forma confiável permite acompanhar estudo real sem somar pausas e fornece dados úteis às estatísticas futuras.

## What Changes

- Adicionar sessões de foco com iniciar, pausar, continuar, cancelar e concluir. Uma sessão pode conter vários blocos de 25 minutos ativos; pausas não contam, e o tempo anterior a elas é preservado.
- Registrar todo o tempo ativo acumulado e cada bloco efetivamente completado. Ao atingir 25 minutos ativos em um bloco, o cronômetro para até a pessoa iniciar o próximo; cancelar preserva tempo parcial e blocos já obtidos.
- Permitir vínculo opcional com uma tarefa existente do próprio usuário; a sessão continua utilizável sem tarefa. Deixar associação com matéria para quando esse módulo existir.
- Exibir cronômetro e histórico próprios, com estados de sessão e recuperação após recarga. Proteger transições concorrentes e impedir contagem duplicada.

## Capabilities

### New Capabilities

- `pomodoro-sessions`: ciclo de vida, relógio de tempo ativo com vários blocos por sessão, vínculo opcional com tarefa e dados de tempo/blocos para estatísticas.

### Modified Capabilities

- `shared-contracts`: estender o contrato de fronteira compartilhado com entradas e respostas de sessões Pomodoro quando essa funcionalidade for implementada, sem expor entidades de persistência.

## Impact

- `apps/api`: módulo Pomodoro, rotas autenticadas, persistência MySQL, controle transacional de transições e leitura agregável de tempo/blocos.
- `apps/web`: página e cronômetro de sessões, ações de pausa/continuação/cancelamento/conclusão, histórico e seletor opcional de tarefa.
- `packages/contracts`: schemas e tipos públicos de sessões e totais; testes com relógio controlado e MySQL real isolado.
- Dependência de `add-user-authentication` e `add-study-tasks`, ainda em planejamento. A proposta de preferências de módulos será respeitada quando aplicada; matérias e dashboard de estatísticas permanecem fora deste incremento.
