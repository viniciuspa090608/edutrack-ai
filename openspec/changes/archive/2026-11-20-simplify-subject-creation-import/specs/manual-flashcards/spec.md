## ADDED Requirements

### Requirement: Estado vazio de baralhos ocupa a altura restante
O card Nenhum baralho ainda SHALL preencher a altura útil restante abaixo do cabeçalho e controles de Flashcards, mantendo margem inferior do shell e conteúdo centralizado. SHALL preservar a distinção entre ausência real, filtro sem resultados, loading e erro e manter Criar baralho ligado ao fluxo existente. Quando o conteúdo couber SHALL NOT criar rolagem adicional; em telas baixas, zoom ou conteúdo ampliado SHALL permitir rolagem para alcançar todas as ações.

#### Scenario: Desktop vazio
- **WHEN** Flashcards confirma ausência real de baralhos e há altura disponível
- **THEN** o card se estende até a margem inferior útil, sem faixa vazia desnecessária abaixo.

#### Scenario: Tela baixa e filtro
- **WHEN** a pessoa usa zoom ou filtra baralhos existentes sem correspondências
- **THEN** o conteúdo permanece alcançável e o filtro não é apresentado como ausência global.
