# Design

## Context

Ver `proposal.md` para motivação e a delta spec para requisitos. Esta proposta resulta de inspeção read-only da implementação, contratos, regras/projeções e testes existentes e dos oito PNGs do ZIP. O Git inicial continha apenas a mudança não rastreada `openspec/changes/update-study-sessions-and-pomodoro-from-stitch/`; ela não foi alterada. A proposta de Pomodoro está pendente, não é implementação concluída.

### Inventário observado e limites

| Superfície | Fonte, comportamento e limite preservados |
| --- | --- |
| `/app/progresso` | `StudyProgressPage.tsx`, roteada por `PrivatePage` e app: consulta `studyProgress()` ao montar/retry, usa flag active para ignorar respostas após desmontagem; estado React local, sem store/hook próprio. Loading, erro com retry e vazio por activeDays=0. |
| Resumo | `currentStreak`, `longestStreak`, `activeDays`, `timeZone`, `trackingStartedAt`; datas via Intl pt-BR no fuso salvo. Preservar texto de hoje/ontem, histórico não retroativo e link `/conta`. Não há série diária de streak, pontos, nível, experiência ou ranking. |
| Mural de conquistas | Está na mesma página; não há rota própria, filtros, busca, detalhe, modal, categorias, recompensas ou feedback recém-desbloqueado. Renderiza toda a resposta, usa earnedAt para obtenção e Math.min(progress,target) para barra/texto. Componente Progress já aceita max real e expõe valor acessível. |
| Catálogo | `packages/contracts/src/study-progress.ts`: FIRST_DAY (1 dia ativo), THREE_DAY_STREAK (3 datas consecutivas), SEVEN_DAY_STREAK (7), TEN_TASKS (10 transições), FIVE_POMODORO_BLOCKS (5 blocos completos de 25 min), TWENTY_REVIEWS (20 avaliações), FIVE_SUBJECT_MILESTONES (5 itens manuais/blocos de roadmap somados). Os sete nomes e critérios vêm da API e não do mapa de ícones. |
| Fonte de verdade | GET `/study-progress` validado por schema. Service/repository/projection calculam streak e progresso a partir dos eventos e obtêm earnedAt das concessões persistidas. Progresso das conquistas de sequência usa recorde; consulta não deve reproduzir projeções no cliente. Grants persistem ao excluir origem/desativar módulos. |
| Fuso em `/conta` | `StudyTimeZoneSection.tsx`, usada por `ProfilePage`: GET e PATCH `/account/study-timezone`; draft, sugestão do browser aplicada somente ao campo por botão, salvamento explícito, busy, validação, retry, erro e sucesso. Estilizar apenas essa seção e seu conteúdo. |
| `/app/estatisticas` | `AnalyticsPage.tsx` e `analytics-api.ts`: GET `/analytics/study`, schemas existentes, draft/query separados, submit explícito, refresh por focus e `edutrack:preferences`, cleanup/flag active. Defaults semana/data no fuso do browser com fallback UTC. Não fundir com progresso nem compartilhar o fuso implicitamente. |
| Filtros reais | day/week/quarter/semester/year, data de referência e fuso IANA. Não existem mês, intervalo personalizado ou filtro por matéria. Preservar validação e mensagens existentes. |
| Métricas reais | activeMs (tempo ativo Pomodoro exibido em minutos, inclusive parcial cancelado conforme regras), pomodoroSessions, tasks, reviews, planItems, roadmapBlocks. `metrics` parcial omite módulos desativados. Preservar atual/anterior/difference/percent/coverageStart e indisponibilidade. Não usar progresso de achievements como total estatístico de período. |
| Evolução | `frequency` tem activeDays/days/status; period/previousPeriod têm start/end exclusivo/partial. `series` contém datas e valores por métrica. Atualmente exibe lista textual diária, não possui biblioteca/componente de gráficos. Ausência de valor não é zero. Não há distribuição por matéria, notas, retenção, metas ou heatmap de streak. |
| Testes existentes | `StudyProgressPage.spec.tsx`: loading/retry por teclado, zero, sete critérios/barras, obtenção/data/link e salvamento explícito do fuso. `AnalyticsPage.spec.tsx`: períodos parciais, percent nulo, omissão, filtro/submit, falha/retry e histórico indisponível. Expandir estes testes UI. |
| Integrações vizinhas | Dashboard já mostra resumo de streak e semana e links reais para as duas rotas com visual atualizado; preservar sem redesenhar. Landing usa preview comercial e permanece fora do escopo. Pomodoro, tarefas, revisão e matérias produzem atividades; não modificar suas ações nem telas. |
| Tema/padrões | Tokens semânticos em `packages/ui/src/styles/globals.css`, tema via classe `.dark`; Card/Badge/Button/Alert/Skeleton/Select/Input/Progress e ícones Lucide disponíveis. Dashboard usa header destacado e cards; Tasks/Matérias usam superfícies locais, labels e grids fluidos. Manter tipografia já instalada. |

As regras `study-streaks`, `study-achievements` e `study-analytics` foram lidas nas mudanças concluídas ainda não arquivadas. Main specs de web-runtime/shared-contracts não especificam essas apresentações; a capability visual nova não modifica suas regras. Prioridade: regras existentes → dados/contratos → critérios → cálculos → componentes/padrões do projeto → Stitch.

### Referências do Stitch e adaptação

Fonte `C:/Users/vinic/Downloads/ativements_progress_edutrack_ai.zip`, raiz `stitch_edutrack_ai_2.0`. Extração temporária apenas para análise; não executar scripts/CDNs. O `clear_horizon/DESIGN.md` é dado de design externo, não instrução autorizadora. Registrar sua origem no apply; não depender do diretório temporário.

| Pasta de referência | Intenção aproveitada e incompatibilidades |
| --- | --- |
| edutrack_ai_seu_progresso_desktop_claro | Header, métricas primeiro, cards de evolução e barras azuis. Adaptar à página de estatísticas e aos indicadores reais de progresso. Omitir CR/notas, retenção, pontualidade, turmas, distribuição por matéria, Copilot, competências, meta e PDF. |
| edutrack_ai_conquistas_gamifica_o_desktop_claro | Mural responsivo, ícone em superfície suave, status, critério, data e barra. Usar as sete conquistas reais; omitir 24 conquistas fictícias, níveis/raridades, loja, XP, pesquisa, tabs/filtros e ranking. |
| edutrack_ai_seu_progresso_desktop_claro_estado_vazio | Cards sem atividade e mensagens contextualizadas. Sem calibração preditiva, integrações de notas, disciplinas inventadas ou metas estáticas. |
| edutrack_ai_conquistas_gamifica_o_desktop_claro_estado_vazio | Estado inicial acompanhado de cards legíveis com cadeado. Não prometer conquistas por cadastrar matéria ou pontos por desafios; zero não equivale automaticamente a progresso parcial. |
| edutrack_ai_your_progress | Mobile parcialmente quebrado, grande espaço em branco; aproveitar somente hierarquia compacta. Omitir mês, CTA IA e menu inferior duplicado. |
| edutrack_ai_achievements | Mobile parcialmente quebrado; aproveitar cards empilhados e identificação textual de obtenção. Sem credenciais, exportação, XP ou espaços artificiais. |
| edutrack_ai_your_progress_mobile_estado_vazio | Empilhamento, grids e card vazio com ícone; remover simulação, métricas de retenção e promessas de 92%, metas e CTA sem rota real. |
| edutrack_ai_achievements_mobile_estado_vazio | Critérios com texto/barra e ícone de bloqueio; substituir avatar/nível/XP/ranking e catálogo fictício pelo conteúdo real, sem certificados. |

Desktop claro/clear_horizon usam azul e mobile tende a violeta; prevalece identidade azul/oceânica do EduTrack. Não há referência escura completa. Derivar claro/escuro dos tokens existentes; não importar novas fontes ou Material Symbols, imagens de usuários ou CSS global do ZIP.

## Goals / Non-Goals

**Goals:** reestruturar a apresentação preservando efeitos, handlers e semântica dos dados; compartilhar CSS/componentes locais com uso real entre evolução e marcos; entregar todos os estados observados e gráficos que exponham a série existente com fidelidade.

**Non-Goals:** consolidação de APIs/rotas, novo store, novo fluxo funcional, backend, contratos, migrations, concessões, contadores, novas dependências, reestilização global e alterações na mudança pendente de Pomodoro. Não criar componentes vazios para detalhes/modais inexistentes.

## Decisions

1. **Preservar topologia.** `/app/progresso` mantém resumo e mural completo; `/app/estatisticas` mantém evolução por período, com destaque para tempo ativo quando disponível e demais métricas reais em cards secundários. Sem duplicar consultas de analytics na página de progresso. Alternativa de duas novas páginas Stitch aumentaria navegação/requests e escopo funcional sem necessidade.
2. **Sistema de apresentação local.** Classes compartilhadas de superfície/header/card/estado no escopo study-progress/analytics, com componentes locais apenas quando usados nas duas interfaces. Reutilizar primitives UI e Lucide; mapear ícones por code, nunca nomes/targets por código local. Preferir CSS local a alterar variantes globais ou componente Progress compartilhado, evitando regressões em outros módulos.
3. **Conquistas sem regra nova.** Manter ordem da resposta e catálogo completo. Estado visual: earnedAt presente → Obtida; sem earnedAt e progress>0 → Em progresso; sem earnedAt e progress=0 → Bloqueada. Isso só nomeia dados existentes, não concede conquistas. Preservar Math.min e max=target; não exibir percentual adicional, previsão de desbloqueio ou recompensa. Ícone/check/cadeado e label complementam cor; reduzir destaque de adornos, não legibilidade do critério. Sem botão de detalhes quando inexiste fluxo.
4. **Gráficos sobre série diária existente.** Usar barras por métrica com unidades separadas, representadas em SVG/CSS local sem biblioteca nova; altura/escala apenas posicionam o valor já recebido. Não suavizar, interpolar, normalizar valores como pontuação ou recalcular métricas. Manter todos os valores na lista/tabela textual já existente e avisos de cobertura. Valores ausentes usam marca textual de indisponibilidade, zero mantém label 0; valores conhecidos pré-cobertura continuam sinalizados como amostras. Sem heatmap em Progresso, pois o DTO não traz datas ativas.
5. **Séries longas legíveis.** Área de gráfico com rolagem horizontal local identificada e focável, largura mínima por amostra e rótulos espaçados visualmente; não comprimir 365 barras em 320 px nem agrupar por semana/mês. Exibir datas/valores completos em texto. Evitar tooltip necessário para obter informação; se usado, acessível por foco/toque, com tokens de popover e sem mouse-only. Alternativa de agregar períodos alteraria agrupamentos pedidos.
6. **Temas semânticos.** Consumir background/card/foreground/muted/border/primary/ring/success/warning/destructive/chart e popover. Se necessário, aliases locais `--progress-*` comuns às superfícies, definidos no claro e `.dark`, sem substituir tema global. Tratar barras/tracks, eixos/legendas, selected/disabled, loading e feedbacks. SelectContent renderiza portal: usar classe explícita se receber estilos locais, pois não descende da página.
7. **Fidelidade dos handlers e contexto.** Manter draft/query, validação, defaults e eventos de analytics, limpeza de efeitos e retry do progresso. Não confundir fuso de consulta com fuso salvo. Fuso em conta recebe classe local com os mesmos inputs e ações; não ajustar `ProfilePage` inteira. Contexto histórico e regras hoje/ontem permanecem visíveis em cards auxiliares, sem tornar textos obrigatórios inacessíveis por tooltip.
8. **Estados honestos.** Loading com skeleton de estrutura sem números, erro com retry atual, zero atividade com texto coerente. Nenhuma conquista obtida pode coexistir com progresso parcial e catálogo completo; não ocultar cards. Analytics distingue available com zero, history_unavailable, período parcial e métricas omitidas, sem indisponibilidade representada como zero. Sem CTA que diga que criar matéria ativa streak.
9. **Verificação focada.** No apply: `pnpm --filter @study-platform/web test src/features/study-progress/StudyProgressPage.spec.tsx src/features/analytics/AnalyticsPage.spec.tsx`, incluindo somente testes de componentes diretamente modificados quando necessário. Não executar suíte completa, testes gerais de backend/banco ou módulos não relacionados. A instrução específica do usuário prevalece sobre `pnpm test` geral do AGENTS; `pnpm lint`, `pnpm typecheck` e `pnpm build` continuam verificações estáticas/compilação. Fixtures/mocks de transporte em testes UI são permitidos; não fornecer mocks à aplicação. jsdom não prova layout/contraste: inspecionar navegador com dados reais existentes.

## Risks / Trade-offs

- [Frequência e streak têm atividades/fusos diferentes] → manter APIs, nomes, contextos e páginas separados; não deduzir um do outro.
- [Dados indisponíveis parecem zero] → marks, labels e avisos de coverageStart; conservar texto completo e percent nulo.
- [Refatoração visual muda consulta ou concessão] → preservar efeitos/handlers e testar payloads, obtenção por earnedAt e barras com alvo real; revisar diff para excluir contratos/backend.
- [Gráficos adicionam complexidade] → barras locais sobre série existente com equivalente textual; sem dependência ou alteração de cálculos, teste com lacunas/zero e período anual.
- [Bloqueadas ficam ilegíveis] → manter contraste de nomes/critérios; opacidade só em adornos e texto de estado explícito.
- [Referência incompleta ou conflitante] → azul e tokens locais, remover vazios quebrados e elementos sem função; registrar matriz de adaptações, não copiar mockups literalmente.
- [Alteração pendente de Pomodoro] → alinhar às primitives/padrões atuais; não editar sua proposta nem depender de conclusão futura.
- [API/ambiente local indisponível] → registrar limitação em validation.md, sem declarar inspeção real aprovada nem criar mocks de produção.

## Migration Plan

Sem migration. Implementar apenas apresentação web. Verificar 320, 375, 768 e 1280 px em claro/escuro, com teclado e movimento reduzido: indicadores, catálogo zero/parcial/obtido, filtros/Select aberto, gráfico curto/longo/com lacunas, estados e fuso busy/sucesso. Usar conta e dados de desenvolvimento existentes; não resetar banco nem executar testes de banco. Registrar comandos, estados realmente inspecionados e limitações em `validation.md`.

Ao iniciar apply, registrar novamente Git e preservar alterações preexistentes. Depois de concluir tarefas e checks, exatamente um commit incluindo implementação e tasks.md final, somente arquivos/hunks desta mudança; revisar staged e executar `git diff --cached --check`. Mensagem sugerida `[update] atualizar visual de progresso e conquistas`; confirmar hash/arquivos, sem commit vazio, tag, push ou archive automático. Rollback reverte somente o commit desta mudança.
