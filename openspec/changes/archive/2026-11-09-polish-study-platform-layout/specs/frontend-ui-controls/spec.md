# Spec Delta

## MODIFIED Requirements

### Requirement: Paginação direcional acessível
As paginações existentes SHALL apresentar apenas os controles Página anterior e Próxima página, com setas, nomes acessíveis e cores da plataforma. A interface SHALL preservar navegação, contagem usada nos limites e condições existentes de indisponibilidade, desabilitando visualmente e funcionalmente anterior quando não houver página anterior e próximo quando não houver próxima página.

#### Scenario: Primeira página
- **WHEN** a paginação está na primeira página
- **THEN** anterior está desabilitado e sua ativação não navega.

#### Scenario: Última página ou lista vazia
- **WHEN** não existe uma próxima página, inclusive em lista vazia ou de página única
- **THEN** próximo está desabilitado e sua ativação não navega.

#### Scenario: Navegação disponível
- **WHEN** a pessoa ativa um controle direcional habilitado por mouse ou teclado
- **THEN** a navegação existente ocorre na direção indicada e o nome acessível informa seu significado.

#### Scenario: Aparência da paginação
- **WHEN** uma paginação está visível
- **THEN** aparecem apenas os dois controles direcionais, sem numeração, contador visível ou reticências.

### Requirement: Painéis expansíveis e aplicação de filtros
Painéis com múltiplos filtros SHALL iniciar recolhidos, abrir por um controle acessível e manter os critérios aplicados ao recolher. Formulários de filtragem SHALL aplicar as mudanças apenas ao acionar Aplicar filtros e oferecer Limpar filtros para restaurar os valores padrão. Consultas por parâmetros SHALL manter envio explícito, com rótulos coerentes com a ação. Seletores isolados, como Matéria na barra de Flashcards, SHALL manter seu comportamento existente.

#### Scenario: Editar filtros sem aplicar
- **WHEN** a pessoa abre Filtros em Tarefas, altera critérios, recolhe e reabre o painel
- **THEN** a lista mantém os critérios aplicados até a pessoa aplicar ou limpar os filtros.

#### Scenario: Filtros recolhidos em Tarefas e Estatísticas
- **WHEN** o painel Filtros está fechado
- **THEN** ele SHALL usar espaçamento vertical reduzido, com seta e título centralizados na altura do cabeçalho.
- **AND** ao abrir, SHALL recuperar o espaçamento atual dos filtros.

## ADDED Requirements

### Requirement: Aparência consistente das barras de rolagem
As barras nativas das áreas roláveis da web SHALL usar como referência a lista de Tarefas da Home, com indicador fino em cinza do tema e trilho discreto quando o navegador permitir. As áreas SHALL preservar suas dimensões e o comportamento de rolagem por teclado, toque e ponteiro, respeitando as preferências do sistema.

#### Scenario: Página ou painel com conteúdo excedente
- **WHEN** a área já permite rolagem e o navegador oferece estilização
- **THEN** a barra segue a aparência de referência e o último conteúdo continua alcançável.
