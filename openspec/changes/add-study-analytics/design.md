# Design

## Context

Veja [proposal.md](proposal.md) e [specs/study-analytics/spec.md](specs/study-analytics/spec.md). O repositório ainda contém apenas fundação web/API; tarefas, Pomodoro, matérias, roadmaps, revisão de flashcards e preferências estão em proposals. Pomodoro já prevê totais de sessões encerradas, mas não intervalos ativos por dia. Tarefas e itens de matéria preveem status, sem histórico datado de cada transição. Revisão espaçada prevê avaliações persistidas. O plano de regeneração menciona passos de roadmap concluídos, mas a operação que marca passos deve estar disponível no produtor antes de contar blocos.

## Goals / Non-Goals

**Goals:** agregações reproduzíveis por fuso e período, sem dupla contagem, com vínculo claro aos registros de origem e isolamento da conta; métricas separadas de plano manual e roadmap.

**Non-Goals:** calcular streaks/conquistas, estimar horas fora de Pomodoro, inferir revisões da revelação de cartões, usar IA ou inventar datas de conclusão para registros antigos sem histórico.

## Decisions

### 1. Ledger de atividade no limite dos módulos produtores

Criar `study_activity_events` com ID, `user_id`, `kind`, `source_type`, `source_id`, `source_transition_id`, `occurred_at` UTC e campos numéricos mínimos. Índice único por origem/transição/tipo impede duplicar um evento em repetição de chamada; índice `(user_id, occurred_at)` sustenta filtros. Os services produtores gravam evento na mesma transação da mutação confirmada, por contrato interno de publicação, sem analytics acessar seus repositories. Eventos são imutáveis; reabrir e concluir outra vez cria nova transição de conclusão, mas repetir o mesmo comando não cria evento novo. Exclusões de entidades não apagam eventos agregados; payload não armazena frente/verso de flashcards nem nomes de matérias. A alternativa de consultar apenas status atual e `updated_at` perderia conclusões anteriores e confundiria edições com conclusão.

Eventos: `TASK_COMPLETED` na passagem para `COMPLETED` (manual ou derivada de subtarefas), `FLASHCARD_REVIEWED` na avaliação confirmada da repetição espaçada, `SUBJECT_PLAN_ITEM_COMPLETED` na passagem do item manual para `COMPLETED`, `ROADMAP_BLOCK_COMPLETED` quando todos os passos do bloco ficam completos, e `POMODORO_SESSION_COMPLETED` no encerramento `COMPLETED`. O produtor de roadmap precisa expor conclusão/reabertura de passo próprio e emitir conclusão de bloco somente na transição de incompleto para completo. Reabrir passo e completar novamente gera outro evento; editar/reordenar/restaurar roadmap não cria conclusão artificial. O bloco de roadmap não é o bloco Pomodoro de 25 minutos; métricas têm nomes distintos. A confirmação de roadmap por IA ou edição manual não gera conclusão retroativa de passos recebidos como completos sem transição de estudo explícita.

### 2. Tempo ativo diário de Pomodoro

Acrescentar registros de intervalos ativos ao produtor Pomodoro: cada trecho de execução tem início e fim UTC e referência à sessão; pausa, fim de bloco ou encerramento fecha o trecho, sem registrar pausa. A soma dos trechos de uma sessão encerrada deve igualar `active_ms` dentro da resolução adotada. Sessões ainda abertas ficam fora da estatística; ao concluir ou cancelar, inclusive com zero blocos, seus intervalos entram nas consultas. A consulta converte os limites do período local para UTC e reparte trechos que cruzam meia-noite local, inclusive em transições de horário de verão, somando milissegundos antes de arredondar para apresentação. Assim, os 10 minutos de uma sessão cancelada contam, mas a sessão não aumenta o total de sessões concluídas. Um evento terminal com chave única permite detectar encerramento uma vez; a série de tempo lê os intervalos autorizados das sessões terminais por contrato público do módulo Pomodoro. Alternativa rejeitada: atribuir `active_ms` inteiro ao dia de encerramento, que distorceria dias atravessados.

### 3. Períodos, comparação e frequência

`GET /analytics/study?granularity=...&date=YYYY-MM-DD&timeZone=...` deriva `userId` da sessão. `date` é data civil no fuso indicado. A web usa o fuso IANA do navegador como padrão, mostra o valor e permite alterá-lo; a API exige e valida o fuso. Não persistir fuso na conta nesta mudança. Sem fuso detectável, a UI propõe `UTC` e o identifica. Semana é ISO segunda–domingo; trimestres Jan–Mar/Abr–Jun/Jul–Set/Out–Dez; semestres Jan–Jun/Jul–Dez; ano Jan–Dez. Intervalos são `[início local, início do próximo período local)`, convertidos para UTC com biblioteca de fuso e agregados por dia civil local, nunca por blocos fixos de 24 horas.

O anterior é o período de calendário imediatamente precedente completo. O atual, se estiver em curso, inclui atividades até a leitura e recebe marcador `partial`; a interface avisa que a comparação é com o período anterior completo. Para cada métrica: atual, anterior, diferença absoluta e percentual `((atual-anterior)/anterior)×100` somente com anterior > 0. Série diária inclui dias sem atividade com zero dentro do histórico rastreado. Frequência conta a união das datas locais de eventos aceitos e de intervalos Pomodoro positivos; denominador é número de dias transcorridos no período atual (incluindo hoje) ou dias totais de período encerrado. Não criar cálculo de sequência.

### 4. Preferências, histórico e apresentação

Analytics consulta a preferência do usuário antes de agregar e montar DTO. Tarefas, matérias e flashcards desligados removem suas métricas e fontes da frequência; registros persistem. Pomodoro é sempre disponível no escopo atual. A preferência de IA não remove blocos de roadmap confirmados, pois o módulo de matérias pode ser usado manualmente. Nenhum módulo lê repository interno de outro: analytics consome ledger e interfaces públicas dos produtores; o contrato público de preferências decide disponibilidade. Toda consulta filtra `user_id`; não há parâmetro de usuário na rota.

Como alguns módulos podem existir antes do ledger, uma migration/backfill importa apenas atividades com timestamp de conclusão ou avaliação confiável e intervalos reais. `updated_at` genérico não é tratado como data de conclusão. O DTO traz início de cobertura por métrica e estado `history_unavailable` para períodos anteriores ao rastreio quando não houver dados suficientes, distinguindo isso de zero. Aplicar os hooks antes de disponibilizar analytics reduz essa lacuna. A página `/app/estatisticas` oferece seletor de período, data e fuso, cartões com valores atuais/anteriores, série diária e tabela textual equivalente. Oculta métricas de módulos indisponíveis, distingue loading/erro/sem dados/histórico indisponível, usa foco visível e funciona desde 320 px e com movimento reduzido.

## Risks / Trade-offs

- [Produtores ainda não implementados] → aplicar os módulos predecessores e conferir transições reais; integrar hooks públicos sem acoplar repositories.
- [Roadmap não oferece conclusão de passos] → entregar a operação própria no módulo de matérias/roadmaps antes de habilitar sua métrica e testar a passagem do último passo a completo.
- [Alteração do fuso reorganiza dias históricos] → recalcular a partir de instantes UTC em cada consulta e mostrar o fuso selecionado.
- [Histórico sem timestamp confiável] → exibir cobertura indisponível, sem inventar atividade em datas passadas.
- [Volume de consultas por ano] → índices por usuário/instante e agregação no intervalo requisitado; avaliar projeções materializadas apenas com medição real.

## Migration Plan

1. Aplicar autenticação, preferências, tarefas, Pomodoro, matérias/roadmaps e repetição espaçada; conferir disponibilidade da conclusão de passos e dos timestamps dos registros.
2. Adicionar ledger e intervalos ativos em migrations MySQL versionadas com `synchronize: false`; backfill apenas dados com data confiável e testar rollback em banco isolado.
3. Publicar hooks transacionais, API e web juntas; conferir duas contas, fusos/horário de verão, meia-noite, reabertura, preferências e comparação por todos os períodos.
4. Em rollback do código, ocultar página/rota sem apagar os dados dos produtores; preservar ledger e intervalos até decidir migração reversa de dados.
