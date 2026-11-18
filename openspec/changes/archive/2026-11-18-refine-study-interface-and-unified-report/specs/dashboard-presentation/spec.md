## ADDED Requirements

### Requirement: Rolagem funcional no resumo de disciplinas
A área interna de conteúdo de Disciplinas SHALL permitir acesso integral ao resumo quando exceder a altura disponível, com rolagem vertical por ponteiro, toque e teclado, sem cortar texto ou barra de progresso. Cabeçalho e link Abrir disciplinas SHALL permanecer fora da área rolável. Sem excesso SHALL dispensar rolagem artificial.

#### Scenario: Resumo extenso
- **WHEN** nome, plano e indicadores excedem a área interna
- **THEN** é possível alcançar o último conteúdo e o link do rodapé continua visível.

### Requirement: Conquistas obtidas no resumo de progresso
O espaço abaixo dos indicadores do card Progresso SHALL exibir ícones das conquistas realmente obtidas, com gap de 4 px entre cards. Cada conquista SHALL manter ícone, nome acessível e cor de destaque próprios, iguais aos da aba Progresso. Havendo excesso, somente a div das conquistas SHALL rolar verticalmente, mantendo indicadores e rodapé fixos na composição. Sem concessões SHALL mostrar estado neutro sem simular conquista.

#### Scenario: Muitas conquistas
- **WHEN** as conquistas obtidas excedem a área reservada
- **THEN** todas ficam alcançáveis na rolagem local sem mover indicadores ou Abrir progresso.

#### Scenario: Concessão e identidade
- **WHEN** uma conquista possui earnedAt e outra está pendente
- **THEN** somente a obtida aparece na prévia e usa a mesma identidade visual do mural.

### Requirement: Redistribuir altura entre Pomodoro e Flashcards
Na composição desktop em que Pomodoro fica acima de Flashcards, o card Pomodoro SHALL ser compacto tanto com Iniciar Pomodoro quanto com cronômetro, reduzindo espaços vazios entre conteúdo e ação. A altura liberada SHALL aumentar na mesma proporção a área útil da lista de baralhos, preservando a altura conjunta dos cards e o alinhamento com Tarefas. Flashcards SHALL mostrar mais baralhos antes de ativar sua rolagem interna, preservando totais, ordem e rodapé. Sem os cards adjacentes ou em telas estreitas SHALL adotar altura natural.

#### Scenario: Transferência de espaço
- **WHEN** ambos os cards são apresentados no desktop com vários baralhos
- **THEN** a redução de altura de Pomodoro corresponde ao aumento da área útil de Flashcards e mais baralhos ficam visíveis.

#### Scenario: Cronômetro e preferências
- **WHEN** o cronômetro está ativo ou um módulo adjacente é desabilitado
- **THEN** a sessão mantém seu comportamento e a composição se adapta sem espaço artificial.

## MODIFIED Requirements

### Requirement: Centralização vertical da ação inicial de Pomodoro
O card Pomodoro da Home SHALL apresentar Iniciar Pomodoro próximo ao texto introdutório, em área compacta com espaçamento legível, sem expandir espaço vazio para centralizar o botão. SHALL preservar cabeçalho, contagem de sessões e link Abrir pomodoro.

#### Scenario: Pomodoro disponível para iniciar
- **WHEN** o card exibe a ação Iniciar Pomodoro
- **THEN** texto e botão formam um grupo compacto e permanecem legíveis em telas estreitas.
