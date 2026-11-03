## ADDED Requirements

### Requirement: Tarefas importadas com proveniência
Tarefas de atividades Classroom SHALL preservar título, descrição disponível, links seguros de origem e anexos e prazo disponível, sem importar submissões ou notas escolares. A data de calendário local SHALL ser derivada explicitamente do prazo remoto no fuso de estudo da conta; instante e fuso de apresentação SHALL permanecer consultáveis para evitar perda de horário. Atividade sem prazo SHALL continuar sem prazo. Dados além dos limites SHALL produzir aviso ou erro por item sem truncamento silencioso. Novas tarefas SHALL iniciar pendentes e com importância média, preservando status, subtarefas, importância e alterações manuais em atualizações. Importar atividade SHALL NOT contar como conclusão de tarefa ou estudo para analytics e conquistas.

#### Scenario: Prazo com horário e reimportação
- **WHEN** uma atividade com prazo e link é importada e posteriormente reimportada após conclusão manual
- **THEN** prazo original e link permanecem consultáveis e a tarefa concluída não é reaberta nem duplicada.

#### Scenario: Atividade sem prazo
- **WHEN** a origem não informa prazo
- **THEN** a tarefa é criada sem data inventada e mantém sua proveniência.
