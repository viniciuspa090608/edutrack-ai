# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos de sequências e conquistas

Web e API SHALL compartilhar schemas e tipos públicos para fuso IANA salvo, sequência atual, maior sequência, início do histórico rastreado e catálogo/progresso/concessão das conquistas. Entradas externas SHALL ser validadas em tempo de execução, sem expor eventos internos de outros usuários ou entidades de persistência.

#### Scenario: Fuso inválido
- **WHEN** a web ou a API recebe um identificador de fuso que não representa uma zona IANA válida
- **THEN** o schema o rejeita antes de gravá-lo na conta.

#### Scenario: Resultado compartilhado
- **WHEN** a API devolve sequência e conquistas à web
- **THEN** ambas usam os mesmos campos e tipos para dias, critérios, progresso e data de obtenção.
