# Proposal

## Why

A identidade atual mistura azuis, neutros e resíduos verdes, e a definição `.dark` ainda não tem ativação identificada na aplicação. Centralizar a nova paleta e completar o suporte aos dois temas torna todas as páginas visualmente coerentes e legíveis sem alterar seus fluxos.

## What Changes

- Definir a identidade azul e neutra fornecida pelo usuário em tokens semânticos compartilhados, com valores completos para temas claro e escuro.
- Integrar background, foreground, primary, secondary, muted, accent, border, input, ring, card, popover, overlay e gráficos ao sistema de CSS variables do Shadcn/Tailwind existente.
- Preservar success, warning, destructive e info, com pares de texto e superfície adequados a cada tema.
- Aplicar o tema conforme a preferência de cores do sistema, incluindo atualizações durante a sessão, sem adicionar controles ou preferências de conta.
- Migrar gradualmente páginas públicas, autenticação e módulos autenticados; remover cores antigas sem consumidores e revisar ilustrações decorativas da landing.
- Garantir contraste, estados interativos e foco visível; preservar estrutura, comportamento, animações e regras de negócio das páginas.

## Capabilities

### New Capabilities

- `application-theme`: identidade por tokens semânticos, temas claro/escuro conforme o sistema e legibilidade consistente nas páginas existentes.

### Modified Capabilities

Nenhuma. Os requisitos funcionais de `public-landing`, `web-runtime` e demais módulos permanecem inalterados.

## Impact

- `packages/ui/src/styles/globals.css`, variantes de componentes compartilhados e documentação de tokens.
- `apps/web/src/main.tsx`, inicialização visual, `styles/*`, `features/*` e `public/illustrations/*` quando necessário para retirar identidade decorativa antiga.
- Depende da base Shadcn de `refactor-ui-to-shadcn`, atualmente em andamento; coordenar alterações sobre os arquivos efetivamente migrados e preservar diffs preexistentes.
- Sem alterações em API, contratos, banco, rotas ou persistência de conta; sem necessidade prevista de nova biblioteca de temas.
- Apenas planejamento nesta etapa; commit único e verificações de qualidade pertencem ao apply concluído.
