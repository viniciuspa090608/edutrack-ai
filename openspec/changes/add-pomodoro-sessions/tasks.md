# Tasks

## 1. Dependências e persistência

- [x] 1.1 Confirmar `add-user-authentication` e `add-study-tasks` aplicadas, com sessão e tarefa própria acessíveis; verificar migrations, rotas e `openspec status` antes de implementar Pomodoro.
- [x] 1.2 Reconciliar o delta `shared-contracts` desta mudança com a versão principal vigente após tarefas, preservando todos os cenários publicados; verificar `openspec validate add-pomodoro-sessions --strict` sem perda de requisitos.
- [x] 1.3 Criar migrations versionadas de `pomodoro_sessions` e slot único de sessão aberta por usuário, com FK de tarefa anulável e `ON DELETE SET NULL`; verificar aplicação/reexecução em MySQL isolado, unicidade de sessão aberta e preservação do histórico após exclusão da tarefa.
- [x] 1.4 Adicionar schemas e tipos públicos de comandos, estados, histórico e totais em `packages/contracts`, sem campos de tempo aceitos do cliente; verificar por testes de contrato rejeição de payload inválido e validação das respostas.

## 2. Relógio e transições

- [x] 2.1 Implementar cálculo autoritativo de tempo ativo por trechos de execução com relógio do banco e limite de 25 minutos por bloco; verificar com relógio controlado 10 minutos ativos, 5 pausados e mais 15 ativos resultando em 25 ativos.
- [x] 2.2 Implementar iniciar com sessão aberta única e recuperação por `GET current`; verificar duas abas iniciando ao mesmo tempo, recarga e conflito sem criar segunda sessão em MySQL real.
- [x] 2.3 Implementar pausar e continuar com estado/versão e transação, preservando tempo acumulado; verificar pausas repetidas, retomada após vários minutos e comandos obsoletos sem tempo duplicado.
- [x] 2.4 Implementar crédito único no fim de cada bloco e **Iniciar próximo bloco** na mesma sessão; verificar 25 e 50 minutos ativos, parada entre blocos, repetição concorrente e ausência de contagem durante espera.
- [x] 2.5 Implementar concluir somente após ao menos um bloco, preservando trecho parcial posterior e retornando resultado idempotente; verificar conclusão antecipada recusada, 35 minutos/um bloco, 50 minutos/dois blocos e repetição sem crédito extra.
- [x] 2.6 Implementar cancelar de qualquer estado não terminal, preservando tempo parcial e blocos completos, liberando o slot aberto; verificar 10 minutos/zero blocos, 35 minutos/um bloco, repetição e início de nova sessão.

## 3. Tarefa, segurança e dados de estatística

- [x] 3.1 Validar vínculo opcional por interface pública do módulo de tarefas e nunca consultar repository interno, mantendo status/progresso da tarefa inalterados; verificar tarefa própria, alheia, inexistente e exclusão concorrente em testes HTTP/MySQL.
- [x] 3.2 Se preferências de módulos estiverem aplicadas, ocultar associação quando tarefas estiverem desligadas e recusar `taskId` direto, mantendo Pomodoro sem tarefa; verificar ambas as combinações sem acesso indevido a tarefas.
- [x] 3.3 Implementar rotas autenticadas de detalhe, histórico paginado e totais de tempo ativo/blocos apenas de sessões terminais, sempre filtradas por usuário; verificar 25 + 10 = 35 minutos/um bloco, sessão aberta excluída do total e ID alheio retornando 404.
- [x] 3.4 Aplicar proteção de origem/CSRF e escopo da sessão às transições, sem aceitar `userId` ou tempo do cliente; verificar ausência de sessão, origem proibida e tentativa de alterar sessão alheia.

## 4. Interface Pomodoro

- [x] 4.1 Criar `/app/pomodoro` protegida com estado atual, cronômetro derivado do servidor, tempo restante no bloco e blocos concluídos; verificar recarga, aba em segundo plano e atualização após retorno sem acumular tempo de pausa.
- [x] 4.2 Adicionar controles contextuais de iniciar, pausar, continuar, iniciar próximo bloco, cancelar e concluir, com confirmação de cancelamento e estados de carregamento/erro/sucesso; verificar indisponibilidade de ações inválidas e recuperação por nova leitura após resposta perdida.
- [x] 4.3 Adicionar histórico/totais e seletor opcional de tarefa própria, sem depender de matéria ou IA; verificar sessão sem tarefa, tarefa excluída e tarefa desativada por preferência quando aplicável.
- [x] 4.4 Ajustar página para teclado, leitor de tela, foco, movimento reduzido e largura de 320 px; verificar manualmente e por testes de interação que todos os controles e estados são utilizáveis.

## 5. Verificação de conclusão

- [x] 5.1 Executar testes de integração com MySQL real em `TEST_DB_NAME` e relógio controlado para pausas, múltiplos blocos, cancelamento parcial, concorrência, isolamento e persistência; verificar `pnpm test` completo sem espera real de 25 minutos.
- [x] 5.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate add-pomodoro-sessions --strict`; verificar saídas zero antes de concluir o apply.
- [x] 5.3 Revisar apenas arquivos/hunks desta mudança, incluindo `tasks.md` final, executar `git diff --cached --check` e criar o único commit de conclusão no formato de `AGENTS.md`; verificar hash e lista de arquivos incluídos.
