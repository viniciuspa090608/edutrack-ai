## MODIFIED Requirements

### Requirement: Ações responsivas de Flashcards
A interface SHALL apresentar cada grupo de botões de Flashcards na mesma linha quando houver espaço horizontal suficiente, permitindo quebra em telas estreitas sem compressão que prejudique textos ou ícones e sem overflow horizontal. A barra de baralhos SHALL omitir o título visual Baralhos e posicionar o filtro Disciplina à esquerda, na mesma linha de Aprimorar com IA e Criar baralho quando houver espaço. Os controles SHALL preservar seus nomes acessíveis, ações e estados.

#### Scenario: Espaço amplo
- **WHEN** Flashcards é exibido em tela grande com espaço suficiente para as ações do grupo
- **THEN** o filtro Disciplina e os botões da barra permanecem na mesma linha e legíveis.

#### Scenario: Espaço estreito
- **WHEN** Flashcards é exibido em tela pequena, inclusive a 320 px
- **THEN** os grupos podem quebrar em múltiplas linhas sem rolagem horizontal nem sobreposição ou perda de conteúdo.


### Requirement: Dimensões consistentes dos campos de linha única
Campos de texto, seleção e data SHALL compartilhar altura e espaçamento interno consistentes em estados equivalentes. Campos multilinha SHALL manter altura apropriada ao conteúdo. Os filtros de Tarefas SHALL ocupar colunas de mesma largura quando na mesma linha e refluir em telas estreitas.

#### Scenario: Filtros de tarefas
- **WHEN** título, status, importância, prazo inicial e prazo final aparecem na mesma linha
- **THEN** os campos têm a mesma altura e largura, com bordas e conteúdo alinhados.
- **AND** em 320 px rótulos e controles continuam acessíveis sem rolagem horizontal da página.

## ADDED Requirements

### Requirement: Ação Voltar no cabeçalho dos detalhes
O botão Voltar SHALL ocupar o canto superior direito do cabeçalho dos cards de detalhes.

#### Scenario: Abrir um card de detalhes
- **WHEN** a pessoa abre um card de detalhes que oferece Voltar
- **THEN** a ação aparece alinhada à direita no cabeçalho, sem sobrepor o título em 320 px
- **AND** a ação continua acessível pelo teclado e leva ao destino previsto pelo fluxo.
