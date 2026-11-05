# Spec Delta

## ADDED Requirements

### Requirement: Lista de baralhos com resumo de estudo

A lista SHALL apresentar os baralhos próprios em linhas compactas, com nome acionável à esquerda, matéria visível ao lado quando disponível e contagens de **Novos**, **Em aprendizagem** e **Para revisão** alinhadas em colunas. A interface SHALL oferecer filtro por matéria própria quando o módulo de matérias estiver ativo e aplicar o filtro antes da paginação, preservando a ordem estável. Baralhos sem vínculo SHALL aparecer na opção **Todas as matérias**. A lista SHALL preservar acesso às ações de gerenciamento existentes e adaptar as contagens com rótulos explícitos em telas estreitas.

#### Scenario: Filtrar por matéria

- **GIVEN** baralhos próprios vinculados a matérias distintas e um baralho sem vínculo
- **WHEN** a pessoa seleciona uma matéria no filtro
- **THEN** a lista paginada mostra somente seus baralhos vinculados à matéria selecionada, com os três contadores
- **AND** ao retornar a **Todas as matérias**, a lista volta a incluir os baralhos sem vínculo.

#### Scenario: Matérias desativadas

- **WHEN** a pessoa abre Baralhos com o módulo de matérias desativado
- **THEN** vê seus baralhos e contadores sem o filtro nem os nomes das matérias bloqueadas.
