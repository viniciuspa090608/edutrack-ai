# Spec Delta

## MODIFIED Requirements

### Requirement: Estado vazio de Matérias preenche a área útil
O card Nenhuma matéria ainda SHALL preencher a área útil abaixo do cabeçalho de Matérias, respeitando margens e navegação do shell e centralizando o ícone de livro, o título, a descrição e a ação Adicionar matéria no mesmo eixo vertical, nessa ordem. O botão SHALL usar largura ajustada ao conteúdo quando houver espaço. O dimensionamento SHALL evitar rolagem causada pela expansão do card quando o conteúdo cabe. Altura reduzida ou zoom SHALL permitir rolagem necessária para alcançar o conteúdo.

#### Scenario: Área com espaço disponível
- **WHEN** a coleção está realmente vazia e há espaço suficiente
- **THEN** o card se estende até o limite inferior útil da página sem gerar rolagem extra, com ícone, título, descrição e ação alinhados ao centro.
