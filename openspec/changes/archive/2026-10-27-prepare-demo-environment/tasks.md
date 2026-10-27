# Tasks

## 1. Baseline e preparação

- [x] 1.1 Antes de editar código, registrar branch, HEAD, remotos, status completo com novos/removidos e diffs preexistentes em local ignorado; verificar inventário e atribuir os artefatos prepare-demo-environment ao escopo novo.
- [x] 1.2 Revisar alterações preexistentes para segredos, caminhos locais e artefatos gerados indevidos; produzir relação dos arquivos elegíveis ao segundo commit e das exclusões preservadas no working tree.

## 2. Operações explícitas de banco

- [x] 2.1 Implementar demo:inspect com configuração efetiva e saída sem segredos; verificar host, porta, banco, tabelas e migrations pendentes.
- [x] 2.2 Implementar guardas de desenvolvimento, host local, banco não sistêmico e confirmação completa do alvo para reset; testar rejeição em production/test e confirmação ausente/incorreta antes de qualquer escrita.
- [x] 2.3 Implementar lista de tabelas conferida contra migrations e banco, TRUNCATE em sessão dedicada e restauração de FOREIGN_KEY_CHECKS em finally; validar em MySQL isolado preservação integral do esquema e histórico de migrations, rejeição de tabela inesperada e comportamento em falha parcial.
- [x] 2.4 Expor demo:reset e demo:seed independentes do dev e exigir banco vazio/migrations aplicadas para população; verificar que comandos recusados não alteram dados e que dev não invoca reset/seed.

## 3. Perfis e histórico

- [x] 3.1 Criar fixtures determinísticas com data-base validada, timezone e transação única, contas confirmadas e hash pelo utilitário existente; validar login dos três perfis e rollback em falha de população.
- [x] 3.2 Popular perfil ativo com tarefas/subtarefas, matérias/roadmaps e versões, rotinas, sessões Pomodoro, decks/importação e revisões em estados representativos; conferir vínculos, estados e todos os módulos habilitados por consultas autenticadas.
- [x] 3.3 Popular intermediário com progresso parcial e revisões pendentes e iniciante com uma matéria/tarefa e demais módulos vazios; verificar os cenários distintos pelas respostas da API e telas.
- [x] 3.4 Inicializar tracking_started_at_utc e histórico de timezone antes do primeiro evento histórico; publicar atividades cronologicamente com transições idempotentes e obter projeções existentes; validar estatísticas, sequência e conquistas contra os registros fonte sem chamadas reais à IA ou envio de e-mail.
- [x] 3.5 Testar reset seguido de seed repetido com a mesma data-base e segunda população sem reset; conferir composição reproduzível e recusa sem duplicações, incluindo eventos e conquistas.
- [x] 3.6 Validar isolamento dos três usuários em leitura e mutação de recursos dos demais usando MySQL real isolado; confirmar ausência de vazamento e alterações cruzadas.

## 4. Inicialização e rede local

- [x] 4.1 Disponibilizar npm run dev delegando a pnpm e preparando contratos/UI antes de supervisionar web/API/worker; verificar início único e falha de preparação com saída não zero.
- [x] 4.2 Implementar encerramento conjunto compatível com Windows; verificar Ctrl+C, falha de processo filho e liberação das portas sem processos órfãos.
- [x] 4.3 Configurar Vite com --host 0.0.0.0, --port 5173 e --strictPort e proxy /api para API; validar erro com porta ocupada e consultas/health sem prefixos duplicados.
- [x] 4.4 Ajustar cliente HTTP de desenvolvimento e política compartilhada de origens explícitas para CORS e validações de mutação; validar login, cookie persistente, logout e mutação em localhost/LAN, rejeição de origem não autorizada e manutenção das proteções em produção.

## 5. Documentação e aceitação

- [x] 5.1 Atualizar README e .env.example com Node/pnpm, MySQL local, migrations, SMTP/Mailpit, credenciais demo, data-base, confirmação de reset, backup, portas, IP LAN e firewall; verificar procedimento reproduzível sem expor configuração local ou segredos.
- [x] 5.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build; registrar resultados e corrigir falhas, usando MySQL real e banco isolado sem mascarar configuração por mocks.
- [x] 5.3 Inspecionar o banco efetivo de desenvolvimento e apresentar host:porta/banco à pessoa; obter confirmação explícita desse alvo antes de qualquer TRUNCATE, verificar processos parados e então executar reset e seed documentados.
- [x] 5.4 Validar três logins e fluxos principais na interface: tarefas/subtarefas, matérias/roadmaps, rotinas, Pomodoro, flashcards/revisões, estatísticas/progresso e estados vazios; verificar teclado, largura 320 px e movimento reduzido nas telas afetadas e acesso LAN real.

## 6. Commits locais

- [x] 6.1 Finalizar tasks.md com todas as tarefas de implementação e checks concluídas; separar arquivos/hunks da mudança, incluindo os artefatos OpenSpec, revisar diff staged e executar git diff --cached --check; criar exatamente um commit da mudança com mensagem [tipo] descrição objetiva e confirmar hash/arquivos. Nenhum commit de conclusão em apply pausado ou com falha.
- [x] 6.2 Adicionar explicitamente somente alterações preexistentes elegíveis revisadas, separando hunks compartilhados; revisar segundo diff staged, executar git diff --cached --check e criar segundo commit com mensagem [tipo] descrição objetiva; confirmar hash/arquivos e informar exclusões sem criar commit vazio.

Publicação, push e criação de repositório cancelados pela pessoa durante o apply em 2026-10-03. Permanecem dois commits locais distintos; não criar tags nem arquivar.
