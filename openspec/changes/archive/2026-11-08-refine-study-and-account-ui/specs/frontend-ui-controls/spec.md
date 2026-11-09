# Spec Delta

## ADDED Requirements

### Requirement: Dimensões consistentes dos campos de linha única
Campos de texto, seleção e data SHALL compartilhar altura e espaçamento interno consistentes em estados equivalentes. Campos multilinha SHALL manter altura apropriada ao conteúdo. Os quatro filtros de Tarefas SHALL ocupar colunas de mesma largura quando na mesma linha e refluir em telas estreitas.

#### Scenario: Filtros de tarefas
- **WHEN** status, importância, prazo inicial e prazo final aparecem na mesma linha
- **THEN** os campos têm a mesma altura e largura, com bordas e conteúdo alinhados.
- **AND** em 320 px rótulos e controles continuam acessíveis sem rolagem horizontal da página.

### Requirement: Paginação de baralhos no rodapé visível
Quando os controles da lista de baralhos forem exibidos, a paginação SHALL ficar no rodapé visível da área de conteúdo, com espaço reservado para a última linha e para a navegação do shell. SHALL preservar o comportamento direcional, a página atual e os limites existentes.

#### Scenario: Lista curta ou rolável
- **WHEN** a lista tem poucos itens ou é longa o bastante para rolar
- **THEN** a paginação permanece no rodapé e a última linha e seu foco podem ficar totalmente visíveis.
