# Impressão dos relatórios de estudo

## Purpose

Permitir que estudantes imprimam ou salvem em PDF os dados que consultam nos relatórios de estudo.

## Requirements

### Requirement: Imprimir a aba de relatório atual

O sistema SHALL oferecer a ação Imprimir relatório ao lado do título em Progresso e Estatísticas, com acesso por teclado e sem rolagem horizontal a partir de 320 px.

#### Scenario: Relatório disponível

- **WHEN** o estudante ativa Imprimir relatório após carregar atividades
- **THEN** o navegador abre a prévia de impressão e permite selecionar a impressora ou salvar em PDF

#### Scenario: Relatório indisponível

- **WHEN** a aba está carregando, apresenta erro ou não tem atividade
- **THEN** a ação fica desabilitada e a página informa o motivo

### Requirement: Formato e dados do relatório impresso

O documento SHALL usar A4 com cabeçalho azul escuro do EduTrack e corpo claro com texto escuro. O cabeçalho SHALL identificar o relatório, a aba, o período analisado e a data e hora de geração. O rodapé SHALL informar o fuso e a paginação. O documento SHALL ocultar navegação, botões e filtros, manter cartões, linhas e títulos junto ao conteúdo sempre que possível e permitir que o conteúdo ocupe várias páginas sem cortes.

#### Scenario: Imprimir Progresso
- **WHEN** o estudante imprime Progresso
- **THEN** o documento mostra sequência atual, maior sequência e dias ativos em três cartões de destaque e resume a atividade com barra, total de dias ativos, dias rastreados no período e percentual quando calculável
- **AND** lista as conquistas obtidas em duas colunas, com total, descrição, data, progresso registrado e notas de interpretação dos indicadores
- **AND** todos os valores correspondem ao histórico rastreado da pessoa.

#### Scenario: Imprimir Estatísticas
- **WHEN** o estudante imprime Estatísticas com uma consulta aplicada
- **THEN** o documento usa o cabeçalho, corpo e rodapé do relatório e contém os resumos, gráficos legíveis em escala de cinza e a tabela diária dos módulos habilitados da consulta autenticada.

#### Scenario: Conteúdo em várias páginas
- **WHEN** os dados não cabem em uma folha
- **THEN** a prévia e o PDF mantêm o conteúdo legível, com numeração coerente e títulos junto aos respectivos blocos sempre que possível.
