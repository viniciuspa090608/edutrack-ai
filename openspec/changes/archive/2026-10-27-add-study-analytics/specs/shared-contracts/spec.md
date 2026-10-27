# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos de estatísticas de estudo
Web e API SHALL compartilhar schemas para granularidade `day | week | quarter | semester | year`, data de referência e fuso IANA, além de tipos para intervalos, série diária, métricas disponíveis, frequência, comparação anterior e estado de histórico indisponível. Entradas externas SHALL ser validadas em execução e entidades de persistência SHALL permanecer fora do contrato.

#### Scenario: Consulta inválida
- **WHEN** o cliente envia granularidade desconhecida, data impossível ou fuso inválido
- **THEN** a validação rejeita a consulta antes da agregação.

#### Scenario: Métrica omitida por preferência
- **WHEN** uma métrica de módulo desativado não compõe a resposta
- **THEN** a web interpreta a ausência como indisponibilidade do módulo, sem converter o valor em zero.
