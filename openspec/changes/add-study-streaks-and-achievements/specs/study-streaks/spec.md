# Spec Delta

## Purpose

Calcular a sequência atual e a maior sequência de dias em que uma pessoa estudou, usando atividades confirmadas e datas locais atribuídas no fuso salvo da conta.

## ADDED Requirements

### Requirement: Fuso de estudo próprio e persistente

Cada conta SHALL ter um fuso IANA de estudo visível e editável em `/conta`. Um fuso inválido SHALL ser recusado; na ausência de escolha válida, UTC SHALL ser usado e indicado claramente. A data de uma atividade SHALL ser calculada no fuso salvo quando ela ocorre e SHALL permanecer a mesma após mudanças posteriores do fuso. A interface SHALL sugerir o fuso do dispositivo quando válido, sem alterá-lo silenciosamente.

#### Scenario: Atividade perto da meia-noite
- **GIVEN** uma conta com fuso `America/Sao_Paulo`
- **WHEN** uma atividade é confirmada às 01:30 UTC de 24 de setembro
- **THEN** ela conta para 23 de setembro na conta.

#### Scenario: Alterar o fuso
- **GIVEN** uma atividade já creditada em 23 de setembro
- **WHEN** o usuário troca seu fuso IANA
- **THEN** a atividade conserva sua data creditada
- **AND** somente atividades futuras usam o novo fuso.

### Requirement: Reconhecer apenas atividades de estudo confirmadas

Um dia SHALL ser ativo quando houver ao menos um dos seguintes fatos confirmados da própria conta: tarefa que transita para `COMPLETED` (inclusive por conclusão de subtarefas); bloco Pomodoro de 25 minutos ativos concluído, ainda que a sessão seja cancelada depois; avaliação registrada de flashcard na revisão espaçada; item do plano manual de matéria que transita para `COMPLETED`; ou bloco de roadmap que passa a ter todos os passos concluídos. Concluir apenas um passo de roadmap sem completar o bloco, revelar um flashcard sem avaliar, concluir apenas uma subtarefa sem concluir a tarefa, tempo parcial de Pomodoro sem bloco e criar/editar conteúdo SHALL NOT ativar dia. Blocos de roadmap SHALL contar mesmo quando seus passos forem concluídos manualmente, sem exigir IA.

#### Scenario: Bloco de matéria completo
- **GIVEN** um bloco de roadmap da matéria com dois passos, um pendente
- **WHEN** o último passo é concluído e o bloco fica completo
- **THEN** a data local dessa conclusão torna-se ativa
- **AND** concluir apenas o primeiro passo não teria ativado o dia.

#### Scenario: Sessão Pomodoro cancelada após bloco
- **GIVEN** uma sessão com um bloco de 25 minutos já completo
- **WHEN** a pessoa cancela a sessão
- **THEN** o dia da conclusão do bloco continua ativo
- **AND** o cancelamento não cria atividade adicional.

#### Scenario: Revelar sem avaliar
- **WHEN** a pessoa apenas revela a resposta de um flashcard
- **THEN** nenhuma atividade válida é registrada para a sequência.

### Requirement: Dias e eventos idempotentes

Cada transição, bloco ou avaliação confirmada SHALL contribuir no máximo uma atividade, mesmo com repetição, concorrência ou reprocessamento. Várias atividades distintas na mesma data local SHALL contribuir apenas um dia ativo para a sequência. Reabrir e concluir novamente uma tarefa, item ou bloco SHALL gerar nova atividade apenas após nova transição efetiva para concluído. Excluir posteriormente uma tarefa, matéria ou cartão SHALL NOT apagar dias históricos já creditados.

#### Scenario: Muitas atividades no mesmo dia
- **WHEN** o usuário conclui uma tarefa, um bloco Pomodoro e avalia um flashcard na mesma data local
- **THEN** a sequência ganha apenas um dia ativo
- **AND** cada atividade mantém sua identidade para os critérios das conquistas.

#### Scenario: Repetição e reabertura
- **GIVEN** uma tarefa já concluída
- **WHEN** a mesma conclusão é reenviada duas vezes
- **THEN** há uma única atividade
- **AND** reabrir a tarefa e concluí-la de novo produz uma nova atividade confirmada.

### Requirement: Exibir sequência atual e recorde

A EduTrack SHALL apresentar sequência atual e maior sequência de datas locais consecutivas com atividade. Hoje ativo SHALL integrar a sequência atual; se hoje ainda não tiver atividade, a sequência que terminou ontem SHALL permanecer atual até o fim do dia de hoje. Se nem hoje nem ontem forem ativos, a sequência atual SHALL ser zero. A maior sequência SHALL ser o máximo histórico e SHALL não diminuir quando a sequência atual terminar. Dias SHALL ser comparados por datas de calendário no fuso creditado, sem supor duração fixa de 24 horas. Conta sem atividades SHALL mostrar zero e estado vazio explicativo.

#### Scenario: Hoje ainda sem atividade
- **GIVEN** atividades em três datas consecutivas terminando ontem
- **WHEN** o usuário abre o progresso hoje sem estudar ainda
- **THEN** vê sequência atual de três dias e recorde de ao menos três.

#### Scenario: Perder um dia inteiro
- **GIVEN** a última atividade ocorreu anteontem
- **WHEN** o usuário abre o progresso hoje
- **THEN** a sequência atual é zero e o recorde anterior permanece.

### Requirement: Consulta própria e limites do histórico

Configuração de fuso, dias e sequências SHALL pertencer apenas à conta autenticada. A API SHALL derivar o usuário da sessão, sem aceitar ID de outro usuário como autorização. Atividades anteriores à existência de registros confiáveis SHALL ser marcadas como não rastreadas, sem inventar dias ativos nem apresentar zero histórico como prova de ausência de estudo. A visualização SHALL funcionar por teclado, com foco visível, estados de loading/erro/vazio/sucesso e largura desde 320 px.

#### Scenario: Duas contas
- **GIVEN** duas contas com atividades no mesmo dia
- **WHEN** cada uma consulta seu progresso
- **THEN** vê somente sua própria sequência e fuso.
