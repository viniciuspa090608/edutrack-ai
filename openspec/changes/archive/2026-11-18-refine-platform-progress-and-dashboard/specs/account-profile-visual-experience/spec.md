# Spec Delta

## MODIFIED Requirements

### Requirement: Preferências de estudo lado a lado
As opções Tarefas, Matérias e Flashcards SHALL aparecer na mesma linha quando houver espaço suficiente, preservando checkboxes quadrados, seleção, bloqueios e regra de ao menos um módulo ativo. Em telas estreitas SHALL reorganizar sem corte ou rolagem horizontal.

#### Scenario: Preferências responsivas
- **WHEN** a pessoa altera preferências em desktop ou em 320 px
- **THEN** as opções ficam lado a lado em desktop e adaptadas em mobile, com persistência e validação existentes preservadas.

A grade completa SHALL seguir Tarefas, Disciplinas, Flashcards, Pomodoro, Rotinas, Relatório e Recursos de IA em ordem de leitura igual à sidebar, mantendo as três primeiras opções juntas em desktop.

#### Scenario: Ordem completa
- **WHEN** a pessoa percorre as opções em desktop ou mobile
- **THEN** a ordem visual e por teclado acompanha a sidebar.

## ADDED Requirements

### Requirement: Orientação abaixo do título principal
A página Conta SHALL exibir “As alterações são salvas em cada seção. Suas preferências não removem seus dados de estudo.” logo abaixo do título principal Conta, removendo o texto do rodapé da navegação lateral. SHALL aparecer uma única vez e permanecer legível nos dois temas e desde 320 px, preservando o salvamento explícito por seção.

#### Scenario: Abrir e navegar na Conta
- **WHEN** a pessoa abre Conta e navega entre seções
- **THEN** encontra a orientação abaixo do título principal, sem cópia no rodapé lateral e sem alteração dos fluxos de salvamento.
