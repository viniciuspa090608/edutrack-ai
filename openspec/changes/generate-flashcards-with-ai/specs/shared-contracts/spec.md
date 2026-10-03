# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos da geração de flashcards com IA

Web e API SHALL compartilhar schemas de validação em tempo de execução e tipos públicos para solicitação de geração, cartões da prévia e confirmação revisada, incluindo baralho de destino e representação de frente e verso compatível com cartões manuais. Esses contratos SHALL rejeitar conteúdo vazio, cartões inválidos e campos desconhecidos, sem expor entidades de persistência ou segredos do provedor.

#### Scenario: Prévia compatível com o editor
- **WHEN** uma geração válida é devolvida pela API e exibida pela web
- **THEN** ambos usam o mesmo contrato para baralho, frente e verso dos cartões.

#### Scenario: Confirmação inválida
- **WHEN** uma confirmação externa contém cartão sem verso ou um identificador de destino incompatível
- **THEN** o schema compartilhado rejeita a entrada antes do salvamento.
