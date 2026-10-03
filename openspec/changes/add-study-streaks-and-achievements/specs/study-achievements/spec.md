# Spec Delta

## Purpose

Reconhecer marcos de estudo por critérios estáveis e verificáveis, concedendo cada conquista uma única vez à conta que realizou as atividades.

## ADDED Requirements

### Requirement: Catálogo e critérios explícitos

A EduTrack SHALL oferecer o seguinte catálogo fixo, com progresso derivado apenas das atividades válidas definidas em `study-streaks`: **Primeiro dia** ao alcançar 1 data ativa; **Três dias seguidos** ao alcançar uma sequência de 3 datas ativas; **Sete dias seguidos** ao alcançar uma sequência de 7 datas ativas; **Tarefas em dia** ao somar 10 transições de tarefa para `COMPLETED`; **Foco consistente** ao somar 5 blocos Pomodoro completos; **Revisão constante** ao somar 20 avaliações confirmadas de flashcards; e **Plano em andamento** ao somar 5 conclusões de itens do plano manual de matérias ou blocos completos de roadmap. Para o último critério, cada item ou bloco concluído contribui uma unidade; passos isolados não contribuem. A interface SHALL mostrar nome, critério, progresso e data da conquista obtida.

#### Scenario: Conquista de matéria
- **GIVEN** três itens manuais de matéria e um bloco de roadmap já concluídos
- **WHEN** o usuário conclui outro bloco de roadmap
- **THEN** recebe **Plano em andamento** uma vez, com total de cinco conclusões válidas.

#### Scenario: Avaliação de flashcard
- **GIVEN** 19 avaliações confirmadas de flashcards
- **WHEN** o usuário revela outro cartão e registra uma avaliação
- **THEN** recebe **Revisão constante**
- **AND** uma revelação sem avaliação não teria aumentado o progresso.

### Requirement: Concessão única e persistente

Cada conquista SHALL ser concedida no máximo uma vez por usuário, inclusive quando eventos são repetidos, processados em ordem diferente ou concorrentes. A data de obtenção SHALL refletir o primeiro instante em que o critério foi alcançado pelos fatos confirmados. Reabrir e concluir novamente pode aumentar um contador de atividades, mas não SHALL conceder novamente uma conquista já obtida. Excluir depois o objeto que originou atividade, desativar módulo ou mudar o fuso SHALL NOT revogar a conquista.

#### Scenario: Eventos repetidos e concorrentes
- **GIVEN** quatro blocos Pomodoro completos já contados
- **WHEN** o evento do quinto bloco é recebido duas vezes em paralelo
- **THEN** **Foco consistente** é concedida uma vez e seu progresso é cinco.

#### Scenario: Reabrir após conquista
- **GIVEN** **Tarefas em dia** já obtida
- **WHEN** uma tarefa concluída é reaberta e concluída novamente
- **THEN** o total de conclusões válidas aumenta uma vez
- **AND** a conquista e sua data original permanecem únicas.

### Requirement: Consultar conquistas da própria conta

A consulta SHALL exigir sessão válida e filtrar as concessões e o progresso pelo usuário autenticado. A interface SHALL distinguir conquistas obtidas das ainda não obtidas e apresentar estado vazio quando ainda não há atividade rastreada, sem divulgar dados de outras contas. IA desativada SHALL NOT bloquear a concessão por atividades manuais. Nenhuma ação de consulta SHALL criar atividade válida.

#### Scenario: Conta sem conquistas
- **WHEN** uma conta sem atividade rastreada abre as conquistas
- **THEN** vê critérios e progresso zero, sem indicação falsa de conquista obtida.

#### Scenario: Isolamento
- **GIVEN** duas contas com quantidades diferentes de tarefas concluídas
- **WHEN** uma delas consulta suas conquistas
- **THEN** vê apenas seu próprio progresso e suas concessões.
