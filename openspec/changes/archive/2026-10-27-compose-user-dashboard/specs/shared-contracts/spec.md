# Spec Delta

## ADDED Requirements

### Requirement: Contrato público de composição do dashboard
Web e API SHALL compartilhar schemas de resposta para resumos de tarefas, matéria/roadmap destacado, Pomodoro, sequência, flashcards e semana, com estados explícitos de conteúdo, vazio e erro por seção. Seções de módulos desativados SHALL ser omitidas, não representadas como zero. O contrato SHALL validar dados externos em execução e não expor entidades internas dos módulos.

#### Scenario: Módulo desligado
- **WHEN** flashcards estão desativados
- **THEN** a resposta validada omite a seção de flashcards, sem contagem fictícia.

#### Scenario: Falha parcial
- **WHEN** a consulta semanal falha e a de tarefas funciona
- **THEN** a resposta representa erro semanal e dados de tarefas separadamente.
