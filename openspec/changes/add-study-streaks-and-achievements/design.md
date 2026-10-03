# Design

## Context

Veja `proposal.md` e as specs `study-streaks`, `study-achievements` e `shared-contracts`. A aplicação atual ainda não possui módulos de estudo implementados. Os proposals de tarefas, subtarefas, Pomodoro, matérias/roadmaps e repetição espaçada definem transições e avaliações, mas não um registro comum de atividades. `add-study-analytics` está planejado e poderá consumir esse registro; não é pré-requisito. O perfil planejado não possui fuso de estudo.

## Goals / Non-Goals

**Goals:** registrar fatos confirmados e idempotentes, atribuir uma data local estável, calcular sequências e conceder marcos únicos sem acessar repositories internos de outros módulos.

**Non-Goals:** alterar regras de conclusão dos produtores, somar tempo parcial como dia ativo, conceder recompensas materiais, enviar notificações, reconstruir atividade antiga sem timestamp confiável ou exigir IA.

## Decisions

### 1. Registro de atividade append-only integrado às transações produtoras

Criar `study_activity_events` com `id`, `user_id`, `kind`, `source_type`, `source_key`, `occurred_at_utc`, `timezone_id`, `local_date` e índice único `(source_type, source_key)`. Nenhuma FK para objeto de tarefa/cartão/matéria é usada: excluir conteúdo não apaga o fato histórico. Um contrato interno `recordStudyActivity(transaction, userId, kind, sourceKey, occurredAt)` é chamado pelo service dono da mutação, na mesma transação de banco. Um conflito de unicidade na chave da origem vira no-op, sem novo dia nem progresso; falha de registro reverte a mutação, evitando estudo confirmado sem crédito. O módulo de progresso não importa repositories internos dos produtores. Alternativa rejeitada: contar o estado atual de entidades, que perderia conclusões reabertas e atividades de objetos excluídos.

Chaves de origem: `(task, taskId + completionRevision)` para transição real do status principal a `COMPLETED`; `(pomodoro-block, sessionId + blockOrdinal)` para cada bloco completo; `(flashcard-review, reviewEventId)` para avaliação persistida; `(subject-plan-item, itemId + completionRevision)`; `(roadmap-block, roadmapId + blockId + completionRevision)` quando o último passo torna o bloco completo. A revisão de conclusão é incrementada somente em nova transição após reabertura. Concluir todas as subtarefas em lote gera um único evento da tarefa principal; subtarefas isoladas não são fontes. O bloco Pomodoro registra como `occurred_at_utc` o instante efetivo em que completou 25 minutos ativos, inclusive se a API materializar o crédito depois; cancelamento posterior não duplica o evento. Na revisão espaçada, os quatro níveis `AGAIN | HARD | GOOD | EASY` geram evento quando a avaliação é persistida; revelação não gera evento. Para matérias, item manual e bloco de roadmap são fontes distintas; passos isolados não. A conclusão de um bloco de roadmap depende de um modelo de passos persistido e de sua transição para todos concluídos; se esse modelo ainda não existir ao aplicar esta mudança, implementar essa parte depois do predecessor correspondente antes de declarar o apply completo.

### 2. Fuso com histórico efetivo e data local congelada

Uma preferência `study_timezone` por usuário guarda um identificador IANA validado, inicialmente `UTC`. `/conta` mostra o valor e sugere o fuso do navegador sem persistir automaticamente; `PATCH /account/study-timezone` permite alterá-lo. Cada alteração acrescenta entrada a `study_timezone_history` com `effective_at_utc`. `recordStudyActivity` escolhe a zona vigente em `occurred_at_utc`, calcula a data de calendário local e guarda ambas no evento. Isso cobre blocos Pomodoro cujo limite ocorreu antes de uma troca de fuso, mas foi materializado depois. Mudanças de fuso não reescrevem eventos antigos; `UTC` é mostrado como padrão até a primeira escolha. Alternativa rejeitada: converter todo o histórico no fuso atual a cada leitura, o que mudaria sequências e datas de conquistas retroativamente.

Dias locais usam calendário, não duração de 24 horas; a biblioteca de fuso IANA deve resolver horário de verão. O servidor usa seus instantes UTC confiáveis, nunca datas enviadas pelo cliente. `GET /study-progress` deriva `today` do instante atual no fuso vigente, lê datas locais distintas e calcula séries consecutivas, recorde e sequência atual (terminada hoje ou ontem). Um índice `(user_id, local_date)` sustenta a consulta. Pode-se materializar dias para escala futuramente; a fonte de verdade inicial é o registro imutável. Alternativa rejeitada: incrementar um contador de sequência por evento, que seria vulnerável a eventos atrasados ou várias atividades no mesmo dia.

### 3. Conquistas derivadas dos eventos e concedidas uma vez

O catálogo de sete conquistas é versionado em código com identificadores estáveis. Uma tabela `study_achievement_grants` com unicidade `(user_id, achievement_code)` armazena `earned_at_utc` e o evento/dia que cruzou o limiar. Quando um evento novo entra, o serviço calcula os totais por tipo e as séries de dias a partir do registro do usuário, em ordem de `occurred_at_utc`, e insere concessões faltantes dentro da transação. Se evento atrasado altera o primeiro instante de alcance, atualiza somente esse instante da concessão existente; nunca cria segunda linha nem revoga uma conquista. `GET /study-progress` lê grants e calcula progresso atual pelos eventos, sem efeitos de escrita. O limite **Plano em andamento** soma eventos `subject-plan-item` e `roadmap-block`, uma unidade cada. Alternativa rejeitada: contadores editáveis mantidos separadamente, que poderiam divergir com repetição e reprocessamento.

Para serializar concessões concorrentes da mesma conta, bloquear uma linha de progresso por `user_id` durante inserção/recomputação e confiar também nas restrições únicas. Processar atividades fora de ordem por data não altera contagens de eventos; recalcular séries garante recorde correto. Desativação de módulo interrompe novos eventos porque o próprio produtor bloqueia operações, mas não oculta nem apaga progresso histórico. A consulta não consulta preferências dos módulos para filtrar eventos históricos; mostra o que a pessoa fez. IA desativada não interfere nas conclusões manuais.

### 4. Histórico confiável e experiência web

Uma migration cria `study_progress_tracking` por conta com `tracking_started_at_utc`. Para contas já existentes, definir esse instante na ativação do módulo, sem inferir transições a partir de `updated_at`, contadores de bloco sem data ou estados atuais. Assim, zero antes do início não é apresentado como ausência comprovada de estudo. Para contas novas, iniciar com a criação da conta. Não fazer backfill de atividades antigas sem um evento de origem com ID e instante confiáveis; esta versão começa a contar no início do rastreamento. `add-study-analytics`, se aplicado depois, deve reutilizar o ledger para atividades futuras sem registrar cópias.

A página privada de progresso mostra sequência atual/recorde, fuso escolhido, data de início do histórico rastreado e catálogo com progresso, critério e data de obtenção. A edição do fuso ocorre em `/conta`. Estados loading, erro, vazio e sucesso, teclado, 320 px e movimento reduzido seguem o padrão do projeto. A API devolve somente dados da sessão. Alternativa rejeitada: usar fuso do dispositivo em cada consulta, que faria os resultados variar entre aparelhos.

## Risks / Trade-offs

- [Produtores ainda não aplicados ou sem evento de transição] → aplicar predecessores primeiro e integrar no service de cada transição efetiva, sem capturar apenas requisições HTTP.
- [Registro de atividade torna mutações dependentes da tabela comum] → escrever na mesma transação, testar falhas e manter a operação pequena e indexada; nunca deixar conclusão confirmada sem evento.
- [Eventos atrasados e fusos trocados] → histórico efetivo de zonas, data local congelada e recálculo de séries/concessões.
- [Histórico anterior incompleto] → marco de início visível e ausência de backfill inventado; futuro importador só poderá usar fontes com ID e instante confiáveis.
- [Crescimento do ledger e custo do recálculo] → índices por usuário/data/tipo; medir volume e materializar projeções idempotentes quando houver necessidade.
- [Exclusão de conteúdo deixa fato histórico] → registrar somente tipo, IDs opacos e instante, sem texto ou resposta; apagar todos os registros ao excluir a conta conforme política de dados.

## Migration Plan

1. Após os módulos produtores e autenticação, criar migrations versionadas para fuso/histórico, rastreamento, eventos e concessões; manter `synchronize: false`.
2. Estabelecer `tracking_started_at_utc` sem backfill fictício; integrar cada produtor ao contrato de registro na mesma transação e confirmar as chaves de origem de cada transição.
3. Publicar API e web de progresso após testes MySQL reais, isolados e com relógio/fuso controlados; verificar limites de meia-noite, horário de verão, concorrência e dois usuários.
4. Em rollback do código, ocultar a área e parar novas concessões; preservar ledger, fuso e grants para retomada sem duplicação. Não apagar histórico automaticamente.
