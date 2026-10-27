# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos de rotinas
Web e API SHALL usar os mesmos schemas e tipos públicos para dados, horários e operações de rotinas, com validação de entradas externas em tempo de execução. Esses contratos SHALL NOT expor entidades ou repositories da API ao cliente.

#### Scenario: Entrada de rotina inválida
- **GIVEN** uma solicitação de rotina com dia, hora ou fuso inválido
- **WHEN** a API valida a entrada pelo contrato público
- **THEN** rejeita a solicitação antes de persistir dados.

#### Scenario: Consumo por web e API
- **WHEN** web e API fazem typecheck dos fluxos de rotina
- **THEN** resolvem os mesmos tipos de fronteira compartilhados
- **AND** a web não importa entidades de persistência da API.
