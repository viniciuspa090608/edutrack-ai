# Design

## Context

A branch codex/fix-local-google-callback-urls parte de fc5bddc, também apontado por master. As alterações preexistentes em .env.example, AGENTS.md e README.md pertencem ao pedido de fixar as URLs. O .env local já usa porta e origem 3001. Consulte proposal.md para a motivação.

## Goals / Non-Goals

Registrar a convenção e concluir seu versionamento no fluxo local existente. Não mudar o comportamento OAuth, configurar o Google Cloud ou arquivar as mudanças históricas add-study-tasks e refine-auth-desktop-layout.

## Decisions

- Usar skip_specs porque os callbacks continuam derivados da origem configurada; não há requisitos funcionais novos nem snapshots a sincronizar.
- Manifesto com paths explícitos dos três documentos e artefatos próprios, sync vazio. Preservar .env e specs principais.
- Manter o login real em 3001 e permitir Classroom isolado em 3002, conforme a lista autorizada. Não fixar localhost em produção.
- Usar openspec:finish somente após os checks aprovados; integrar por fast-forward e excluir a branch integrada sem push.

## Risks / Trade-offs

- Formatação global preexistente bloqueava o lint → o usuário autorizou pnpm format. Revisar o diff resultante e incluir somente alterações efetivas; a normalização de finais de linha em arquivos com autocrlf pode não produzir diff versionável.
- Documentação não impede overrides de ambiente → registrar explicitamente os valores; não introduzir bloqueios de runtime ou mudar contratos existentes.

## Migration Plan

Sem migrations. A conclusão usa um commit único com archive incorporado pelo fluxo local. Uma falha antes do commit mantém a branch e a mudança ativas.
