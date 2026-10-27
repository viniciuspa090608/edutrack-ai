# Design

## Context

Ver motivação em proposal.md. Inspeção: `DashboardPage.tsx` usa Card/CardHeader/CardContent, Button, Alert e Skeleton, carrega `dashboard-api.ts` (GET `/dashboard` validado por `dashboardSchema`) e mantém controle de requisição, atualização por foco/visibilidade/preferências e reconciliação de Pomodoro. Os seis cards são tasks, subjects, flashcards, pomodoro, streak e week. Hoje não há gráfico desenhado no dashboard: métricas semanais são um dl; `AnalyticsPage` também apresenta série diária em lista, sem biblioteca de charts instalada. Há Progress, Badge e Lucide disponíveis. O shell `PrivatePage` fornece autenticação, navegação, logout e conteúdo limitado a 980 px. Não será substituído pela sidebar do export.

Referência: `C:/Users/vinic/Downloads/dashboard_edutrack_ai.zip`, raiz `stitch_edutrack_ai_2.0`. Inclui quatro desktop (claro/escuro, preenchido/vazio), `edutrack_ai_student_dashboard` (mobile claro), mobile escuro e dois mobile vazios; `clear_horizon/DESIGN.md` descreve Clear Horizon/Hanken Grotesk. Screens e títulos do HTML foram inspecionados. Referências mobile usam inglês e composição diferente; traduzir e unificar o conteúdo real. Há logo quebrado em mobile, XP, notas previstas e estado vazio com coach fictício; não reproduzir.

O Git inicial tem alterações preexistentes de `update-public-landing-from-stitch` em landing, tema, index.html e testes. Não pertencem a esta mudança. Tema manual está presente no working tree, ainda em mudança em andamento; o dashboard depende apenas de tokens/classe global já estabelecidos, sem importar componentes da landing.

## Goals / Non-Goals

**Goals:** composição clara e responsiva usando somente o payload atual; equivalência de funcionalidades; gráficos acessíveis; estilos isolados ao dashboard.

**Non-Goals:** backend, contratos, novas consultas, migrations, mutação de tarefas, cronômetro independente, busca, notificações, IA preditiva, metas, reestruturação do shell e mudanças em `/app/estatisticas` ou landing. Sem novos pacotes, fontes remotas ou sistema de tema.

## Decisions

### 1. Mapeamento verificável do Stitch

| Elemento | Fonte atual | Adaptação |
| --- | --- | --- |
| Saudação/semestre/curso | displayName recebido de PrivatePage | Nome real e descrição curta; sem semestre/curso |
| Nível/XP | Sem fonte | Resumo dos totais de tarefas quando habilitadas; sem percentual arbitrário |
| Consistência | streak.currentStreak/longestStreak/activeDays/trackingStartedAt | Sequência, recorde, início rastreado; sem calendário fictício |
| Carga semanal/meta | week.metrics.activeMs | Tempo de foco em horas/minutos; sem meta ou barra de objetivo |
| Cartões/retencão | flashcards.pending | Pendências e link real; sem retenção estimada |
| Tarefas prioritárias | tasks.counts/upcoming/withoutDeadline | Próximas tarefas com prazo, status, prioridade real, subtarefas e progresso oficial; preservar ordem recebida |
| Grid de matérias/notas | subjects.data: uma matéria ou null | Um card amplo de matéria em destaque com plano manual/roadmap e link contextual |
| Foco ativo | pomodoro.session/completedSessions | Estado, total de sessões e iniciar/retomar existentes; sem pause/reset/skip |
| Gráfico de retenção/insight | week.series | Atividade semanal real; sem previsões ou conselhos automatizados |
| Calendário/próximos prazos | tasks.upcoming já apresentado | Incorporar prazos na lista de tarefas, evitando duplicação |
| Busca/notificações/Pro/avatar acadêmico | Sem fonte/fluxo | Omitir; preservar navegação e logout do shell atual |

Toda métrica atualmente exibida em `week.metrics` continua disponível, incluindo itens manuais e blocos de roadmap. Frequência semanal não é sequência: manter rótulos distintos. Não resolver nome de matéria de `task.subjectId` com nova consulta; só há ID disponível no resumo.

### 2. Estrutura local e responsividade

Manter `DashboardPage` proprietário dos estados/load/begin; refatorar somente renderização e componentes puros locais quando necessário: `DashboardSection` para estrutura e estados, `DashboardWeeklyChart` para série, demais blocos apenas se reduzirem duplicação concreta. Card, Button, Alert, Skeleton, Progress e Badge vêm do pacote UI; ícones do Lucide. Não introduzir hook/data layer paralelo. Alternativa de copiar HTML/CDN rejeitada por incompatibilidade e duplicação.

Saudação e ações existentes no topo; faixa compacta de indicadores; conteúdo principal de tarefas/matéria/semana e coluna complementar de Pomodoro/revisões/progresso em largura suficiente. Abaixo de aproximadamente 900 px de viewport, reduzir colunas conforme largura útil do container; no mobile, leitura sequencial em uma coluna. O shell limita o espaço útil: não forçar quatro cards e duas colunas quando não couberem. Usar grid flexível, min-width: 0 e escopo `.dashboard`; não sobrescrever `.private-content`, `auth.css` ou tokens globais. Não adicionar sidebar nem navegação inferior duplicada. Essa diferença do Stitch preserva outras páginas.

### 3. Gráfico sem biblioteca nova

Usar barras CSS/markup semântico para `week.series[].values.activeMs`, convertendo ms somente para apresentação em minutos. A maior observação válida determina escala; no conjunto com zeros conhecidos a altura é zero, sem divisão por zero. Cada dia tem rótulo/valor textual acessível; valores ausentes são indisponíveis, não zeros. Série vazia não gera dias ou valores fictícios. Não preencher lacunas nem inferir dias ativos de sequência. Informar período (fim exclusivo), fuso, período parcial e cobertura incompleta. Mostrar tabela/lista textual equivalente; outras métricas permanecem no resumo. Alternativas Recharts ou gráfico de retenção são rejeitadas por dependência desnecessária/ausência de dado. Sem somar séries para substituir totais oficiais.

Comparações opcionais usam apenas current/previous/difference/percent e respectivos status recebidos; null é indisponível ou não calculável, nunca zero. Ausência de uma métrica por preferência não produz indicador dela.

### 4. Preservar comportamento e estados

Reutilizar load e begin, proteção contra resposta antiga, listeners e endpoints. Loading inicial usa skeletons sem números; atualização mantém dados existentes com aviso. Erro global oferece retry atual. Erro por seção usa alerta/retry e não se propaga aos outros blocos; indicadores derivados da seção também mostram indisponibilidade. Não dividir uma seção em vários blocos que repitam erro e retry. Seções opcionais ausentes continuam omitidas, junto com seus links; reativação continua em `/conta`. Zero revisões não prova ausência de baralhos; ausência de próximas tarefas não prova ausência de tarefas. Progresso null não vira 0%. Preservar tarefas sem prazo, período, fuso, instante asOf e histórico rastreado.

### 5. Tema e validação restrita

Consumir tokens existentes de background/card/foreground/muted/primary/border/status/chart; sem mapear literalmente cada cor do export ou alterar tema global. Validar claro/escuro via mecanismo atual. Nenhum seletor novo exigido nesta mudança; o controle do export não justifica expandir escopo.

O usuário restringiu testes aos arquivos afetados: executar `pnpm --filter @study-platform/web exec vitest run --config vitest.config.ts src/features/dashboard/DashboardPage.spec.tsx` e testes locais de componentes novos, explicitamente enumerados. Fixtures contratuais são permitidas somente nos testes; runtime não usa mocks. Não rodar `pnpm test`, testes de backend ou suítes completas. Executar lint/typecheck/build da web e check de formatação apenas nos arquivos alterados. Dependências workspace já compiladas devem estar disponíveis; se necessário, compilar contracts/UI sem editar fontes e sem executar testes desses pacotes. Verificação visual em 320/375/768/1024/1440, teclado e movimento reduzido; DOM não comprova responsividade.

## Risks / Trade-offs

- [Fidelidade limitada pelos dados e shell] → documentar equivalências acima; priorizar funcionalidade e contrato, sem sidebar ou múltiplas matérias inventadas.
- [Estilos genéricos do shell interferirem] → verificar largura efetiva e aplicar overrides somente descendentes de `.dashboard`.
- [Zero confundido com erro/histórico incompleto] → cenários específicos de null, ausência de campo, empty e error.
- [Mudança concorrente na landing/tema] → registrar Git novamente no apply, preservar hunks externos e evitar seus arquivos.
- [ZIP externo desaparecer] → o caminho é referência de implementação; preservar acesso ao ZIP até concluir validação visual, sem copiar HTML para runtime.

## Migration Plan

Aplicação somente front-end, sem migração de dados. Implementar componentes/apresentação e CSS, adaptar testes locais, verificar visualmente e executar verificações restritas acima. Revisar staged e `git diff --cached --check`; criar um único commit `[update] atualizar apresentação do dashboard` com somente esta mudança e tasks final, se concluída. Sem push/archive. Rollback do commit restaura a apresentação anterior sem alterar dados ou contrato.
