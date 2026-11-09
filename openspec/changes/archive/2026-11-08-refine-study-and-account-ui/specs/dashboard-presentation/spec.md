# Spec Delta

## ADDED Requirements

### Requirement: Dimensões estáveis dos cards da Home
Em desktop, para a mesma largura e conjunto de módulos visíveis, os cards SHALL manter as dimensões da composição vazia de referência ao receber conteúdo. Tarefas SHALL ocupar a altura conjunta de Pomodoro e Flashcards quando ambos estiverem presentes e sua lista SHALL rolar internamente se exceder o espaço reservado, mantendo Abrir tarefas visível. Em telas estreitas ou com cartões adjacentes omitidos, a composição SHALL se adaptar e manter todas as ações alcançáveis.

#### Scenario: Tarefas preenchem o espaço reservado
- **WHEN** a lista de próximas tarefas é maior do que o espaço interno
- **THEN** é possível rolar até o último item com teclado ou ponteiro e o card de Flashcards mantém sua posição.

### Requirement: Resumo alinhado ao título dos cards
Quando houver resumo em Tarefas, Pomodoro, Flashcards e Estatísticas, o texto secundário SHALL aparecer abaixo do título, alinhado à margem esquerda dele com 3 px de distância vertical, com o ícone à esquerda do bloco.

#### Scenario: Resumo longo
- **WHEN** o resumo precisa de mais de uma linha
- **THEN** as linhas quebram na coluna do título com contraste legível.

### Requirement: Estado inicial legível do card Progresso
Quando os dados confirmarem ausência de dias ativos registrados, o card SHALL exibir Nenhuma atividade registrada e orientar a concluir uma atividade de estudo para registrar o primeiro dia ativo. A data inicial do histórico SHALL aparecer como informação secundária quando disponível e Abrir progresso SHALL ficar no rodapé. Dados indisponíveis e falhas SHALL manter seu tratamento próprio.

#### Scenario: Histórico válido sem dias ativos
- **WHEN** o resumo confirma que o usuário ainda não registrou um dia ativo
- **THEN** a orientação substitui os contadores zerados e o acesso a Progresso continua visível.
