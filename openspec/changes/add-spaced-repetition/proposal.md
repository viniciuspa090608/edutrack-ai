# Proposal

## Why

Os flashcards manuais previstos hoje permitem consultar perguntas e respostas, mas não indicam quando retomar cada cartão. Revisões programadas ajudam a priorizar o que está pendente e a adaptar os próximos intervalos ao desempenho registrado.

## What Changes

- Mostrar cartões próprios pendentes de revisão; cartões novos entram nessa lista imediatamente. Na sessão, a frente aparece primeiro, a pessoa revela a resposta e então avalia o cartão como `AGAIN`, `HARD`, `GOOD` ou `EASY`.
- Registrar cada avaliação com data e calcular a próxima revisão a partir do estado e histórico do cartão, usando inicialmente uma política inspirada no SM-2. Na primeira avaliação, os intervalos serão **`AGAIN`: 10 minutos; `HARD`: 1 dia; `GOOD`: 3 dias; `EASY`: 5 dias**.
- Separar o cálculo de agendamento das regras de criação, edição e consulta de flashcards, com versão de algoritmo registrada, para permitir outra política no futuro sem perder o histórico.
- Manter a revisão manual por revelação disponível sem avaliação, e fazer a repetição espaçada funcionar sem IA. Editar frente ou verso reinicia o agendamento do cartão para revisão imediata, preservando o histórico anterior.
- Proteger lista de pendentes, avaliações e histórico pelo usuário autenticado e pela preferência do módulo de flashcards.

## Capabilities

### New Capabilities

- `spaced-repetition`: fila de cartões pendentes, sessão de avaliação, agendamento versionado e histórico de revisões por cartão.

### Modified Capabilities

- `shared-contracts`: acrescentar tipos e schemas públicos para avaliações, estado de agendamento, pendências e histórico, com validação de entrada externa.

## Impact

- Depende de `add-manual-flashcards`, `import-flashcards`, autenticação e preferências de módulo; os cartões e baralhos ainda não estão implementados. Cartões criados manualmente ou por importação seguem a mesma regra inicial de pendência.
- `apps/api`: estado de agendamento e eventos de revisão persistidos em MySQL, endpoints autenticados e serviço de política de agendamento separado do CRUD de flashcards.
- `apps/web`: lista de pendentes, fluxo de revelar e avaliar, próxima data e histórico, com teclado, estados de loading/erro/vazio/sucesso e layout a partir de 320 px.
- `packages/contracts`: schemas de fronteira para avaliações e DTOs. Não exige provedor de IA nem altera os dados de matérias, tarefas ou Pomodoro.
