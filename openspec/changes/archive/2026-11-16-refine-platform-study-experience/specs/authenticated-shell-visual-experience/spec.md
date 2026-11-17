# Spec Delta

## MODIFIED Requirements

### Requirement: Sidebar desktop com destinos reais

A partir de 1024 px, o shell SHALL apresentar sidebar com ícone, rótulo, estado ativo, hover e foco. Os destinos visíveis SHALL seguir a ordem Início, Matérias, Tarefas, Flashcards, Rotinas, Pomodoro, Relatório, IA e Conta, respeitando as preferências de módulos e de visibilidade. IA SHALL abrir a seção de inteligência artificial da Conta. Sair SHALL ocupar região separada inferior. A navegação SHALL permitir scroll interno em pouca altura sem tornar Sair inalcançável.

#### Scenario: Desktop com pouca altura
- **WHEN** todos os módulos estão habilitados em viewport desktop de pouca altura
- **THEN** todos os destinos e Sair permanecem alcançáveis por scroll e teclado, sem overflow horizontal provocado pelo shell.

## ADDED Requirements

### Requirement: Retorno de detalhes

Telas de detalhes de matérias, tarefas, baralhos e outros detalhes com visão de origem SHALL oferecer **← Voltar** no topo.

#### Scenario: Ordem do menu lateral e retorno de detalhes

- **WHEN** a pessoa abre um detalhe por uma lista ou por um link direto
- **THEN** Voltar retorna à origem interna preservando filtros e paginação aplicáveis ou à visão principal do recurso quando não houver origem interna.
