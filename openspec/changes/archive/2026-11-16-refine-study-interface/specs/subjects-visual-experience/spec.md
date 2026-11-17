## ADDED Requirements

### Requirement: Nomenclatura de disciplinas
A interface SHALL apresentar o módulo como Disciplina ou Disciplinas em todos os contextos em que se refere à entidade do EduTrack.

#### Scenario: Encontrar a nomenclatura nas telas
- **WHEN** a pessoa navega pela plataforma ou seleciona uma disciplina em outro módulo
- **THEN** navegação, títulos, ações, mensagens e rótulos acessíveis usam a nomenclatura de disciplinas.

### Requirement: Filtrar disciplinas pelo nome
A listagem SHALL oferecer um painel recolhível Filtros, inicialmente fechado, com campo de nome e ações Aplicar filtros e Limpar filtros seguindo Tarefas. A busca SHALL corresponder a trechos do nome, ignorar maiúsculas e minúsculas e espaços externos e abranger as disciplinas do usuário antes da paginação. Um campo em branco SHALL equivaler ao filtro padrão.

#### Scenario: Aplicar e limpar busca
- **WHEN** a pessoa digita parte do nome
- **THEN** a lista mantém o critério aplicado até acionar Aplicar filtros ou Limpar filtros
- **AND** aplicar mostra a primeira página dos resultados, recolher preserva o critério e limpar restaura a primeira página sem filtros.

#### Scenario: Busca sem correspondências
- **WHEN** o nome aplicado não encontra disciplinas da pessoa
- **THEN** a interface informa que o filtro não retornou resultados e oferece limpar os critérios.

### Requirement: Hierarquia dos detalhes e roadmaps
O detalhe SHALL exibir os dados e as ações da disciplina e a seção Roadmaps em blocos no mesmo nível visual. Roadmaps SHALL agrupar trilhas e etapas com títulos, espaçamento e divisores que deixem clara a ordem.

#### Scenario: Disciplina com roadmap
- **WHEN** a pessoa abre uma disciplina com uma trilha
- **THEN** distingue os dados e ações da disciplina das ações e etapas da trilha, sem abrir um card para chegar ao outro
- **AND** pode usar as ações existentes de disciplina e roadmap por teclado.
