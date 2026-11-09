# Spec Delta

## ADDED Requirements

### Requirement: Estado vazio de Matérias preenche a área útil
O card Nenhuma matéria ainda SHALL preencher a área útil abaixo do cabeçalho de Matérias, respeitando margens e navegação do shell e centralizando ícone, texto e ação. O dimensionamento SHALL evitar rolagem causada pela expansão do card quando o conteúdo cabe. Altura reduzida ou zoom SHALL permitir rolagem necessária para alcançar o conteúdo.

#### Scenario: Área com espaço disponível
- **WHEN** a coleção está realmente vazia e há espaço suficiente
- **THEN** o card se estende até o limite inferior útil da página sem gerar rolagem extra.
