## MODIFIED Requirements

### Requirement: Estado vazio de Matérias preenche a área útil
O card de ausência real de disciplinas SHALL preencher a altura útil restante abaixo do cabeçalho e dos filtros de Disciplinas, respeitando margens e navegação do shell e centralizando ícone de livro, título, descrição e ação de adicionar disciplina no mesmo eixo vertical, nessa ordem. O botão SHALL usar largura ajustada ao conteúdo quando houver espaço. O dimensionamento SHALL evitar rolagem causada pela expansão do card quando o conteúdo cabe e eliminar faixa vazia desnecessária abaixo. Altura reduzida ou zoom SHALL permitir rolagem necessária para alcançar o conteúdo. Filtros sem resultados, loading e erro SHALL preservar seus tratamentos próprios.

#### Scenario: Área com espaço disponível
- **WHEN** a coleção está realmente vazia e há espaço suficiente
- **THEN** o card se estende até o limite inferior útil da página abaixo dos filtros sem gerar rolagem extra, com ícone, título, descrição e ação alinhados ao centro.

#### Scenario: Filtros expandidos e viewport baixa
- **WHEN** a pessoa expande filtros ou usa zoom e altura reduzida
- **THEN** o card se adapta à altura restante e permite alcançar seu conteúdo sem sobrepor controles ou navegação.
