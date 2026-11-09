# Spec Delta


## ADDED Requirements

### Requirement: Estado vazio da lista de baralhos
Quando confirmar ausência de baralhos cadastrados, Flashcards SHALL mostrar um estado vazio no padrão visual de Tarefas, com ícone centralizado, título Nenhum baralho ainda, descrição breve e botão Criar baralho ligado ao fluxo existente.

#### Scenario: Coleção vazia e resultado filtrado
- **WHEN** a consulta termina com a coleção realmente vazia
- **THEN** o estado oferece criação. Se houver baralhos e apenas o filtro não encontrar resultados, a interface identifica a ausência de resultados do filtro. Carregamento e erro têm tratamento próprio.
