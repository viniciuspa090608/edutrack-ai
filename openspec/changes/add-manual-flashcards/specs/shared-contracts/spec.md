# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos de baralhos e cartões manuais

Web e API SHALL compartilhar schemas de validação em tempo de execução e tipos públicos para criação, edição, listagem e detalhe de baralhos e cartões, incluindo frente, verso e associação opcional a matéria. Os contratos SHALL representar ausência de matéria explicitamente e SHALL NOT expor entidades ou detalhes de persistência.

#### Scenario: Baralho sem matéria
- **WHEN** web e API processam um baralho sem matéria
- **THEN** ambas usam a mesma representação pública de ausência de associação
- **AND** o baralho pode ser criado e consultado sem dados do módulo de matérias.

#### Scenario: Entrada inválida
- **WHEN** uma entrada externa contém frente vazia, verso vazio ou identificador de matéria malformado
- **THEN** o schema compartilhado rejeita o valor antes que ele seja tratado como dado validado.
