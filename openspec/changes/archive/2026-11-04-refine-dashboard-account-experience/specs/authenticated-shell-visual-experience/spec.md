## MODIFIED Requirements

### Requirement: Sidebar desktop com destinos reais

A partir de 1024 px, o shell SHALL apresentar sidebar com ícone, rótulo, estado ativo, hover e foco para Início, módulos habilitados, Pomodoro, Rotinas, Relatório e Conta. Sair SHALL ocupar região separada inferior. A navegação SHALL permitir scroll interno em pouca altura sem tornar Sair inalcançável.

#### Scenario: Desktop com pouca altura
- **WHEN** todos os módulos estão habilitados em viewport desktop de pouca altura
- **THEN** todos os destinos e Sair permanecem alcançáveis por scroll e teclado, sem overflow horizontal provocado pelo shell.

### Requirement: Barra inferior mobile e menu Mais

Abaixo de 1024 px, o shell SHALL substituir a sidebar por barra inferior com Início, Tarefas, Matérias, Flashcards e Mais, removendo e redistribuindo os itens de módulos desativados sem espaços vazios. Mais SHALL agrupar somente Pomodoro, Rotinas, Relatório, Conta e Sair. SHALL ter abertura/fechamento acessíveis, Escape, gestão de foco e retorno ao acionador ao fechar sem navegar; ao selecionar destino, o foco SHALL seguir para o conteúdo correspondente; SHALL fechar ou deixar de existir ao passar para desktop, sem overlay ou bloqueio de scroll residual.

#### Scenario: Módulos parcialmente habilitados
- **WHEN** somente Matérias está habilitado
- **THEN** a barra apresenta Início, Matérias e Mais distribuídos na largura disponível, e os demais destinos existentes continuam em Mais.

#### Scenario: Menu aberto e mudança de largura
- **WHEN** a pessoa abre Mais por teclado e muda a viewport para desktop
- **THEN** o menu mobile deixa de capturar foco e scroll, e a navegação desktop permanece operável.

## ADDED Requirements

### Requirement: Relatório como entrada única
O shell SHALL mostrar somente Relatório no lugar das entradas separadas Estatísticas e Progresso, na sidebar e em Mais. Ativar Relatório SHALL abrir Estatísticas em /app/estatisticas. As rotas /app/estatisticas e /app/progresso SHALL continuar válidas e ambas SHALL marcar Relatório como ativo; Mais SHALL indicar o destino ativo no mobile. Acesso direto a Progresso SHALL preservar sua aba, parâmetros e histórico.

#### Scenario: Abrir relatório
- **WHEN** a pessoa ativa Relatório no desktop ou em Mais
- **THEN** Estatísticas abre como aba inicial sem uma segunda entrada Progresso no menu principal.

#### Scenario: Abrir progresso diretamente
- **WHEN** a pessoa abre /app/progresso ou usa voltar/avançar
- **THEN** a aba correspondente permanece acessível e Relatório aparece como destino ativo sem redirecionamento forçado para Estatísticas.
