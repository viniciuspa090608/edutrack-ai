# Tasks

## 1. Preparar integração

- [x] 1.1 Registrar estado Git e alterações preexistentes, confirmar autenticação, preferências e todos os módulos produtores aplicados; verificar contratos públicos de resumo e links antes de editar.
- [x] 1.2 Adicionar schemas e tipos de resposta composta com seções `ready`, `empty` e `error`, omissão de módulos desativados e `asOf`; verificar casos válidos e inválidos em testes de contratos.

## 2. Composição da API

- [x] 2.1 Implementar `GET /dashboard` autenticado lendo preferências primeiro e chamando somente serviços públicos habilitados, com filtro por usuário e erro isolado por seção; verificar duas contas, ausência de sessão e módulos desativados em testes HTTP.
- [x] 2.2 Integrar resumo de tarefas com até cinco prazos, status e progresso recebido do módulo e matéria/roadmap de seleção automática estável; verificar atrasos, empate, ausência de prazo, ausência de roadmap e estudo sem pendências.
- [x] 2.3 Integrar estado e total de sessões Pomodoro, pendências da repetição espaçada, sequência oficial e semana do analytics no fuso salvo; verificar valores iguais aos módulos de origem, indisponibilidade parcial e nenhuma regra duplicada.

## 3. Dashboard web

- [x] 3.1 Substituir a área inicial de `/app` por página protegida com cartões, links e estados de carregamento/erro/vazio, sem renderizar dados antes de confirmar sessão; verificar login, acesso direto e conta nova em testes web.
- [x] 3.2 Integrar **Iniciar Pomodoro** e **Retomar Pomodoro** pelo fluxo público, consultando sessão após conflito ou falha de rede; verificar concorrência entre abas sem criar sessão dupla.
- [x] 3.3 Aplicar visibilidade por preferências, orientação para reativação e atualização após mudança em outra aba; verificar que módulos desligados não aparecem e que reativação recupera resumos.
- [x] 3.4 Verificar navegação por teclado, foco, movimento reduzido e layout desde 320 px, com equivalentes textuais dos resumos e erro isolado; confirmar inspeção visual e testes de interface.

## 4. Conclusão do apply

- [x] 4.1 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate compose-user-dashboard --strict`; corrigir falhas e verificar cenários das specs.
- [x] 4.2 Revisar diff e alterações preexistentes, adicionar somente arquivos/hunks deste apply, executar `git diff --cached --check` e criar exatamente um commit com implementação e `tasks.md` final; confirmar hash e arquivos incluídos.
