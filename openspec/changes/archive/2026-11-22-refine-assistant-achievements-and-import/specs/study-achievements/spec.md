## MODIFIED Requirements

### Requirement: Catálogo e critérios explícitos

A EduTrack SHALL oferecer o seguinte catálogo fixo, com progresso derivado apenas das atividades válidas definidas em `study-streaks`: **Primeiro dia** ao alcançar 1 data ativa; **Três dias seguidos** ao alcançar uma sequência de 3 datas ativas; **Sete dias seguidos** ao alcançar uma sequência de 7 datas ativas; **Tarefas em dia** ao somar 10 transições de tarefa para `COMPLETED`; **Foco consistente** ao somar 5 blocos Pomodoro completos; **Revisão constante** ao somar 20 avaliações confirmadas de flashcards; e **Plano em andamento** ao somar 5 conclusões de itens do plano manual de matérias ou blocos completos de roadmap. Para o último critério, cada item ou bloco concluído contribui uma unidade; passos isolados não contribuem. O catálogo SHALL incluir também **Quatorze dias seguidos** ao alcançar 14 datas ativas consecutivas e **Revisão dedicada** ao registrar 100 avaliações confirmadas de flashcards, totalizando nove conquistas. As novas conquistas SHALL usar somente histórico válido já rastreado, com concessão única na primeira data elegível e preservação das sete conquistas existentes. A interface SHALL mostrar nome, critério, progresso e data da conquista obtida.

#### Scenario: Conquista de matéria
- **GIVEN** três itens manuais de matéria e um bloco de roadmap já concluídos
- **WHEN** o usuário conclui outro bloco de roadmap
- **THEN** recebe **Plano em andamento** uma vez, com total de cinco conclusões válidas.

#### Scenario: Avaliação de flashcard
- **GIVEN** 19 avaliações confirmadas de flashcards
- **WHEN** o usuário revela outro cartão e registra uma avaliação
- **THEN** recebe **Revisão constante**
- **AND** uma revelação sem avaliação não teria aumentado o progresso.

#### Scenario: Novos limiares
- **WHEN** uma conta alcança 14 datas ativas consecutivas ou registra sua centésima avaliação confirmada
- **THEN** recebe respectivamente Quatorze dias seguidos ou Revisão dedicada, uma única vez, com progresso e data corretos.

#### Scenario: Antes dos limiares e conta nova
- **WHEN** uma conta tem sequência máxima de 13 datas e 99 avaliações, ou nenhuma atividade
- **THEN** as duas novas conquistas continuam bloqueadas com progresso correto; a conta nova vê nove conquistas com progresso zero.

#### Scenario: Histórico anterior e repetição
- **WHEN** o histórico válido já satisfaz os novos critérios e o progresso é recalculado repetidamente
- **THEN** as novas conquistas usam a primeira data elegível sem duplicação, preservando concessões antigas e isolamento por conta.
