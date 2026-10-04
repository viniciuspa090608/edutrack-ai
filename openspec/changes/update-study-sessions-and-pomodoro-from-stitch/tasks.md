# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD, status e diffs preexistentes no início do apply; verificar que arquivos/hunks externos estão identificados e preservados.
- [x] 1.2 Usar o inventário e a matriz Stitch→EduTrack de design.md como base, verificando diferenças desde a proposta somente nos arquivos mapeados; registrar em validation.md qualquer divergência relevante antes de editar.

## 2. Linguagem visual e preparação

- [x] 2.1 Definir classes e aliases semânticos locais em pomodoro.css para cards, títulos, badges, feedback, timer e ações nos dois temas; verificar uso dos tokens atuais e ausência de impacto visual global.
- [x] 2.2 Atualizar cabeçalho e card de preparação/início com seletores opcionais de tarefa e matéria, incluindo paginação/loading/erro existentes; verificar mesmos IDs/payloads e disponibilidade segundo preferências nos testes UI focados.
- [x] 2.3 Derivar loading, vazio e erro/retry da preparação com o padrão Stitch; verificar distinção visual sem dados de exemplo nem execução fictícia.

## 3. Sessão e encerramento

- [x] 3.1 Atualizar card ativo com timer dominante, ring decorativo derivado do tempo efetivo/1500 segundos, contexto real, total ativo e blocos; verificar que refs, elapsed, boundary, tick e efeitos permanecem equivalentes e não há ciclo total inventado.
- [x] 3.2 Estilizar RUNNING, PAUSED e BETWEEN_BLOCKS com status textual e ações existentes; verificar pause/resume/next-block, congelamento em pausa e limite do bloco, sem criar timer de intervalo ou avanço automático.
- [x] 3.3 Atualizar confirmação de cancelamento e feedback de conclusão/cancelamento, usando classe própria no portal; verificar foco, Escape, preservação de tempo, Concluir condicionado a blocks>0 e mesmos comandos/version enviados.
- [x] 3.4 Atualizar sincronização, busy, erros de ação e recuperação sem mudar handlers; verificar falha/resposta perdida, ready=false e ausência de comandos antes da recuperação nos testes focados.

## 4. Histórico e totais

- [x] 4.1 Atualizar cards de totais usando somente summary e histórico usando registros reais de conclusão/cancelamento; verificar duração, blocos, timestamps/vínculos disponíveis e que sessão aberta não é somada aos totais.
- [x] 4.2 Estilizar filtro de matéria, paginação e estados vazio/loading/erro do histórico sem novas rotas; verificar ordem recebida, reset de página ao filtrar e fallbacks de associação sem requests em massa.

## 5. Temas, mobile e acessibilidade

- [x] 5.1 Ajustar grid/empilhamento, timer fluido, texto longo, ações e confirmação em 320, 375, 768 e 1280 px; verificar no navegador ausência de overflow e acesso aos controles essenciais.
- [x] 5.2 Verificar e corrigir claro/escuro em superfícies, timer/ring, status, selects, alerts, botões e portal, incluindo hover/focus/selected/disabled; registrar contraste e evidências visuais em validation.md.
- [x] 5.3 Preservar labels, teclado, foco e anúncios de estado/erro, respeitando movimento reduzido e sem anunciar cada tick; verificar sessão, seletores e confirmação por teclado nos dois temas.

## 6. Validação e conclusão

- [x] 6.1 Ajustar/adicionar somente testes UI necessários em PomodoroPage.spec.tsx e componentes diretamente modificados para renderização, timer, estados, temas e invariância dos payloads; executar `pnpm --filter @study-platform/web test src/features/pomodoro/PomodoroPage.spec.tsx`, acrescentando apenas arquivos UI diretamente afetados, e registrar resultados sem suíte completa/backend/banco.
- [x] 6.2 Validar com API e dados reais no ambiente existente preparação, início, pausa, retomada, limite/espera, próximo bloco, conclusão, cancelamento, seleções, histórico, sincronização e feedback; registrar a matriz de estados e limitações reais em validation.md sem seed/reset ou mock de produção.
- [x] 6.3 Executar `pnpm lint`, `pnpm typecheck` e `pnpm build`, verificar resultados e registrar falhas preexistentes sem expandir o escopo; não executar `pnpm test` geral.
- [x] 6.4 Revisar o diff final para confirmar ausência de alterações em backend/contratos/revisão de flashcards/regras e atualizar tasks.md somente com tarefas verificadas; conferir coerência com os requisitos.
- [x] 6.5 Após tarefas e verificações aprovadas, adicionar explicitamente só arquivos/hunks desta mudança, incluindo tasks.md final; revisar staged, executar `git diff --cached --check` e criar exatamente um commit `[update] atualizar visual das sessões de Pomodoro`; confirmar hash e arquivos, sem push/tag/archive ou commit vazio/de conclusão de apply incompleto.
