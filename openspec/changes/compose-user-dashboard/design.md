# Design

## Context

Veja [proposal.md](proposal.md) e [specs/user-dashboard/spec.md](specs/user-dashboard/spec.md). `add-user-authentication` planeja `/app` como área inicial mínima com sessão; tarefas, subtarefas, matérias/roadmaps, Pomodoro, repetição espaçada, estatísticas, sequência e preferências ainda são mudanças não aplicadas. O projeto exige propriedade por usuário e impede acesso de um módulo aos repositories internos de outro. A página atual da web escolhe rotas por caminho; não há dashboard implementado.

## Goals / Non-Goals

**Goals:** montar resumos privados de leitura rápida, priorizar um próximo passo e encaminhar para os módulos de origem, com erro isolado por seção e preferência aplicada antes de buscar dados.

**Non-Goals:** persistir cópia de métricas, recalcular progresso ou streak, criar novo estado de roadmap, iniciar IA, criar tarefa automaticamente, alterar status ou agendamento de flashcards.

## Decisions

### 1. Composição por contratos públicos

Criar `GET /dashboard` autenticado. O controller obtém `userId` da sessão e o service de composição lê primeiro as preferências públicas. Depois solicita em paralelo resumos limitados dos services públicos de tarefas, matérias/roadmaps, Pomodoro, repetição espaçada, analytics e streaks, sem importar entidades ou repositories internos. Cada chamada recebe o mesmo `userId`; serviços produtores mantêm filtros de propriedade. Tarefas/matérias/flashcards desativados não são consultados e ficam ausentes do DTO, inclusive em erro. Um erro de preferência ou sessão impede composição; falha de um produtor vira estado `error` só da seção correspondente. A resposta tem `asOf` para explicitar o instante aproximado da leitura, sem prometer snapshot transacional entre módulos. Não criar tabelas para o dashboard. Alternativa rejeitada: consultar diretamente todas as tabelas no dashboard, que duplicaria regras e acoplaria o módulo a modelos internos.

O contrato em `packages/contracts` usa união discriminada por seção (`ready`, `empty`, `error`) e ausência de propriedade para módulo desativado. Valores são DTOs públicos: ID, título, status, prazo e `progressPercent` já calculado para tarefas; resumo e link público para matéria/roadmap; estado atual e contagem de sessões de Pomodoro; pendentes de flashcard; sequência atual; e resumo semanal. O dashboard não reinterpreta percentuais, horários ou critérios de conclusão. Quando um produtor acrescentar regra interna, basta seu resumo permanecer compatível.

### 2. Seleção e limites dos resumos

Tarefas: consultar totais por status e no máximo cinco não concluídas com `dueDate`, incluindo atrasadas, ordenadas `dueDate ASC, id ASC`; a data é civil no fuso do usuário para rotular atraso. Tarefas sem prazo ficam no módulo e o cartão explica sua ausência. O progresso individual mostra percentual somente se o módulo de subtarefas o devolver; tarefas sem subtarefas mostram status. Sessões realizadas é a contagem total de sessões `COMPLETED` retornada por Pomodoro; sessões canceladas podem entrar no tempo semanal via analytics, seguindo a regra do produtor. Flashcards pendentes usa a contagem oficial da fila de revisão, não a quantidade de cartões criados.

Para matéria em destaque, pedir ao service público de matérias candidatas próprias com informação de pendências e prazo. Entre as que têm item manual ou passo de roadmap pendente, escolher menor prazo, incluindo vencidos; empate por `updatedAt DESC, id ASC`. Se nenhuma tem pendência, escolher a mais recentemente atualizada (`updatedAt DESC, id ASC`) e marcar estado sem pendências. Se a escolhida tem roadmap ativo, usar o resumo público dele; caso contrário, usar seu plano manual. Não escolher matéria com base em uma inferência do dashboard sobre detalhes internos dos passos. A seleção automática é determinística, mas não persiste uma preferência de matéria principal. Alternativa rejeitada: usar somente a última matéria criada, que poderia ocultar uma matéria com prazo próximo.

### 3. Semana, sequência e fuso

Usar o fuso IANA de estudo da conta, definido em `add-study-streaks-and-achievements`, para pedir ao analytics a semana ISO atual; se a conta ainda usa o padrão, `UTC` é exibido. O cartão semanal mostra tempo de foco, dias ativos e métricas habilitadas fornecidas por analytics, com link para a área de estatísticas. O cartão de sequência usa exclusivamente o valor público do módulo de streaks, inclusive seu tratamento de hoje/ontem e limites de histórico. Não converter frequência semanal em streak; as duas métricas têm regras próprias. A preferência de IA não oculta roadmap salvo nem plano manual. O dashboard não cria endpoint próprio de alteração de fuso.

### 4. Ação Pomodoro e navegação

O service público de Pomodoro informa se há sessão aberta. Se houver, a web apresenta **Retomar Pomodoro** e abre a página da sessão. Se não houver, **Iniciar Pomodoro** usa o comando público de início sem tarefa ou matéria obrigatória e navega para a sessão criada. Se outra aba iniciar no intervalo, tratar o conflito como sessão existente e navegar até ela; após falha de rede, consultar sessão atual antes de repetir o comando. Ação não escreve em tarefas, matérias, analytics ou streaks diretamente. Cada cartão tem link para sua página de origem; URLs são caminhos internos fixos ou derivados de IDs codificados, nunca URLs arbitrárias vindas de conteúdo de usuário.

### 5. Experiência e entrega

Substituir conteúdo mínimo de `/app` pelo dashboard sem mudar o destino protegido do login. A página carrega somente após `/auth/me` confirmar a sessão, mostra estados por seção, orienta a criar tarefa/matéria/baralho quando aplicável e distingue módulo desligado de módulo vazio. Com todos os módulos opcionais desligados, oferece caminho para `/conta`, mantendo Pomodoro, sequência e resumo semanal disponível. Estados de erro têm tentativa de recarga da seção; valores de outras seções permanecem. Usar estrutura semântica, foco visível, rótulos, equivalente textual a gráficos, movimento reduzido e composição vertical a 320 px.

Testes HTTP em MySQL isolado cobrem duas contas, módulos desligados não consultados, seleção estável, falha parcial e sessão Pomodoro concorrente. Testes web cobrem login/redirecionamento, vazios, links, estados e teclado. Não há migration própria; o apply depende dos produtores publicados.

## Risks / Trade-offs

- [Mudanças predecessoras ainda não aplicadas] → aplicar e confirmar os contratos públicos de cada módulo antes de compor; adaptar nomes de rotas sem copiar lógica interna.
- [Resumos lidos em instantes distintos] → incluir `asOf` e atualizar em nova leitura; não prometer consistência transacional global.
- [Um módulo lento torna a página lenta] → limitar tempo por consulta e devolver erro daquela seção, preservando as demais.
- [Streak e analytics podem usar fusos distintos se escolhidos separadamente] → no dashboard consultar ambos com o fuso salvo da conta e identificar o fuso apresentado.
- [Preferência alterada durante uma leitura] → verificar a preferência na composição e respeitar os bloqueios dos próprios services; nova leitura reflete alteração posterior.

## Migration Plan

1. Aplicar autenticação, preferências e módulos produtores, incluindo analytics e streaks; confirmar DTOs e links de destino.
2. Publicar endpoint de composição e contratos, depois substituir `/app`; verificar acesso direto, duas contas e comportamento de módulos desligados.
3. Testar responsividade, falha parcial, ação Pomodoro e reativação de preferências; executar verificações do projeto.
4. Em rollback do código, restaurar a área inicial mínima sem apagar dados dos módulos, pois o dashboard não tem persistência própria.
