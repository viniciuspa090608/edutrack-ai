## MODIFIED Requirements

### Requirement: Preferências de estudo lado a lado
As opções Disciplinas, Tarefas e Flashcards SHALL aparecer na mesma linha quando houver espaço suficiente, preservando checkboxes quadrados, seleção, bloqueios e regra de ao menos um módulo ativo. Em telas estreitas SHALL reorganizar sem corte ou rolagem horizontal.

#### Scenario: Preferências responsivas
- **WHEN** a pessoa altera preferências em desktop ou em 320 px
- **THEN** as opções ficam lado a lado em desktop e adaptadas em mobile, com persistência e validação existentes preservadas.

A grade completa SHALL seguir Disciplinas, Tarefas, Flashcards, Pomodoro, Rotinas, Relatório e Recursos de IA em ordem de leitura igual à sidebar, mantendo as três primeiras opções juntas em desktop.

#### Scenario: Ordem completa
- **WHEN** a pessoa percorre as opções em desktop ou mobile
- **THEN** a ordem visual e por teclado acompanha a sidebar.

## ADDED Requirements

### Requirement: Coluna lateral da Conta integralmente acessível
A coluna com resumo de perfil e navegação SHALL permanecer visível abaixo do cabeçalho fixo durante a rolagem em desktop. Sua altura SHALL respeitar a área útil da viewport; se exceder essa área, SHALL permitir rolagem interna por ponteiro, toque e teclado, sem cortes permanentes. Em telas estreitas SHALL adotar fluxo adaptado sem sobrepor conteúdo. Âncoras, destaque de seção e rascunhos SHALL ser preservados.

#### Scenario: Desktop com pouca altura
- **WHEN** a pessoa rola a Conta com coluna maior que a altura disponível
- **THEN** o topo não fica oculto pelo cabeçalho e todos os itens da coluna ficam alcançáveis por rolagem interna e teclado.

#### Scenario: Âncora e mobile
- **WHEN** a pessoa seleciona uma seção ou abre a Conta em 320 px
- **THEN** o destino e o foco não ficam encobertos, não ocorre sobreposição e rascunhos são preservados.
