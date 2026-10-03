# Spec Delta

## Purpose

Permitir que cada usuário mantenha suas matérias e organize uma sequência própria de assuntos a estudar, com progresso manual e vínculos opcionais a tarefas e sessões de foco.

## ADDED Requirements

### Requirement: Cadastrar e consultar matérias próprias
A EduTrack SHALL permitir criar e consultar matérias do usuário autenticado com nome, nível atual, objetivo, prazo, horas disponíveis por semana e lista de assuntos já conhecidos. Nome aparado de 1–120 caracteres, objetivo aparado de 1–1000 caracteres, nível `BEGINNER | INTERMEDIATE | ADVANCED`, prazo válido `YYYY-MM-DD` e horas semanais maiores que zero e até 168 SHALL ser obrigatórios; assuntos conhecidos SHALL poder ser uma lista vazia de nomes aparados e não vazios, sem duplicatas na mesma matéria. A lista de matérias SHALL ser paginada e ordenada de forma estável.

#### Scenario: Criar matéria sem assuntos conhecidos
- **WHEN** um usuário autenticado envia os campos obrigatórios válidos e lista de assuntos vazia
- **THEN** a matéria aparece na sua lista e no detalhe com os valores informados.

#### Scenario: Dados inválidos
- **WHEN** o usuário envia nível desconhecido, prazo inválido, horas fora do intervalo, texto acima do limite ou assunto vazio ou duplicado
- **THEN** a criação é rejeitada sem matéria parcial.

#### Scenario: Lista vazia
- **WHEN** um usuário sem matérias abre a página
- **THEN** vê um estado vazio com ação para cadastrar a primeira matéria.

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
