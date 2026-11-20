# study-subjects Specification

## Purpose

Permitir que cada usuário mantenha suas matérias e organize uma sequência própria de assuntos a estudar, com progresso manual e vínculos opcionais a tarefas e sessões de foco.

## Requirements

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

### Requirement: Editar e excluir matéria
O proprietário SHALL poder alterar os campos da matéria e a lista de assuntos conhecidos; campos não enviados SHALL permanecer iguais. A exclusão SHALL exigir confirmação na interface e remover a matéria e seus itens de plano manual. Uma exclusão cancelada SHALL preservar os dados. Falhas SHALL ser exibidas sem alegar sucesso.

#### Scenario: Atualização parcial
- **WHEN** o proprietário muda objetivo e prazo de uma matéria
- **THEN** esses valores são salvos e nome, nível, horas e assuntos conhecidos permanecem iguais.

#### Scenario: Exclusão confirmada
- **WHEN** o proprietário confirma a exclusão
- **THEN** a matéria e seus itens de plano deixam de estar disponíveis.

### Requirement: Organizar assuntos de estudo manualmente
Cada matéria SHALL oferecer uma lista ordenável de assuntos a estudar, distinta dos assuntos já conhecidos. O usuário SHALL poder adicionar, renomear, reordenar, marcar como `PENDING`, `IN_PROGRESS` ou `COMPLETED` e remover cada item. A ordem e o status SHALL persistir e SHALL funcionar sem recursos de IA.

#### Scenario: Planejamento sem IA
- **GIVEN** recursos de IA desativados
- **WHEN** o proprietário adiciona dois assuntos, altera sua ordem e conclui um deles
- **THEN** a matéria mostra a nova ordem e o progresso individual após recarregar, sem chamada de IA.

#### Scenario: Item inválido ou alheio
- **WHEN** o usuário envia título vazio ou tenta editar item que não pertence à sua matéria
- **THEN** a alteração é rejeitada sem modificar o plano.

### Requirement: Isolamento das matérias e de seus itens
Todas as operações de matérias e itens SHALL exigir sessão válida e usar o identificador do usuário autenticado como proprietário. IDs de matéria ou item de outra pessoa SHALL ser tratados como não encontrados, sem revelar conteúdo ou alterar registros. A API SHALL ignorar `userId` fornecido pelo cliente como fonte de autorização.

#### Scenario: Acesso cruzado
- **GIVEN** matérias e itens de duas contas
- **WHEN** uma conta tenta listar, consultar, editar, reordenar ou excluir dados da outra por ID
- **THEN** vê apenas os próprios dados e requisições por IDs alheios retornam não encontrado.

### Requirement: Associar tarefas a matérias de forma opcional
O usuário SHALL poder associar ou desassociar uma tarefa própria a uma matéria própria na criação ou edição da tarefa, e visualizar essa associação quando o módulo de matérias estiver ativo. Tarefas sem matéria SHALL continuar plenamente utilizáveis. Ao excluir a matéria, a tarefa SHALL permanecer e perder apenas o vínculo. Uma matéria de outra conta ou inexistente SHALL ser rejeitada sem alterar a tarefa.

#### Scenario: Tarefa independente
- **WHEN** o usuário cria ou edita uma tarefa sem matéria e usa seus fluxos manuais
- **THEN** a tarefa funciona normalmente.

#### Scenario: Matéria excluída
- **GIVEN** uma tarefa associada a uma matéria própria
- **WHEN** a matéria é excluída
- **THEN** a tarefa continua disponível sem associação.

### Requirement: Associar sessões Pomodoro a matérias de forma opcional
O usuário SHALL poder escolher uma matéria própria ao iniciar uma sessão Pomodoro, com ou sem tarefa. A associação SHALL ser fixada no início da sessão; tempo ativo e blocos SHALL continuar sendo registrados quando não houver matéria ou a matéria for excluída. Se tarefa e matéria forem informadas e a tarefa já pertencer a outra matéria, a criação SHALL ser rejeitada. Alterar posteriormente a matéria de uma tarefa SHALL NOT reatribuir sessões históricas.

#### Scenario: Sessão livre e sessão com matéria
- **WHEN** o usuário inicia uma sessão sem matéria ou com uma matéria própria
- **THEN** o cronômetro e o registro de tempo funcionam em ambos os casos.

#### Scenario: Associações inconsistentes ou alheias
- **WHEN** o usuário inicia sessão com matéria alheia ou diferente da matéria já vinculada à tarefa selecionada
- **THEN** a sessão não é criada e nenhuma contagem se inicia.

#### Scenario: Exclusão preserva histórico
- **GIVEN** uma sessão associada a matéria
- **WHEN** a matéria é excluída
- **THEN** a sessão e seus totais de tempo e blocos permanecem, sem vínculo com a matéria excluída.

### Requirement: Respeitar preferências de módulos e IA
Quando o módulo de matérias estiver desativado, a EduTrack SHALL ocultar sua navegação e widgets, bloquear páginas e ações de matérias e impedir novas associações a matérias; dados e vínculos já existentes SHALL permanecer armazenados para reativação. Tarefas e Pomodoro SHALL continuar utilizáveis sem selecionar matéria. Desativar IA SHALL remover ações de IA sem bloquear o CRUD de matérias nem seu plano manual.

#### Scenario: Matérias desativadas
- **GIVEN** o módulo de matérias desativado
- **WHEN** o usuário acessa diretamente uma rota de matéria ou tenta criar um vínculo por API
- **THEN** a ação é bloqueada e os dados existentes permanecem preservados.

#### Scenario: Reativação
- **GIVEN** uma matéria e vínculos preexistentes
- **WHEN** o usuário reativa o módulo
- **THEN** volta a acessar a matéria, o plano manual e os vínculos preservados.

### Requirement: Interface acessível
A página de matérias SHALL distinguir carregamento, erro, vazio e sucesso; oferecer controles com rótulos, foco visível e operação por teclado; e ser legível desde 320 px sem rolagem horizontal causada pelo layout. A reordenação do plano SHALL ter alternativa por teclado.

#### Scenario: Reordenar em tela estreita
- **GIVEN** uma viewport de 320 px
- **WHEN** o usuário reordena assuntos por teclado
- **THEN** a nova ordem é salva e os controles permanecem identificáveis e acessíveis.

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

### Requirement: Resumo de progresso por disciplina na listagem
A consulta paginada de disciplinas SHALL fornecer progresso individual oficial para cada disciplina própria retornada, com origem, total de itens, concluídos e percentual nulo quando o total for zero. SHALL usar a mesma seleção de fonte do resumo oficial: roadmap ativo escolhido pelo módulo quando existente, senão plano manual; percentual SHALL corresponder a concluídos dividido pelo total vezes cem. SHALL preservar filtros, ordenação, paginação, preferências e isolamento por usuário, sem contabilizar itens de outras disciplinas ou contas.

#### Scenario: Roadmap e plano manual
- **WHEN** a listagem inclui uma disciplina com roadmap e outra somente com plano manual
- **THEN** cada resumo usa sua própria fonte oficial e seus próprios totais.

#### Scenario: Zero e ausência de base
- **WHEN** uma disciplina tem itens pendentes e outra não tem itens
- **THEN** a primeira informa 0% e a segunda percentual nulo.

#### Scenario: Consulta autenticada e mutação
- **WHEN** a pessoa conclui um item próprio e atualiza sua lista
- **THEN** o progresso correspondente reflete a confirmação e dados de outra conta permanecem inacessíveis.
