# Proposal

## Why

A interface atual reproduz botões, campos, cards e diálogos em HTML e CSS por funcionalidade, com pouca reutilização visual. Migrar as telas existentes para Shadcn UI reduz duplicação e prepara a aplicação para receber o tema centralizado de `update-application-theme`.

## What Changes

- Configurar Shadcn UI e Tailwind no monorepo existente, usando `packages/ui` como fonte única dos componentes visuais compartilhados.
- Migrar todas as páginas públicas e autenticadas, seus estados e componentes de domínio para composições Shadcn sempre que houver equivalente adequado.
- Priorizar controles, formulários, cards, overlays, navegação, feedback, tabelas e progresso; adicionar componentes quando houver uso concreto, sem instalar um catálogo ocioso.
- Centralizar aparência em CSS variables, tokens e variants; manter estilos específicos de layout e conteúdo, preparando a futura paleta sem defini-la nesta mudança.
- Remover implementações visuais, imports, estilos e dependências substituídos após verificar todas as utilizações.
- Preservar regras de negócio, chamadas da API, autenticação, estados globais, persistência, cálculos, rotas, responsividade e acessibilidade.

## Capabilities

### New Capabilities

Nenhuma funcionalidade nova. Esta mudança altera a implementação visual, não os comportamentos especificados.

### Modified Capabilities

Nenhuma alteração de requisitos funcionais. `skip_specs: true` explicita a ausência de deltas; os critérios técnicos e de regressão ficam no design e nas tarefas.

## Impact

- `apps/web/src/app`, `features/*` e `styles/*`; configuração Vite, TypeScript e Vitest; manifests, lockfile e documentação de contribuição.
- `packages/ui`: componentes Shadcn, utilitário de classes, tokens, exports e dependências de UI. O pacote continua independente de `apps/*`.
- Adição de Tailwind e dependências efetivamente exigidas pelos componentes Shadcn escolhidos, com React 19 e TypeScript estrito.
- Sem alterações previstas em `apps/api`, `packages/contracts`, banco ou contratos HTTP.
- O Git já contém alterações preexistentes; preservá-las. O commit único pertence ao apply concluído, não a esta proposta.
