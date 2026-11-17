# Design

## Context

A listagem de Tarefas já aplica critérios explícitos via API e Disciplinas carrega páginas pelo cliente de matérias. O perfil exibe a explicação de IA em `ProfilePage`, a Home monta a ação em `DashboardPage` e a impressão já usa `window.print()` e estilos dedicados.

## Goals / Non-Goals

**Goals:** Usar a mesma interação de filtros nas duas listas e uma apresentação A4 compartilhada pelas abas de relatório.

**Non-Goals:** Renomear identificadores internos, migrar tabelas ou alterar o cálculo dos indicadores.

## Decisions

- Acrescentar parâmetros opcionais de título e nome aos contratos de consulta. Filtrar no servidor após restringir ao usuário, antes de contar ou paginar. A busca usa trecho do texto, ignora maiúsculas e minúsculas e remove espaços externos. Tratar caracteres especiais como texto literal e manter consultas parametrizadas.
- Usar o painel de Tarefas como referência para Disciplinas, com rascunho e critérios aplicados. Aplicar ou limpar volta à primeira página. Auditar textos visíveis e nomes acessíveis, incluindo navegação, campos, mensagens, seletores e telas integradas.
- Organizar detalhes e Roadmaps em seções irmãs, com espaço, títulos e divisores para as etapas. Alinhar Voltar à direita no cabeçalho dos cards de detalhes e preservar a ordem de foco. Centralizar a ação de Pomodoro no espaço livre abaixo do texto do card, com altura que acompanhe o conteúdo.
- Montar a composição de impressão a partir dos dados já carregados da aba. Usar cabeçalho azul escuro, corpo claro, indicadores em cartões, barra com percentual em texto e conquistas em duas colunas. Reusar a linguagem visual em Estatísticas com seus próprios gráficos e tabela. A referência usa Progresso como exemplo. A paginação deve refletir as páginas geradas, com verificação na prévia e no PDF.

## Risks / Trade-offs

- O denominador da atividade precisa respeitar o início do histórico e o fuso do relatório. Sem dias rastreados, apresentar o percentual como indisponível.
- Fundos e rodapés dependem do navegador. Garantir contraste também em escala de cinza e conferir numeração e quebras no navegador de referência.
- Nomes extensos e rótulos traduzidos podem aumentar a altura. Permitir quebras de linha e conferir os layouts a partir de 320 px.
