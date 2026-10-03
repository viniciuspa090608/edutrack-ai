# Spec Delta

## Purpose

Define contratos de fronteira compartilhados entre web e API, reduzindo divergência de tipos sem antecipar modelos dos módulos futuros.

## ADDED Requirements

### Requirement: Contratos compartilhados mínimos
Web e API SHALL consumir do pacote compartilhado os tipos e schemas de fronteira necessários para health check e erro HTTP, sem definir ali entidades de persistência ou modelos de funcionalidades futuras.

#### Scenario: Consumo nos dois aplicativos
- **GIVEN** os workspaces instalados
- **WHEN** web e API passam pelo typecheck
- **THEN** os dois resolvem o mesmo pacote de contratos para os formatos existentes
- **AND** não mantêm cópias locais divergentes desses formatos.

### Requirement: Validação de contratos externos
Quando um contrato compartilhado contiver dados recebidos fora do processo, a implementação SHALL disponibilizar validação em tempo de execução antes de confiar nesses dados.

#### Scenario: Corpo incompatível
- **GIVEN** um dado externo incompatível com o contrato compartilhado
- **WHEN** ele é validado na fronteira que o consome
- **THEN** a validação rejeita o dado
- **AND** o valor incompatível não é tratado como tipado apenas por uma declaração TypeScript.
