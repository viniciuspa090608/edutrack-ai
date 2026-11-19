# Impressão dos relatórios de estudo

## Purpose

Permitir que estudantes imprimam ou salvem em PDF os dados que consultam nos relatórios de estudo.

## Requirements

### Requirement: Imprimir a aba de relatório atual
O sistema SHALL oferecer Imprimir relatório ao lado do título em Progresso e Estatísticas, com teclado e layout desde 320 px. Ambas as ações SHALL preparar o mesmo documento unificado para a mesma conta, consulta e dados, independentemente da aba aberta, com todo o conteúdo de Progresso primeiro e Estatísticas depois. SHALL carregar as duas fontes antes de permitir impressão e abrir a prévia do navegador para imprimir ou salvar em PDF.

#### Scenario: Relatório disponível
- **WHEN** a pessoa imprime por Progresso ou Estatísticas usando a mesma consulta aplicada
- **THEN** recebe conteúdo equivalente e na mesma ordem, com Progresso e conquistas antes das estatísticas, diferenças apenas no instante de geração.

#### Scenario: Relatório indisponível
- **WHEN** uma fonte necessária está carregando ou falhou, ou ambas confirmam ausência de atividade
- **THEN** a impressão unificada permanece desabilitada com motivo acessível e erros permitem nova tentativa sem gerar documento incompleto.

#### Scenario: Atividade em somente uma fonte
- **WHEN** as duas fontes carregaram e somente uma contém atividade
- **THEN** o relatório pode ser impresso com os dados disponíveis e indicação explícita de ausência de atividade na outra seção.

#### Scenario: Consulta comum entre abas
- **WHEN** a pessoa aplica filtros válidos em Estatísticas e alterna para Progresso
- **THEN** ambos os botões usam a última consulta aplicada na sessão autenticada; antes de aplicar critérios usam a consulta padrão existente de Estatísticas, sem aplicar rascunhos.

### Requirement: Formato e dados do relatório impresso
O documento SHALL usar A4 e a composição visual do modelo fornecido como referência de hierarquia, cards, seções numeradas, tabelas, gráficos e rodapé, adaptada às cores do tema claro do EduTrack e ao favicon oficial como logo, mesmo com a interface em tema escuro. SHALL identificar relatório unificado, períodos distintos de histórico e estatísticas, instante de geração, fuso e paginação contínua. SHALL ocultar navegação, ações e filtros e permitir múltiplas páginas sem cortes; não SHALL fixar três páginas nem reproduzir valores de exemplo ou ilustrações como dados reais.

#### Scenario: Imprimir Progresso
- **WHEN** a pessoa gera o documento unificado
- **THEN** a primeira seção mostra sequência atual, maior sequência e dias ativos, resumo de atividade com dias ativos, rastreados e percentual quando calculável
- **AND** apresenta conquistas obtidas em duas colunas com total, descrição, data, progresso e notas de interpretação antes da seção Estatísticas
- **AND** todos os valores correspondem ao histórico autenticado.

#### Scenario: Imprimir Estatísticas
- **WHEN** o documento é preparado com uma consulta aplicada
- **THEN** após Progresso aparecem período, comparação, resumos, gráficos e tabela diária dos módulos habilitados, preservando unidades, lacunas, fim exclusivo, cobertura e período parcial
- **AND** gráficos continuam legíveis em escala de cinza e não calculável permanece distinto de zero.

#### Scenario: Referência e tema
- **WHEN** a pessoa imprime com a interface escura
- **THEN** o PDF usa a paleta clara oficial e o favicon, conserva a hierarquia visual do modelo e mantém Progresso antes de Estatísticas mesmo que o exemplo tenha outra ordem.

#### Scenario: Conteúdo em várias páginas
- **WHEN** conquistas ou séries extensas excedem uma folha
- **THEN** todo o conteúdo permanece legível, com cabeçalhos de tabelas repetidos, títulos junto aos blocos quando possível e paginação contínua sem áreas roláveis que ocultem dados.

### Requirement: Posição estável da ação de impressão
Imprimir relatório SHALL ocupar sua posição definitiva desde a primeira renderização em Progresso e Estatísticas, ao recarregar e alternar abas. Em desktop SHALL permanecer à direita do título como na referência; em telas estreitas SHALL adotar quebra responsiva estável. Carregamento, logo, erro e motivos de bloqueio SHALL NOT deslocar momentaneamente o botão. SHALL preservar os gates, motivos acessíveis e impressão unificada existentes.

#### Scenario: Rede lenta e navegação
- **WHEN** a pessoa recarrega ou alterna abas com fontes e logo ainda carregando
- **THEN** o botão já ocupa o alinhamento final e permanece nele ao concluir ou falhar o carregamento.

#### Scenario: Tela estreita
- **WHEN** a página abre em 320 px
- **THEN** título, botão e motivo de indisponibilidade ficam legíveis e estáveis sem overflow horizontal.
