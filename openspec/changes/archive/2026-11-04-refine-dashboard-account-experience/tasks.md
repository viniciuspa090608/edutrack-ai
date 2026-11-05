# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD, staged e alterações preexistentes; usar branch de trabalho adequada ou `codex/refine-dashboard-account-experience`, verificando que master e mudanças alheias permanecem preservadas.

## 2. Conta e configurações

- [x] 2.1 Remover informações e atalho após a verificação do e-mail no resumo lateral e os quatro subtítulos indicados; alinhar títulos com ícones e verificar visualmente Conta, Seu perfil, Aparência e Segurança nos dois temas.
- [x] 2.2 Reorganizar foto: remover título redundante, mover requisitos para abaixo da foto e manter input ao lado do avatar no celular; verificar em 320 px com nome de arquivo longo e preservar preview, salvar, remover, label e ajuda acessível.
- [x] 2.3 Colocar descrição Classroom imediatamente abaixo do título na coluna ao lado do logo; verificar visualmente estados conectado/desconectado e preservar os testes funcionais da integração.
- [x] 2.4 Compactar Acesso à conta, reutilizar ícone Google e alinhar texto/botão com space-between; verificar vínculo presente/ausente, OAuth e logout com layout desktop/mobile sem cortes.
- [x] 2.5 Reunir textos cinza de IA em um parágrafo dinâmico e reduzir espaçamentos; centralizar indicador dos RadioButtons e verificar seleção única, teclado, foco, limites reais e feedback nos dois modos.
- [x] 2.6 Extrair Fuso de estudo como card irmão de Preferências, compactar conteúdo e alinhar título/ícone; verificar âncoras, ordem/destaque do menu, carregamento, salvar, sugestão, erro e retry existentes.

## 3. Tema e Relatório

- [x] 3.1 Separar preferência local de tema efetivo e adicionar Sistema, Claro e Escuro em Aparência, usando remoção da escolha local para Sistema; verificar testes de preferência manual anterior, matchMedia, recarga, sincronização entre abas, storage bloqueado e primeira pintura.
- [x] 3.2 Substituir entradas Estatísticas/Progresso por Relatório no shell desktop e Mais, com entrada em Estatísticas e estado ativo para as duas rotas; verificar testes de navegação, acesso direto, histórico, teclado e menu mobile.
- [x] 3.3 Adequar navegação interna de Relatório para Estatísticas e Progresso sem mudar consultas ou rotas; verificar conteúdo e indicação acessível de cada aba, incluindo acesso direto a Progresso.

## 4. Informações temporais e Home

- [x] 4.1 Remover avisos e sufixos informativos de fuso de Home, Analytics, Progresso, listagem/programação de Rotinas e proveniência Classroom; verificar ausência desses textos, preservação de formulários funcionais e resultados temporais existentes.
- [x] 4.2 Mover data/hora da consulta para o subtítulo do card principal com a frase e formato definidos; verificar instante real, atributo time, ausência de linha externa e orientação sem data fictícia durante loading.
- [x] 4.3 Compartilhar projeção do cronômetro entre Pomodoro e Home a partir do snapshot real; verificar com relógio controlado RUNNING, PAUSED, BETWEEN_BLOCKS, limite zero, retomada e ausência de deriva ou comandos duplicados.
- [x] 4.4 Reconciliar sessão na Home ao entrar, recuperar foco/visibilidade, atingir limite e periodicamente enquanto visível; verificar testes de pausa em outra aba, falha/retry, respostas antigas, consultas sem sobreposição e limpeza ao sair.
- [x] 4.5 Exibir estados vazios com CollectionEmptyState e confirmar ausência real de cadastros, consultando listSubjects quando não houver destaque; verificar zero tarefas, tarefas fora de upcoming, matérias existentes sem destaque, erro e módulos desabilitados.
- [x] 4.6 Integrar ações Adicionar tarefa/matéria da Home aos modais reais com parâmetro consumido uma vez; verificar abertura, cancelamento, foco, gates, recarga e preservação de outros parâmetros sem reabertura indevida.
- [x] 4.7 Expandir cards vazios de Tarefas e Matérias pela área disponível do grid; verificar alinhamento com Pomodoro/Flashcards e Progresso em desktop, altura natural no mobile e ausência de espaços para módulos omitidos.

## 5. Validação e conclusão local

- [x] 5.1 Fazer revisão visual integrada em claro/escuro, 320 px, tablet e desktop, com teclado e movimento reduzido; registrar evidências de alinhamento, espaçamento, foto, cards vazios e cronômetro, corrigindo overflow ou perda de foco.
- [x] 5.2 Executar `openspec validate refine-dashboard-account-experience --strict`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; confirmar resultados reais, usando MySQL isolado para testes de banco exigidos sem substituir configuração por mocks.
- [x] 5.3 Preparar manifesto com arquivos próprios explícitos e seis snapshots de sync por merge semântico, preservando cenários e requisitos posteriores; verificar instruções specs, README, diff revisado e ausência de conflitos antes de concluir.
- [x] 5.4 Executar o fluxo local `pnpm openspec:finish --change refine-dashboard-account-experience --manifest .openspec-local/refine-dashboard-account-experience-manifest.json --message "[update] refinar dashboard e configurações da conta"`; verificar refs reais antes de amend, diff staged e `git diff --cached --check`, confirmar archive, único commit final e arquivos incluídos, sem push/tag e com retomada do journal em caso de falha.
