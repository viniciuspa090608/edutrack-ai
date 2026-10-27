# Tasks

## 1. Contratos e persistência

- [x] 1.1 Integrar os modelos já aplicados de `add-manual-flashcards` e `import-flashcards` à revisão programada sem duplicar entidades; verificar que criação manual e importação passam pela mesma regra de agendamento inicial.
- [x] 1.2 Adicionar schemas e tipos de avaliação, revisão esperada, chave idempotente, pendências, estado e histórico em `packages/contracts`; verificar testes de valores válidos, avaliação/ID inválidos e campos extras.
- [x] 1.3 Criar migrations versionadas para estado 1:1 e eventos de revisão com índices, vínculos e exclusão em cascata; verificar apply e rollback em MySQL real isolado com `synchronize: false`.
- [x] 1.4 Inicializar em backfill os cartões existentes como pendentes sem inventar avaliações anteriores; verificar migration repetível e contagens em teste de banco.

## 2. Política de agendamento

- [x] 2.1 Criar interface pura de política e registro de versão `sm2-inspired-v1`, separados de repositories, HTTP e CRUD; verificar teste com implementação substituta que consome a mesma interface.
- [x] 2.2 Implementar intervalos iniciais `AGAIN` 10 minutos, `HARD` 1 dia, `GOOD` 3 dias e `EASY` 5 dias a partir de relógio controlado; verificar teste de tabela com os quatro resultados exatos em UTC.
- [x] 2.3 Implementar multiplicadores, facilidade entre 1,3 e 3,0, teto de 365 dias e reinício após `AGAIN`; verificar testes de sequências repetidas, limites e cálculo determinístico.
- [x] 2.4 Registrar versão e estado da política em decisões e eventos, rejeitando estado incompatível sem migração explícita; verificar teste que uma política futura não reinterpreta histórico v1.

## 3. API de revisão

- [x] 3.1 Integrar criação manual e importação ao estado inicial transacional; verificar em MySQL que cartões novos de ambos os fluxos ficam pendentes imediatamente e que falha não deixa estado órfão.
- [x] 3.2 Integrar edição efetiva de frente/verso ao reinício do estado, mantendo eventos antigos e geração do conteúdo; verificar testes de edição real, PATCH idêntico e exclusão de cartão/baralho.
- [x] 3.3 Implementar consulta paginada de pendentes por usuário com filtro opcional de baralho e ordem por vencimento/ID, sem verso na lista; verificar cartões vencidos, futuros, lista vazia e isolamento de duas contas.
- [x] 3.4 Implementar avaliação transacional com propriedade, preferência do módulo, revisão esperada e chave idempotente; verificar testes MySQL de primeira confirmação, repetição, concorrência, cartão não pendente e rollback em falha.
- [x] 3.5 Expor histórico paginado de avaliações próprias com instante, nível, intervalo, próxima data e versão da política; verificar testes HTTP de isolamento, ordem estável e preservação após edição do cartão.
- [x] 3.6 Expor rotas autenticadas de pendentes, avaliação e histórico, sem depender de IA; verificar chamadas sem sessão, módulo desativado, IDs alheios e `ai_enabled=false`.

## 4. Interface de revisão

- [x] 4.1 Adicionar acesso à fila pendente e estados de loading, erro e vazio na página de flashcards, mostrando baralho e vencimento sem antecipar o verso; verificar testes de renderização e ordenação.
- [x] 4.2 Implementar sessão com frente inicial, ação **Revelar resposta** e quatro avaliações disponíveis apenas após revelar; verificar por teste de interação que sair sem avaliar não envia escrita e que a consulta manual permanece independente.
- [x] 4.3 Após avaliação, mostrar a próxima data local, retirar o cartão da fila e avançar sem duplicar envio; verificar sucesso, erro de rede com repetição idempotente e conflito de revisão.
- [x] 4.4 Mostrar histórico do cartão com avaliações e datas, mantendo foco visível, teclado, movimento reduzido e layout a 320 px; verificar testes de acessibilidade e inspeção no navegador.

## 5. Verificações finais

- [x] 5.1 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` com MySQL real e banco de teste isolado; verificar código zero nos quatro comandos.
- [x] 5.2 Executar `openspec validate add-spaced-repetition --strict` e conferir manualmente fila, revelação, avaliações, histórico e proteção por usuário; verificar todos os cenários da spec.
