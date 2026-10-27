# Spec Delta

## Purpose

Orientar o primeiro cadastro nas listagens realmente vazias de Matérias e Tasks por meio de uma apresentação acessível e consistente com o EduTrack, preservando estados assíncronos e fluxos existentes.

## ADDED Requirements

### Requirement: Ausência real de registros

O novo estado vazio SHALL aparecer apenas após resposta bem-sucedida da listagem, sem carregamento ou erro vigente, com lista vazia e total de registros igual a zero em uma consulta sem filtros restritivos. SHALL NOT inferir ausência global a partir de uma página vazia ou de resultados filtrados. Loading, erro e seus mecanismos de recuperação SHALL permanecer separados e preservar o comportamento atual.

#### Scenario: Matérias sem registros
- **WHEN** a listagem de Matérias termina com sucesso, sem erro, com zero registros e total zero
- **THEN** a área da listagem apresenta o novo estado vazio de Matérias.

#### Scenario: Tasks sem registros
- **WHEN** a listagem de Tasks sem filtros restritivos termina com sucesso, sem erro, com zero registros e total zero
- **THEN** a área da listagem apresenta o novo estado vazio de Tasks.

#### Scenario: Requisição pendente ou falha
- **WHEN** uma das listagens está carregando ou apresenta erro
- **THEN** o novo estado vazio não aparece e o loading ou erro existente permanece disponível, inclusive retry quando previsto.

#### Scenario: Página vazia com total positivo
- **WHEN** uma página retorna zero itens mas informa total de registros maior que zero
- **THEN** a interface não afirma que não há registros cadastrados nem oferece o novo CTA de primeiro cadastro, preservando a navegação e recuperação existentes.

### Requirement: Conteúdo e CTA de Matérias

O estado vazio de Matérias SHALL apresentar ícone ou ilustração de estudos, título curto, descrição do próximo passo e exatamente um CTA dentro do estado vazio para criar matéria. SHALL usar o fluxo de criação existente, com os mesmos campos, validação, cancelamento e gestão de foco, sem nova rota, modal ou lógica de criação.

#### Scenario: Orientação de primeiro cadastro
- **WHEN** Matérias apresenta ausência real de registros
- **THEN** exibe “Nenhuma matéria ainda”, “Adicione sua primeira matéria para começar a organizar seus estudos.” e “Adicionar matéria”.

#### Scenario: Criar matéria pelo estado vazio
- **WHEN** a pessoa ativa “Adicionar matéria” com mouse ou teclado
- **THEN** abre o mesmo cadastro acessível acionado por “Criar matéria”, preservando seu comportamento existente.

### Requirement: Conteúdo e CTA de Tasks

O estado vazio de Tasks SHALL apresentar ícone ou ilustração de tarefas, título curto, descrição do próximo passo e exatamente um CTA dentro do estado vazio para criar tarefa. SHALL usar o fluxo de criação existente, com os mesmos campos, validação, cancelamento e gestão de foco, sem nova implementação de criação.

#### Scenario: Orientação de primeira tarefa
- **WHEN** Tasks apresenta ausência real de registros
- **THEN** exibe “Nenhuma tarefa ainda”, “Crie sua primeira tarefa para começar a organizar o que precisa estudar.” e “Adicionar tarefa”.

#### Scenario: Criar tarefa pelo estado vazio
- **WHEN** a pessoa ativa “Adicionar tarefa” com mouse ou teclado
- **THEN** abre o mesmo editor acessível acionado por “Criar tarefa”, preservando seu comportamento existente.

### Requirement: Preservação de resultados e funcionalidades

A atualização SHALL preservar layout e comportamento quando houver registros, incluindo cards, listas, filtros, ordenação, paginação, detalhes e formulários. Busca ou filtros sem resultados SHALL manter o tratamento específico existente e SHALL NOT exibir o novo estado de primeiro cadastro. SHALL NOT introduzir filtros novos, regras, APIs, stores ou mudanças de backend.

#### Scenario: Listagem preenchida
- **WHEN** Matérias ou Tasks recebe registros
- **THEN** os cards ou lista e os controles existentes permanecem com a mesma apresentação e comportamento e o novo estado vazio está ausente.

#### Scenario: Filtro de Tasks sem correspondência
- **WHEN** uma consulta com filtro restritivo de Tasks retorna zero itens
- **THEN** a mensagem atual de nenhum resultado e o mecanismo existente de limpar filtros são preservados, sem o novo CTA de primeiro cadastro.

#### Scenario: Voltar à consulta sem filtros
- **WHEN** a pessoa limpa os filtros e a nova consulta termina
- **THEN** a resposta real determina se serão exibidos registros ou o novo estado vazio, sem antecipar ausência durante loading.

### Requirement: Identidade visual acessível e responsiva

Os dois estados vazios SHALL usar a intenção visual do Stitch: superfície com borda e cantos arredondados, conteúdo centralizado, ícone destacado, título, descrição e CTA com hierarquia clara. SHALL manter tipografia e tokens do EduTrack, contraste legível nos temas claro e escuro, foco visível, operação por teclado e respeito a movimento reduzido. SHALL funcionar desde 320 px até desktop com texto quebrável, ícone proporcional e CTA acessível, sem overflow horizontal causado pelo componente.

#### Scenario: Temas claro e escuro
- **WHEN** a pessoa visualiza qualquer um dos estados vazios em cada tema suportado
- **THEN** superfície, borda, ícone, título, descrição, botão e foco permanecem legíveis e coerentes com a identidade atual.

#### Scenario: Mobile, tablet e desktop
- **WHEN** a pessoa visualiza os estados vazios em larguras de 320 px, 768 px e 1280 px
- **THEN** conteúdo centralizado, texto e CTA permanecem visíveis sem rolagem horizontal causada pelo estado vazio.

#### Scenario: Teclado e movimento reduzido
- **WHEN** a pessoa navega por teclado com preferência por movimento reduzido
- **THEN** o CTA possui nome e foco visíveis e pode abrir o cadastro existente sem depender de animação; ícones decorativos não geram anúncios redundantes.

### Requirement: Referência visual subordinada ao projeto

O Stitch SHALL servir exclusivamente como referência visual, respeitando a prioridade estado real dos dados, funcionalidades existentes, padrões do projeto e design do Stitch. Os estados vazios SHALL NOT apresentar integrações inexistentes, importação, sincronização, semestres fictícios, métricas inventadas, promessas de IA, botões extras ou componentes quebrados do protótipo.

#### Scenario: Referência contém funcionalidades adicionais
- **WHEN** o protótipo mostra SIGA/Moodle, importação, indicadores acadêmicos, recomendações ou atalhos extras
- **THEN** o estado vazio implementado usa apenas a composição visual pertinente, o conteúdo definido e a criação já disponível.
