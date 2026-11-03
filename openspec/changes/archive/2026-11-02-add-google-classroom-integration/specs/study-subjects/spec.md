## ADDED Requirements

### Requirement: Associação de turmas a matérias válidas
Com matérias habilitado, cada turma selecionada SHALL poder ser associada explicitamente a uma matéria própria existente ou a uma nova matéria. Para nova matéria, o sistema SHALL sugerir nome com base na turma e solicitar revisão e preenchimento dos campos obrigatórios ausentes, mantendo as validações manuais de nível, objetivo, prazo, horas e assuntos conhecidos; SHALL NOT inventar compromissos ou relaxar o cadastro manual. A matéria SHALL mostrar proveniência e link da turma. Associação já confirmada SHALL ser reutilizada sem nova matéria em reimportações e exigir confirmação para mudança de destino. Falta de dados obrigatórios SHALL ser sinalizada por turma sem bloquear outras turmas válidas nem conclusão do onboarding.

#### Scenario: Turma sem planejamento pessoal
- **WHEN** o usuário escolhe criar matéria a partir de turma sem prazo ou horas semanais
- **THEN** a interface pede os dados ausentes antes de criar a matéria e permite ignorar essa turma.

#### Scenario: Associar matéria existente
- **WHEN** a pessoa escolhe uma matéria própria como destino de uma turma
- **THEN** o vínculo é salvo sem substituir seu planejamento pessoal ou gerar outra matéria.
