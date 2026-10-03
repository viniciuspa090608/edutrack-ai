# Spec Delta

## MODIFIED Requirements

### Requirement: Contratos compartilhados mínimos
Web e API SHALL consumir do pacote compartilhado os tipos e schemas de fronteira necessários para health check, erro HTTP e funcionalidades de tarefas já implementadas, sem definir ali entidades de persistência ou modelos de funcionalidades futuras.

#### Scenario: Consumo nos dois aplicativos
- **GIVEN** os workspaces instalados
- **WHEN** web e API passam pelo typecheck
- **THEN** os dois resolvem o mesmo pacote de contratos para os formatos existentes
- **AND** não mantêm cópias locais divergentes desses formatos.

#### Scenario: Contratos de tarefas
- **GIVEN** a funcionalidade de tarefas implementada
- **WHEN** web e API validam entradas, filtros e respostas de tarefas
- **THEN** usam os mesmos contratos públicos do pacote compartilhado
- **AND** nenhuma entidade de persistência da API é importada pela web.
