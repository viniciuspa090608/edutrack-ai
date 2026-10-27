# Spec Delta

## Purpose

Garantir apresentação acessível e responsiva dos controles existentes de Flashcards, preferências de módulos e navegação entre páginas, preservando suas ações.

## ADDED Requirements

### Requirement: Ações responsivas de Flashcards
A interface SHALL apresentar cada grupo de botões de Flashcards na mesma linha quando houver espaço horizontal suficiente, permitindo quebra em telas estreitas sem compressão que prejudique textos ou ícones e sem overflow horizontal. Textos, ações e estados existentes SHALL permanecer inalterados.

#### Scenario: Espaço amplo
- **WHEN** Flashcards é exibido em tela grande com espaço suficiente para as ações do grupo
- **THEN** os botões do grupo permanecem na mesma linha e legíveis.

#### Scenario: Espaço estreito
- **WHEN** Flashcards é exibido em tela pequena, inclusive a 320 px
- **THEN** os grupos podem quebrar em múltiplas linhas sem rolagem horizontal nem sobreposição ou perda de conteúdo.

### Requirement: Checkboxes quadrados de Módulos
Os checkboxes de Configurações > Módulos SHALL manter largura e altura equivalentes, sem deformação pelo container. A interface SHALL preservar checked, unchecked, disabled, hover e foco visível, bem como o comportamento de atualização existente.

#### Scenario: Alternância e proporção
- **WHEN** a pessoa visualiza e alterna um checkbox de Módulos
- **THEN** o controle permanece quadrado nos estados marcado e desmarcado e a ação existente continua funcionando.

#### Scenario: Controle indisponível
- **WHEN** um checkbox de Módulos está desabilitado
- **THEN** ele permanece quadrado, apresenta desativação visível e não permite alteração pelo usuário.

### Requirement: Paginação direcional acessível
As paginações existentes SHALL apresentar ícones direcionais nos controles de anterior e próximo, com identificação acessível equivalente. A interface SHALL preservar navegação, contagem e condições existentes de indisponibilidade, desabilitando visualmente e funcionalmente anterior quando não houver página anterior e próximo quando não houver próxima página.

#### Scenario: Primeira página
- **WHEN** a paginação está na primeira página
- **THEN** anterior está desabilitado e sua ativação não navega.

#### Scenario: Última página ou lista vazia
- **WHEN** não existe uma próxima página, inclusive em lista vazia ou de página única
- **THEN** próximo está desabilitado e sua ativação não navega.

#### Scenario: Navegação disponível
- **WHEN** a pessoa ativa um controle direcional habilitado por mouse ou teclado
- **THEN** a navegação existente ocorre na direção indicada e o nome acessível informa seu significado.

### Requirement: Consistência visual das áreas alteradas
As áreas alteradas SHALL preservar os padrões existentes de tema claro e escuro, tipografia, hover, foco, disabled, teclado, responsividade e movimento reduzido, sem alterar regras de negócio ou fluxos.

#### Scenario: Temas e teclado
- **WHEN** a pessoa usa as áreas alteradas em tema claro ou escuro e navega por teclado em telas amplas ou estreitas
- **THEN** controles e estados permanecem legíveis, identificáveis e operáveis, com foco visível e sem overflow horizontal.
