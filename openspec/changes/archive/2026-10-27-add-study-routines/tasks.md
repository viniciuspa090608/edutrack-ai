# Tasks

## 1. Pré-requisito e contratos

- [x] 1.1 Confirmar `add-user-authentication` aplicado, com tabela `users`, middleware de sessão e área `/app` funcionais; verificar por teste HTTP que uma rota privada aceita sessão válida e recusa ausência de sessão antes de integrar rotinas.
- [x] 1.2 Adicionar em `packages/contracts` schemas/tipos públicos de rotina, horário, lista e programação semanal; verificar por testes dias fora de 1–7, horas inválidas, fuso inválido, nome vazio, horários ausentes e payloads desconhecidos.

## 2. Dados e API

- [x] 2.1 Criar migrations versionadas e entidades de `study_routines` e `study_routine_slots`, com FK para usuário, exclusão em cascata e índices, sem tabelas de tarefas ou Pomodoro; verificar aplicação única e reversão no MySQL isolado, mantendo `synchronize: false`.
- [x] 2.2 Implementar validação de intervalos `[início, fim)` e sobreposição apenas dentro da mesma rotina/dia; verificar horários adjacentes aceitos, sobrepostos rejeitados e coincidência entre rotinas distintas aceita em testes de service.
- [x] 2.3 Implementar criação e edição transacionais da rotina e do conjunto de horários, preservando horas ao trocar fuso; verificar em MySQL real que qualquer erro mantém nome, fuso e horários anteriores intactos.
- [x] 2.4 Implementar lista paginada, detalhe e exclusão com escopo por `userId` autenticado em todas as queries; verificar em testes HTTP/MySQL que ID alheio retorna 404 e que a exclusão remove horários apenas da própria rotina.
- [x] 2.5 Implementar programação semanal própria ordenada de segunda a domingo e por hora local, com nome/fuso de cada rotina; verificar que dois usuários veem apenas seus horários e que mudar o fuso do dispositivo não desloca os valores salvos.
- [x] 2.6 Montar rotas autenticadas de rotinas com validação de entrada, formato uniforme de erro e checagem de origem nas escritas; verificar HTTP 401/400/404, sucesso de CRUD e ausência de chamadas ou gravações nos módulos de tarefas/Pomodoro.

## 3. Interface web

- [x] 3.1 Adicionar `/app/rotinas` à navegação e guarda da área privada, sem importar funcionalidades de tarefas ou Pomodoro; verificar abertura direta sem sessão e acesso com sessão por teste de interface.
- [x] 3.2 Criar formulário de rotina com fuso visível e linhas para adicionar/remover dias e horários diferentes; verificar validação, manutenção de dados após erro, edição e sucesso confirmado pela API.
- [x] 3.3 Criar lista e programação recorrente semanal com dias e horários ordenados, fuso identificado e estados vazio/loading/erro; verificar renderização correta de rotinas com horários em vários dias e fuso diferente do dispositivo.
- [x] 3.4 Adicionar edição e exclusão com confirmação acessível; verificar cancelamento sem mutação, erro sem falso sucesso e remoção da programação após exclusão confirmada.
- [x] 3.5 Ajustar programação e formulários para teclado, foco visível e viewport de 320 px, usando grupos verticais por dia no mobile; verificar visualmente ausência de rolagem horizontal e operação completa sem mouse.

## 4. Verificações e entrega

- [x] 4.1 Atualizar README com criação de horários semanais, fuso, intervalos no mesmo dia e independência de tarefas/Pomodoro; verificar que a documentação corresponde aos fluxos e limites implementados.
- [x] 4.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` com MySQL real em `TEST_DB_NAME` e `pnpm build`; verificar código zero nos quatro comandos e corrigir falhas.
- [x] 4.3 Executar `openspec validate add-study-routines --strict` e conferir manualmente CRUD, programação, fusos, isolamento de dois usuários e tela de 320 px; verificar validação sem erros e cenários da spec atendidos.
- [x] 4.4 Revisar e adicionar somente arquivos/hunks desta mudança, incluindo `tasks.md` final, executar `git diff --cached --check` e criar o único commit de conclusão no formato de `AGENTS.md`; verificar hash e arquivos incluídos.
