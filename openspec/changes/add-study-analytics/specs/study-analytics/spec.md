# Spec Delta

## Purpose

Apresentar estatísticas privadas e comparáveis do estudo realizado, derivadas dos registros dos módulos, com períodos de calendário interpretados no fuso horário do usuário.

## ADDED Requirements

### Requirement: Consultar períodos de calendário no fuso informado
A EduTrack SHALL permitir consultar dia, semana ISO de segunda a domingo, trimestre calendário, semestre calendário e ano calendário a partir de uma data de referência e um fuso IANA válido. Cada consulta SHALL devolver início/fim locais, série de dias e valores do período anterior imediatamente adjacente, com o mesmo tipo de período. Uma data ou fuso inválido SHALL ser rejeitado. Resultados diários SHALL respeitar mudanças de horário de verão e SHALL atribuir tempo ativo ao dia local em que ele ocorreu, mesmo quando uma sessão atravessar a meia-noite.

#### Scenario: Sessão atravessa meia-noite
- **GIVEN** uma sessão com tempo ativo antes e depois da meia-noite no fuso consultado
- **WHEN** o usuário consulta os dois dias
- **THEN** cada dia recebe apenas sua parcela de tempo ativo e a soma preserva o total da sessão.

#### Scenario: Semana e períodos anteriores
- **WHEN** o usuário consulta uma quarta-feira no modo semanal
- **THEN** o período mostrado começa na segunda-feira local e termina no domingo local
- **AND** a comparação usa a semana imediatamente anterior.

### Requirement: Mostrar métricas derivadas de atividades
A área SHALL mostrar tempo ativo estudado de sessões Pomodoro encerradas, inclusive tempo parcial de sessões canceladas; quantidade de sessões Pomodoro concluídas; tarefas que passaram a concluídas; avaliações de revisão de flashcards; itens do plano manual de matérias que passaram a concluídos; e, separadamente, blocos de roadmap cujos passos passaram todos a concluídos. A simples revelação de um flashcard SHALL NOT contar como revisão. Cada transição ou avaliação confirmada SHALL contribuir uma vez, sem duplicar por repetição da requisição. Reabrir uma tarefa/item/bloco SHALL NOT apagar uma conclusão histórica; uma nova conclusão após reabertura SHALL contar como nova atividade.

#### Scenario: Sessão cancelada com tempo parcial
- **GIVEN** uma sessão cancelada com 10 minutos ativos e zero blocos Pomodoro
- **WHEN** o usuário consulta o período do encerramento
- **THEN** vê 10 minutos de estudo e zero sessões concluídas.

#### Scenario: Revisão avaliada
- **WHEN** o usuário revela três cartões e avalia somente dois na repetição espaçada
- **THEN** a estatística de revisões aumenta em dois, sem contar a revelação restante.

#### Scenario: Plano e roadmap separados
- **GIVEN** um item do plano manual concluído e um bloco de roadmap com todos os passos concluídos
- **WHEN** o usuário consulta as estatísticas de matérias
- **THEN** vê um item manual e um bloco de roadmap em métricas separadas.

### Requirement: Calcular frequência sem criar sequência de dias
A frequência SHALL ser o número de datas locais distintas com pelo menos uma atividade contabilizada: tempo ativo Pomodoro positivo, conclusão de tarefa, avaliação de flashcard, conclusão de item manual ou conclusão de bloco de roadmap. Várias atividades no mesmo dia SHALL contar como um dia ativo. A interface SHALL mostrar dias ativos sobre dias transcorridos do período consultado até agora, ou sobre todos os dias para períodos encerrados. Esta mudança SHALL NOT calcular sequência atual, maior sequência ou conquistas.

#### Scenario: Várias atividades no mesmo dia
- **WHEN** o usuário conclui tarefa, avalia cartões e estuda por Pomodoro na mesma data local
- **THEN** a frequência conta um dia ativo.

#### Scenario: Período sem atividade
- **WHEN** não há atividades no período
- **THEN** a frequência mostra zero dias ativos e a interface apresenta estado vazio, sem sugerir uma sequência de dias.

### Requirement: Mostrar evolução e distinguir ausência de histórico
Para cada métrica disponível, a área SHALL mostrar valor atual, valor do período anterior e diferença absoluta. Uma variação percentual SHALL ser exibida somente quando o valor anterior for maior que zero; caso contrário SHALL ser apresentada como não calculável, sem divisão por zero. O período corrente ainda em curso SHALL ser identificado como parcial. Dados historicamente não registrados SHALL ser identificados como indisponíveis, não apresentados como zero comprovado.

#### Scenario: Base anterior zero
- **GIVEN** zero revisões no período anterior e cinco no atual
- **WHEN** o usuário consulta evolução
- **THEN** vê diferença de cinco e percentual não calculável.

#### Scenario: Período atual parcial
- **WHEN** o usuário consulta o trimestre em curso
- **THEN** a interface identifica os valores atuais como parciais e mostra claramente o trimestre anterior usado na comparação.

### Requirement: Isolar estatísticas e respeitar módulos disponíveis
Toda consulta SHALL exigir autenticação e derivar o proprietário da sessão, sem aceitar ID de usuário do cliente como autorização. A API SHALL consultar somente atividades desse usuário. Métricas de tarefas, flashcards e matérias desativados por preferência SHALL ser omitidas da resposta e da interface, sem apagar registros; Pomodoro continua visível enquanto disponível. Desativar apenas IA SHALL NOT ocultar estatísticas de matéria ou revisão manual. Reativar um módulo SHALL restaurar suas métricas a partir dos registros preservados.

#### Scenario: Contas distintas
- **GIVEN** duas contas com atividades no mesmo dia
- **WHEN** cada uma consulta a área
- **THEN** recebe apenas suas próprias métricas e nenhum total da outra.

#### Scenario: Flashcards desativados
- **GIVEN** flashcards desativados e tarefas ativas
- **WHEN** o usuário consulta estatísticas
- **THEN** a métrica de revisões não aparece, a de tarefas aparece e os registros de revisão continuam preservados.

### Requirement: Interface acessível e estados claros
A página de estatísticas SHALL funcionar por teclado, ter rótulos e foco visível, apresentar valores também em texto, respeitar movimento reduzido e caber desde 320 px sem rolagem horizontal causada pelo layout. SHALL distinguir carregamento, erro recuperável, ausência de atividade, módulo indisponível e histórico anterior não rastreado. Gráficos SHALL ter equivalente textual.

#### Scenario: Sem dados em tela estreita
- **GIVEN** uma conta sem atividades e viewport de 320 px
- **WHEN** o usuário abre estatísticas
- **THEN** vê explicação de ausência de dados e controles de período acessíveis, sem gráfico vazio enganoso.
