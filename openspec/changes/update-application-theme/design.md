# Design

## Context

Ver `proposal.md` para motivação. A web importa `@study-platform/ui/globals.css` em `main.tsx`; Shadcn usa CSS variables, Tailwind e variante `.dark`. `globals.css` já define tokens, mas conserva azuis anteriores, verde em input/overlay e chart, e não define info nem todos os pares foreground de status. Botões e badges destrutivos usam `text-white`. CSS de páginas já consome variáveis, porém atribui primary a textos secundários e mistura foreground/background em destaques. As ilustrações SVG externas da landing ainda usam verdes decorativos.

Não foi identificado controlador de tema em `main.tsx`, `app` ou perfil. A mudança `refactor-ui-to-shadcn` está em andamento (29/37 tarefas no levantamento) e preparou estes mesmos arquivos para esta proposta. O working tree possui muitas alterações preexistentes; elas não pertencem automaticamente ao futuro commit desta mudança.

## Goals / Non-Goals

**Goals:** fonte única para cores; contratos completos entre superfícies e textos; ativação global dos temas; migração incremental até cobrir todas as páginas existentes.

**Non-Goals:** redesenhar layouts, alterar animações, trocar primitives Shadcn, adicionar seletor de tema, persistir preferência, alterar APIs, domínio ou autenticação. Não criar módulos vazios nem tokens sem uso previsto.

## Decisions

### 1. Manter CSS variables no pacote compartilhado

Centralizar os valores em `packages/ui/src/styles/globals.css`, com `:root` claro, `.dark` escuro e mapeamento completo no `@theme inline`. Consumidores usam utilitários semânticos (`bg-background`, `text-foreground`, `border-border`) ou `var(--token)` no CSS. Valores hex ficam restritos às definições centrais e assets decorativos isolados quando tecnicamente necessário. Não espalhar classes de cores arbitrárias, nomes de escala como `bg-blue-*` nem overrides locais dos tokens.

Alternativa: substituir cores em cada página perpetuaria duplicação; adicionar biblioteca de temas não agrega benefício necessário. Manter a base Shadcn existente evita nova migração estrutural.

### 2. Paleta e mapeamento inicial

Azul: `#03045e`, `#023e8a`, `#0077b6`, `#0096c7`, `#00b4d8`, `#48cae4`, `#90e0ef`, `#ade8f4`, `#caf0f8`.

Neutros: `#f8f9fa`, `#e9ecef`, `#dee2e6`, `#ced4da`, `#adb5bd`, `#6c757d`, `#495057`, `#343a40`, `#212529`.

Tabela de partida para implementação; confirmar os contrastes renderizados antes de fixar os valores finais. Ajustes devem manter as escalas fornecidas para identidade e superfícies.

| Token | Claro | Escuro |
| --- | --- | --- |
| background / foreground | #f8f9fa / #212529 | #212529 / #f8f9fa |
| card / card-foreground | #e9ecef / #212529 | #343a40 / #f8f9fa |
| popover / popover-foreground | #f8f9fa / #212529 | #343a40 / #f8f9fa |
| primary / primary-foreground | #023e8a / #f8f9fa | #48cae4 / #212529 |
| secondary / secondary-foreground | #e9ecef / #495057 | #495057 / #f8f9fa |
| muted / muted-foreground | #e9ecef / #495057 | #343a40 / #adb5bd |
| accent / accent-foreground | #caf0f8 / #03045e | #023e8a / #caf0f8 |
| border | #ced4da | #6c757d |
| input | #6c757d | #adb5bd |
| ring | #0077b6 | #90e0ef |
| overlay | #212529 | #212529 |

Border é separador decorativo; input e ring devem atender controles ativos. Não usar primary-foreground/background indistintamente: cada superfície usa seu par. Hover com opacidade, foco, gradientes e color-mix precisam de validação sobre o fundo real. Usar azul escuro em navegação e ações claras; azul claro em highlights e superfícies suaves claras, e destaques legíveis escuros. Não é obrigatório utilizar todos os tons em componentes; não criar usos decorativos artificiais.

### 3. Status e gráficos com significado preservado

Manter famílias success, warning e destructive fora da paleta de identidade quando necessário; adicionar info azul e os pares `*-foreground` e superfícies de status somente onde consumidos. Ajustar variantes destrutivas para consumir destructive-foreground em vez de branco fixo. Cores de status precisam de valores próprios por tema e não podem herdar indiscriminadamente valores claros. Reavaliar chart-1/2/3 e seus mappings, separando séries informativas de cores de feedback. Gráficos continuam com rótulos/legendas; mensagens continuam com texto ou ícone acessível.

Alternativa: transformar todo verde/vermelho em azul apagaria significado; preservar valores de status sem revisar contraste também não satisfaz o tema escuro.

### 4. Ativação sem mudar telas

Assumir preferência do sistema como política inicial, pois o pedido não inclui seletor nem persistência. Aplicar `.dark` no elemento html conforme `prefers-color-scheme`, antes da renderização inicial, e acompanhar eventos de mudança sem remontar App. Definir `color-scheme` coerente para controles nativos. Usar fallback claro quando consulta à preferência não existir. Overlays via portal herdam o tema do documento. Nenhuma requisição ou escrita de preferência no backend.

Alternativa: tema escuro apenas por classe manual não entrega suporte ao uso normal; acrescentar um seletor alteraria a estrutura das telas fora do escopo.

### 5. Migração em grupos, com conclusão integral

Primeiro tokens/primitives; depois landing, acesso e autenticação; em seguida dashboard e perfil; depois tarefas, matérias/roadmaps, rotinas e Pomodoro; finalmente flashcards, analytics, progresso e status. Revisar CSS e TSX para usos semânticos incorretos, não apenas literais. Gradual descreve a ordem das tarefas, não autoriza deixar páginas antigas ao concluir.

SVGs carregados por img não herdam variáveis do documento. Preservar a estrutura e a forma de inclusão dos assets; recolorir a arte decorativa com a paleta central documentada, usando preferência de cores interna ao SVG se necessária para legibilidade. Literais nesses assets são exceção documentada; componentes e CSS continuam sem cores diretas equivalentes a tokens. Preservar cores da arte que comuniquem estado real.

## Risks / Trade-offs

- [Sobreposição com refactor-ui-to-shadcn] → iniciar apply sobre a base migrada estável; registrar Git e atribuir apenas hunks desta mudança ao commit.
- [Azul claro ou opacidade reduzirem contraste] → medir pares reais, incluindo estados e superfícies compostas; usar foreground escuro sobre destaques claros.
- [Overrides locais e status herdarem tema errado] → auditar CSS, primitives, overlays, controles nativos e gráficos em ambos os temas.
- [Recoloração afetar identidade de estados] → distinguir verde decorativo de success antes de remover cores.
- [Testes DOM não comprovarem aparência] → combinar testes de ativação/estado com inspeção visual e medições de contraste no navegador.

## Migration Plan

Executar os grupos acima sem mudar estrutura ou lógica. Documentar pares e exceções; remover cores e variáveis antigas somente depois de verificar consumidores. Validar todas as rotas aplicáveis, teclado, 320 px, estados existentes e movimento reduzido em ambos os temas. Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; falhas de banco exigem MySQL real isolado e não devem ser mascaradas.

O apply concluído gera um único commit com implementação e tasks.md final após revisão staged e `git diff --cached --check`; sem commit vazio, tag, push ou archive automático. Reversão usa o diff desse commit, preservando mudanças externas.
