## Purpose

Permitir que estudantes imprimam ou salvem em PDF os dados que consultam nos relatórios de estudo.

## ADDED Requirements

### Requirement: Imprimir a aba de relatório atual

O sistema SHALL oferecer a ação Imprimir relatório ao lado do título em Progresso e Estatísticas, com acesso por teclado e sem rolagem horizontal a partir de 320 px.

#### Scenario: Relatório disponível

- **WHEN** o estudante ativa Imprimir relatório após carregar atividades
- **THEN** o navegador abre a prévia de impressão e permite selecionar a impressora ou salvar em PDF

#### Scenario: Relatório indisponível

- **WHEN** a aba está carregando, apresenta erro ou não tem atividade
- **THEN** a ação fica desabilitada e a página informa o motivo

### Requirement: Formato e dados do relatório impresso

O documento SHALL usar A4, fundo branco e texto escuro, com título, período e data de geração. O documento SHALL ocultar navegação, botões e filtros e manter cartões, linhas e títulos com o conteúdo sempre que possível.

#### Scenario: Imprimir Progresso

- **WHEN** o estudante imprime Progresso
- **THEN** o documento contém os indicadores e barras de evolução das conquistas do histórico rastreado exibido ao estudante

#### Scenario: Imprimir Estatísticas

- **WHEN** o estudante imprime Estatísticas com uma consulta aplicada
- **THEN** o documento contém os resumos, gráficos em escala de cinza e a tabela diária dos módulos habilitados da consulta autenticada
