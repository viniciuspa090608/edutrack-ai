## ADDED Requirements

### Requirement: Altura alinhada dos resumos laterais
No layout desktop em duas colunas, os cards Tempo estudado e Blocos de foco SHALL ocupar a altura disponível da coluna lateral, incluindo o espaço entre eles, alinhando o topo e a base do conjunto ao card principal. O ajuste SHALL acompanhar a altura do conteúdo sem cortar informações ou alterar timer e totais. No layout empilhado SHALL usar altura natural.

#### Scenario: Desktop e mudança de estado
- **WHEN** a preparação ou sessão do Pomodoro é exibida em duas colunas
- **THEN** o conjunto dos dois cards laterais alinha sua base à do principal sem espaço residual abaixo.

#### Scenario: Tela estreita
- **WHEN** a composição passa a uma coluna
- **THEN** os resumos se reorganizam com altura natural e sem espaços artificiais ou conteúdo cortado.
