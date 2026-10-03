# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos de matérias e vínculos opcionais
Web e API SHALL compartilhar schemas de validação e tipos públicos para criação, atualização, listagem e detalhe de matérias, assuntos conhecidos, itens ordenados de estudo e associações opcionais de tarefas e sessões Pomodoro a matérias. Os contratos SHALL representar ausência de associação explicitamente, validar entradas externas em tempo de execução e não expor entidades de persistência.

#### Scenario: Associação ausente
- **WHEN** web e API processam uma tarefa ou sessão sem matéria
- **THEN** ambas interpretam a ausência do vínculo da mesma forma e aceitam o fluxo independente.

#### Scenario: Entrada incompatível
- **WHEN** uma entrada externa contém nível inválido, data impossível, item de plano inválido ou identificador de matéria malformado
- **THEN** a validação compartilhada rejeita a entrada antes da regra de negócio.
