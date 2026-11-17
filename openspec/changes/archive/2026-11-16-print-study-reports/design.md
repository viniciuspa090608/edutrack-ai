## Context

Progresso mostra o histórico rastreado e Estatísticas mostra o período consultado.

## Goals / Non-Goals

Reutilizar os dados renderizados e permitir impressão e PDF pelo navegador. O fluxo usa as consultas autenticadas existentes.

## Decisions

Adicionar uma ação no cabeçalho compartilhado e aplicar estilos A4 à aba atual. Expor a tabela diária na impressão e reorganizar as séries compridas em linhas pagináveis.

## Risks / Trade-offs

As opções de impressão e o destino PDF dependem do navegador. A paginação preserva cartões compactos e permite a divisão de séries longas e tabelas entre linhas.
