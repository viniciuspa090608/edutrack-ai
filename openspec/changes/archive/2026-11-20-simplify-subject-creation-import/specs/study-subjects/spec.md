## MODIFIED Requirements

### Requirement: Cadastrar e consultar matérias próprias
A EduTrack SHALL permitir criar e consultar matérias próprias com nome, nível atual, objetivo, prazo, horas semanais e assuntos conhecidos. Somente nome aparado de 1–120 caracteres, nível `BEGINNER | INTERMEDIATE | ADVANCED` e prazo válido `YYYY-MM-DD` SHALL exigir preenchimento na criação. Objetivo omitido ou em branco SHALL resultar em "Estudar e me aprimorar em ${nomeDisciplina}", usando o nome final aparado; horas omitidas SHALL receber 1 e assuntos omitidos SHALL receber lista vazia. Objetivo personalizado SHALL ter 1–1000 caracteres aparados; horas informadas SHALL ser positivas, até 168, em intervalos de meia hora; assuntos SHALL ser aparados, não vazios, sem duplicatas e respeitar os limites existentes. A lista SHALL permanecer paginada e ordenada de forma estável. Formulários de nova disciplina SHALL sugerir nível intermediário e prazo de seis meses de calendário a partir da data local de criação do rascunho, limitando o dia ao último válido do mês de destino. Sugestões SHALL ser editáveis e SHALL NOT substituir valores personalizados ou dados persistidos.

#### Scenario: Criar matéria sem assuntos conhecidos
- **WHEN** a pessoa envia nome, nível e prazo válidos sem objetivo, horas ou assuntos
- **THEN** a matéria aparece na lista e detalhe com objetivo padrão, 1 hora semanal e assuntos vazios.

#### Scenario: Dados inválidos
- **WHEN** a pessoa envia nível desconhecido, prazo inválido, horas informadas inválidas, texto acima do limite ou assunto vazio ou duplicado
- **THEN** a criação é rejeitada sem matéria parcial.

#### Scenario: Lista vazia
- **WHEN** um usuário sem matérias abre a página
- **THEN** vê um estado vazio com ação para cadastrar a primeira matéria.

#### Scenario: Prazo de seis meses e objetivo dinâmico
- **WHEN** a pessoa abre um rascunho em 31 de agosto de 2026 e informa Matemática como nome
- **THEN** o prazo sugerido é 28 de fevereiro de 2027, o nível é intermediário e o objetivo padrão é "Estudar e me aprimorar em Matemática".

#### Scenario: Personalização e edição preservadas
- **WHEN** a pessoa personaliza objetivo, nível ou prazo e depois altera o nome ou reabre uma disciplina salva
- **THEN** os valores personalizados ou persistidos permanecem, sem reaplicar padrões; somente objetivo ainda automático acompanha o nome do rascunho.

### Requirement: Associação de turmas a matérias válidas
Com matérias habilitado, cada turma selecionada SHALL poder ser associada a uma matéria própria existente ou a uma nova. Turmas sem vínculo ou destino previamente escolhido SHALL iniciar com Criar nova disciplina selecionado e rascunho com nome da turma, nível intermediário, prazo de seis meses e objetivo padrão da criação manual. Campos complementares SHALL ser opcionais conforme o cadastro manual; o usuário SHALL revisar e confirmar antes da importação explícita. A opção Usar disciplina existente SHALL oferecer Select de disciplinas cadastradas pelo usuário, incluindo acesso além da primeira página; carregamento, erro e ausência SHALL ser distintos. A matéria SHALL mostrar proveniência e link da turma. Associação confirmada SHALL ser reutilizada sem nova matéria em reimportações e exigir confirmação para mudança de destino. Falta de dados obrigatórios SHALL ser sinalizada por turma sem bloquear outras turmas válidas nem conclusão do onboarding.

#### Scenario: Turma sem planejamento pessoal
- **WHEN** a pessoa seleciona uma turma nova sem prazo ou horas remotos
- **THEN** vê criar nova disciplina com os padrões preenchidos e pode confirmar sem preencher objetivo, horas ou assuntos.

#### Scenario: Associar matéria existente
- **WHEN** a pessoa escolhe uma disciplina própria pelo Select como destino
- **THEN** o vínculo é salvo sem substituir seu planejamento pessoal ou gerar outra disciplina.

#### Scenario: Reimportação e isolamento
- **WHEN** uma turma já vinculada é reimportada ou um destino de outra conta é enviado
- **THEN** o vínculo próprio é reutilizado sem duplicação e destino alheio é rejeitado sem expor dados.

#### Scenario: Select indisponível
- **WHEN** a consulta de disciplinas carrega, falha ou confirma ausência
- **THEN** a interface distingue cada estado, permite tentar novamente em falha e mantém criar nova disciplina disponível.
