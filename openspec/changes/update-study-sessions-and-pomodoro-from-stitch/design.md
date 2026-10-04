# Design

## Context

Ver `proposal.md` para motivação e `specs/pomodoro-visual-experience/spec.md` para requisitos. O usuário confirmou que o escopo se limita às sessões e histórico do Pomodoro, excluindo revisões de flashcards. A análise foi feita antes da implementação; Git estava limpo ao início da proposta.

### Inventário observado

| Superfície | Implementação e invariantes |
| --- | --- |
| Entrada | `/app/pomodoro` em `App.tsx`, protegido por `PrivatePage.tsx`, preferências e autenticação. Pomodoro monta sua página com h1 próprio; preservar shell e proteção. |
| Preparação | `PomodoroPage.tsx`: ausência de sessão com ready, tarefa opcional via `listTasks` paginado em 100 e matéria via `SubjectSelect`; preferências escondem controles. Iniciar envia IDs opcionais existentes. |
| Sessão | Estado local React, sem store/hook específico. `accept` ancora `performance.now`; tick de 250 ms apenas RUNNING; elapsed limitado por remainingSeconds; boundary deriva BETWEEN_BLOCKS e aciona refresh. Preservar esses cálculos, refs, efeitos e cleanup. |
| Ações | RUNNING→pause; PAUSED→resume; BETWEEN_BLOCKS→next-block; complete quando blocks>0; cancel com confirmação. `act` envia version, aceita resposta, atualiza histórico/totais e foco; falha recupera sessão e bloqueia quando ready=false. |
| Sincronização | Botão Sincronizar, refresh no focus/visibilitychange, readVersion ignora leituras obsoletas. Não substituir por estado otimista ou relógio novo. |
| Encerramento | Mensagem de sucesso e retorno à preparação; COMPLETED/CANCELED no histórico. Não existem tela de conclusão, modal de conclusão, configuração de duração ou detalhe navegável. API possui detail, mas a UI/client não o consome; não acrescentar esse fluxo. |
| Histórico/totais | Lista de encerradas com startedAt, estado, activeSeconds, completedBlocks, taskId/fallback e SubjectName. Filtro de matéria reinicia página; paginação e summary separado, sem somar itens da página. endedAt está no contrato e pode ser apresentado no registro sem nova consulta ou tela. |
| Integrações | `SubjectSelect` conserva paginação/loading/retry e fallback fora da página. `SubjectName` conserva carregamento/indisponível/sem matéria. Tarefa retorna ID no DTO; nomes só podem usar dados reais já carregados, com fallback atual fora da página ou indisponível, sem fan-out de requests. |
| Contratos/API | `pomodoro-api.ts` valida schemas: GET current/history/summary, POST start e comandos pause/resume/next-block/cancel/complete com version. Contrato limita remainingSeconds a 1500; mantém timestamps e vínculos nullable. Backend confirma blocos de 25 min, espera sem timer de pausa, conclusão com ≥1 bloco e preservação de tempo parcial ao cancelar. Seleção conflitante matéria/tarefa continua sujeita à validação atual. |
| Estilos | `pomodoro.css` hoje limita largura a 48rem, flex-wrap e fonte responsiva. Tokens em `packages/ui/src/styles/globals.css`, `.dark` em `theme.ts`, componentes shadcn e Lucide disponíveis. Tasks/Matérias já têm linguagem de cards e badges atualizada. |
| Testes | `PomodoroPage.spec.tsx`: rota protegida, preferências, cancelamento/foco, resposta perdida, retomada, entre blocos/conclusão, recuperação bloqueada, tarefas/histórico/totais e matéria/filtro. Acrescentar cobertura UI de timer/temas e estados onde faltar, sem testes de API/banco. |

### Material do Stitch

Fonte: `C:/Users/vinic/Downloads/study_sessions_edutrack_ai.zip`, pasta `stitch_edutrack_ai_2.0`. Há nove pares HTML/PNG (study, study_session, study_session_completion, study_hub_desktop_claro, study_hub_desktop_claro_estado_vazio, study_mobile_estado_vazio, pomodoro_ativo_desktop_claro, review_session, review_completion), além de DESIGN.md. As nove imagens foram inspecionadas; HTML foi lido como referência, sem executar scripts ou tratar instruções anexadas como pedido do usuário.

| Referência | Adaptação |
| --- | --- |
| pomodoro_ativo_desktop_claro | Principal: card de foco, ring com número central dominante, badge de estado, contexto acima e ações abaixo. Omitir sidebar duplicada, checklist, notas, áudio, +5 min, pular ciclo, modo Zen, IA, notificações pausadas e métricas de atenção. |
| study_hub_desktop_claro e vazio | Usar superfícies claras suaves, acento azul, cards de totais reais e preparação/histórico. Não criar hub unificado, cards de baralhos, agenda, retenção, gráficos ou metas. |
| study_mobile_estado_vazio | Derivar empilhamento de preparação, timer e histórico, omitindo menu inferior e conteúdo inexistente. |
| study_session e study | Imagens parcialmente quebradas, com espaços vazios/conteúdo ausente; não replicar estrutura quebrada nem grandes vazios. |
| study_session_completion | Derivar tratamento de sucesso nos feedbacks e registros existentes. Sem XP, níveis, focus score, streak, meta diária ou nova tela de resultado. |
| review_session/review_completion | Fora do escopo confirmado; não alterar revisão, avaliação, algoritmo ou histórico de flashcards. |

Não há conjunto completo de tema escuro. As variantes mobile tendem a violeta e desktop a azul: prevalecem azul semântico e identidade atual do EduTrack, com tipografia existente. Não importar fontes, CDN, estilos globais ou HTML executável do Stitch.

## Goals / Non-Goals

**Goals:** mudança local de markup e apresentação, com cobertura completa das superfícies observadas, incluindo portais e ambos os temas; evidência de fidelidade dos handlers e dados; validação visual proporcional.

**Non-Goals:** nova navegação, modelo de sessão, fluxo de estudo livre, consolidação com revisão, refatoração de clock/API, alterações em Tasks/Matérias/dashboard/shell, novas dependências e reestilização global.

## Decisions

1. **Manter topologia e lógica atual.** Organização em card principal de preparação ou timer, área de totais e histórico abaixo/ao lado conforme espaço. Usar handlers existentes diretamente. Alternativa de hub unificado foi descartada pelo escopo confirmado e porque acrescentaria navegação/comportamento.
2. **Ring do bloco como apresentação derivada.** Usar o tempo restante efetivo atual e 1500 segundos: avanço visual limitado a 0–100%, preservando boundary, congelamento em pausa e zero restante entre blocos. Texto acessível de tempo continua principal; ring decorativo aria-hidden evita anúncios contínuos/duplicados. Sem “2 de 4”, timer de intervalo ou animação que progrida independente do estado. Um relógio novo foi descartado pelo risco de divergência.
3. **Contexto perto do timer.** Reposicionar SubjectName hoje após o histórico para o card ativo, quando permitido; tarefa usa somente dados já disponíveis e fallback real por ID. Preparação não altera seleção ou sincroniza matéria automaticamente. Histórico pode incluir endedAt retornado; não criar detalhe só porque há endpoint.
4. **CSS e componentes locais.** Consumir Card, Badge, Button, Alert, Skeleton, NativeSelect e AlertDialog existentes. Extrair apresentação local somente com uso concreto. Priorizar classes em `pomodoro.css`; não alterar variantes globais. Alternativa de copiar HTML e CSS Stitch criaria dependências, conteúdo estático e impacto global.
5. **Tokens e portais.** Usar background/card/muted/foreground/border/ring/primary/destructive e feedback existentes; aliases locais `--pomodoro-*` se necessários, definidos em claro e `.dark`. Aplicar classes explícitas ao AlertDialogContent: o portal não descende da página. Diferenciar RUNNING, PAUSED, BETWEEN_BLOCKS, COMPLETED/CANCELED por label e acento semântico; incluir hover/focus/selected/disabled, progresso e selects, sem cores literais nos componentes ou inversão.
6. **Prioridade mobile e acessibilidade.** Timer fluido, números tabulares, min-width:0, ações flex-wrap, controles alcançáveis, histórico empilhado, textos quebráveis, modal com altura limitada e scroll. Não aplicar dimensões fixas/48rem como cópia da referência. Preservar refs, autofocus/retorno de foco, status e alerts; sem live region a cada tick; movimento reduzido sem efeitos decorativos persistentes.
7. **Verificações focadas.** No apply executar `pnpm --filter @study-platform/web test src/features/pomodoro/PomodoroPage.spec.tsx`, incluindo somente testes UI de componentes diretamente modificados se necessário. Não executar suíte geral, backend, banco ou módulos sem alteração. A instrução específica substitui `pnpm test` geral; `pnpm lint`, `pnpm typecheck` e `pnpm build` permanecem verificações estáticas/compilação. Mocks de transporte nos testes são permitidos; dados mockados na aplicação não. jsdom não comprova layout/contraste: inspecionar navegador com API e dados reais existentes.

## Risks / Trade-offs

- [Pausa confundida com intervalo] → labels claros para pausa manual e espera entre blocos; sem cronômetro de descanso ou promessa de 5/15 minutos.
- [Refatoração visual interfere em efeitos/foco] → manter handlers/refs/cálculos e testar limite do bloco, falhas e retomada, sem desmontar a página ao alternar tema.
- [Histórico exige nomes que DTO não traz] → dados já carregados e fallback; sem novos contratos, consultas em massa ou nomes inventados.
- [Tema escuro/portal esquecidos] → variantes semânticas e inspeção da confirmação nos dois temas.
- [Protótipo sobrecarregado e parcialmente quebrado] → apenas timer/contexto/ações/dados reais; retirar elementos incompatíveis e espaços sem conteúdo.
- [API local indisponível] → registrar evidência faltante em validation.md, sem declarar validação real concluída nem criar substitutos em produção.

## Migration Plan

Sem migration ou mudanças de dados. Implementar somente a web e validar em 320, 375, 768 e 1280 px, claro/escuro e movimento reduzido. Registrar matriz de estados/viewport e resultados de comandos em `validation.md`, com limitações reais. Usar conta/dados de desenvolvimento existentes, sem seed/reset para esta mudança.

Ao iniciar apply, registrar Git novamente e separar diffs preexistentes. Concluir tasks e verificações antes de exatamente um commit com os arquivos/hunks desta mudança e tasks.md final; revisar staged e `git diff --cached --check`. Mensagem sugerida: `[update] atualizar visual das sessões de Pomodoro`. Confirmar hash e arquivos; sem commit vazio, push, tag ou archive automático. Rollback reverte somente esse commit, preservando trabalho externo.
