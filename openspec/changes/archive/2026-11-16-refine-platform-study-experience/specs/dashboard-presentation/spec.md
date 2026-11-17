# Spec Delta

## ADDED Requirements

### Requirement: Prévia de baralhos e rolagem de matérias

O card Flashcards SHALL manter o total de cartões pendentes e mostrar os nomes dos baralhos da conta em ordem decrescente pelo total de cartões, com desempate estável. A lista SHALL reutilizar a rolagem interna e o desfoque de bordas de Tarefas quando houver conteúdo fora da área visível. O corpo de Matérias SHALL reutilizar a rolagem interna quando necessário, preservando o destaque e o acesso pelo rodapé.

#### Scenario: Prévia de baralhos e rolagem de matérias

- **WHEN** as prévias excedem a altura dos cards
- **THEN** é possível rolar o conteúdo de Flashcards e Matérias com os links de rodapé visíveis, e Flashcards aplica desfoque nas bordas com conteúdo oculto.
