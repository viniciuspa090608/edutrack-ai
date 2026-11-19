## MODIFIED Requirements

### Requirement: Sidebar desktop com destinos reais

A partir de 1024 px, o shell SHALL apresentar sidebar com ícone, rótulo, estado ativo, hover e foco. Os destinos visíveis SHALL seguir a ordem Início, Disciplinas, Tarefas, Flashcards, Pomodoro, Rotinas, Relatório, Assistente de IA para contas elegíveis no piloto e Conta, respeitando as preferências de módulos e de visibilidade. A entrada isolada IA SHALL ser removida; Assistente de IA SHALL usar seu ícone de estrelas (Sparkles), com nome acessível e destino real do assistente. A configuração de IA SHALL continuar acessível dentro da Conta. Sair SHALL ocupar região separada inferior. A navegação SHALL permitir scroll interno em pouca altura sem tornar Sair inalcançável.

#### Scenario: Desktop com pouca altura
- **WHEN** todos os módulos estão habilitados em viewport desktop de pouca altura
- **THEN** todos os destinos e Sair permanecem alcançáveis por scroll e teclado, sem overflow horizontal provocado pelo shell.

#### Scenario: Ordem e ícone
- **WHEN** todos os destinos estão disponíveis
- **THEN** a sidebar segue a ordem especificada, não mostra IA isolada e apresenta estrelas em Assistente de IA; módulos ocultos não deixam lacunas.

### Requirement: Barra inferior mobile e menu Mais

Abaixo de 1024 px, o shell SHALL substituir a sidebar por barra inferior com Início, Disciplinas, Tarefas, Flashcards e Mais, removendo e redistribuindo os itens de módulos desativados sem espaços vazios. Mais SHALL agrupar somente Pomodoro, Rotinas, Relatório, Conta, Sair e Assistente de IA para contas elegíveis no piloto. SHALL ter abertura/fechamento acessíveis, Escape, gestão de foco e retorno ao acionador ao fechar sem navegar; ao selecionar destino, o foco SHALL seguir para o conteúdo correspondente; SHALL fechar ou deixar de existir ao passar para desktop, sem overlay ou bloqueio de scroll residual.

#### Scenario: Módulos parcialmente habilitados
- **WHEN** somente Disciplinas está habilitado
- **THEN** a barra apresenta Início, Disciplinas e Mais distribuídos na largura disponível, e os demais destinos existentes continuam em Mais.

#### Scenario: Menu aberto e mudança de largura
- **WHEN** a pessoa abre Mais por teclado e muda a viewport para desktop
- **THEN** o menu mobile deixa de capturar foco e scroll, e a navegação desktop permanece operável.

#### Scenario: Assistente IA na navegação privada

- **WHEN** uma conta elegível com IA habilitada abre o shell
- **THEN** Assistente de IA aparece na sidebar desktop e no menu Mais em mobile, com estado ativo e foco coerentes com a navegação existente.
- **AND** quando a conta deixa de ser elegível ou desativa IA, o link desaparece e o acesso direto fica protegido.
