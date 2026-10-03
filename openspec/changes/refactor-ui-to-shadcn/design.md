# Design

## Context

Ver `proposal.md` para a motivação. A web usa React 19, Vite, TypeScript estrito e organização por funcionalidades. `App.tsx` resolve rotas pelo pathname; `PrivatePage` verifica sessão e preferências e compõe as páginas privadas. Não há Tailwind, aliases de UI ou `components.json`. Os estilos são CSS global e arquivos por funcionalidade. `animate.css` e `lucide-react` estão na web; não foi identificada biblioteca de primitives a substituir.

`packages/ui` exporta apenas `StatusPanel`, com HTML próprio e aparência definida em `main.css`. Seu build é TypeScript NodeNext para `dist`, com declarações; os imports internos precisam respeitar extensões `.js`. A web usa resolução Bundler. Não copiar configurações de Next/RSC nem trocar o build do monorepo por um template.

As specs principais `public-landing` ainda descrevem acesso provisório, enquanto `AccessPage` implementa autenticação. Mudanças concluídas ainda presentes em `openspec/changes` documentam outras funcionalidades existentes. Esta refatoração preserva o código funcional atual e os testes; não resolve a sincronização dessas specs nem restaura comportamento antigo.

### Inventário observado e destinos

| Área / arquivos | Elementos atuais e migração |
| --- | --- |
| `PublicLanding`, `FeatureCarousel` | CTAs → Button com semântica de link; cards → Card; menu mobile → Sheet; controles do carrossel → Button, preservando sua lógica de domínio |
| `AccessPage`, `EmailVerificationPage`, `PasswordRecoveryPage` | Card, Tabs de acesso, Input, Label, Button, Alert e composição de formulário |
| `PrivatePage`, fallback de `App` | Button, Alert, Skeleton e navegação acessível; preservar rotas, sessão e preferências |
| `SystemPage`, `ApiStatus`, `StatusPanel` | Card/Alert/Button/Skeleton; manter roles, mensagens e retry |
| `ProfilePage` | Formulários, campos, avatar e preferências → Input, Label, Avatar, Checkbox/Switch conforme semântica, Button e Alert |
| `TasksPage`, `SubtasksSection`, `TaskConfirmation`, `TaskProgress` | Card, Input, Textarea, Select, Checkbox, Dialog de edição, Alert Dialog destrutivo, Progress e Pagination |
| `SubjectsPage`, `SubjectSelect`, `SubjectName` | Card, campos, Select, Badge e paginação; seleção assíncrona mantém opção sem matéria e seleção fora da página atual |
| `RoadmapsSection`, `RoadmapEditor`, `RoadmapRevisionTools` | Card, Textarea, Select, Checkbox, Alert e confirmações; preservar versões, edição, preview e aprovação da IA |
| `FlashcardsPage`, `FlashcardForms`, `CardViewer` | Card, campos, Select, Button e feedback; manter frente/verso e controles de estudo |
| `ImportFlow`, `FlashcardAIFlow`, `ReviewQueue`, `ReviewHistory` | Table para preview de importação, campos, cards, confirmações e paginação; preservar upload, preview, confirmação, revisão e histórico |
| `PomodoroPage`, `RoutinesPage` | Card, campos, Select, Button, Badge e Alert; temporizador e calendário continuam componentes de domínio |
| `AnalyticsPage`, `StudyProgressPage`, `StudyTimeZoneSection`, `DashboardPage` | Filtros, cards, Progress, Badge e feedback; gráficos, calendários, cálculos e dados agregados permanecem de domínio |

## Goals / Non-Goals

**Goals:** Uma fonte compartilhada de primitives Shadcn, migração completa das telas existentes com equivalentes adequados, tokens centralizados e regressões verificáveis por área.

**Non-Goals:** Nova paleta, redesenho de fluxos, novas funcionalidades, troca de roteador, novos estados globais, mudanças de backend ou instalação antecipada de componentes sem uso. Não mover indiscriminadamente os componentes de domínio para uma pasta global.

## Decisions

### 1. Shadcn no pacote compartilhado

Usar `packages/ui/src/components/ui/*.tsx` e `packages/ui/src/lib/utils.ts` para primitives e `cn`. Os consumidores importam subpaths públicos `@study-platform/ui/components/ui/button`; adicionar exports para JS/declarations em `dist`, preservando o entrypoint existente durante a migração. CSS compartilhado terá export próprio apontando ao arquivo de origem, sem presumir que `tsc` copie CSS. Imports internos gerados devem funcionar com NodeNext e Vite/Vitest; aliases precisam ser resolvidos nas três ferramentas, ou reescritos para imports relativos `.js` no pacote compilado.

Configurar `components.json` nos workspaces web/UI, com `tsx: true`, `rsc: false`, CSS variables habilitadas, aliases coerentes e mesmo preset, base e biblioteca de ícones. Escolher a variante Radix do registry Shadcn, respeitando a composição solicitada, e registrar versão do CLI/preset no apply. Não aceitar uma variante Base UI por mudança implícita do default. Dependências dos primitives pertencem ao pacote UI; ferramentas de CSS/Vite à web. Manter React compartilhado como peer dependency, incluindo ReactDOM quando exigido.

Alternativa rejeitada: cópia adicional em `apps/web/src/components/ui`, que duplicaria primitives e enfraqueceria o pacote compartilhado. Componentes de domínio permanecem em `features/*`; somente composições efetivamente usadas por várias features justificam `apps/web/src/components/application`.

### 2. Tailwind e tokens com uma fonte de tema

Integrar Tailwind v4 ao Vite e manter processamento equivalente no Vitest. A folha compartilhada `packages/ui/src/styles/globals.css` define tokens semânticos de fundo, texto, superfície, primary, secondary, muted, accent, destructive, border, input, ring e radius, além de tokens de sucesso/aviso e gráficos quando usados. A entrada web importa essa folha uma única vez. Configurar detecção de classes de web e UI explicitamente, inclusive classes em arquivos compartilhados fora da web.

Preservar a identidade vigente por valores iniciais centralizados; `update-application-theme` poderá alterá-los sem editar cada página. Conteúdo em portals deve herdar os mesmos tokens. Remover seletores globais que sobrescrevem primitives e trocar cores hardcoded de UI por tokens; cores de ilustrações estáticas não exigem redesenho. Tailwind permanece para layout, dimensões e responsividade. Alternativa rejeitada: CSS de botões/cards antigos como override permanente do Shadcn.

### 3. Migração por equivalência semântica

Button, Input, Label, Select, Checkbox, Textarea, Card, Dialog, Alert Dialog, Tabs, Alert, Badge, Table, Progress, Pagination, Avatar e Skeleton têm destinos concretos no inventário. Sheet atende o menu mobile; separar Dialog de edição e Alert Dialog destrutivo. Links continuam links, inclusive quando recebem aparência de Button.

Combobox, Radio Group, Switch, Drawer, Dropdown Menu, Context Menu, Tooltip, Popover, Command, Form, Accordion, Separator, Breadcrumb, Scroll Area e Sonner/Toast devem ser avaliados por ocorrência real. Não introduzir menus contextuais, drawers, busca, breadcrumbs ou notificações transitórias apenas para consumir o catálogo. Registrar na auditoria final quais itens foram migrados e quais não tinham uso adequado. Combobox pode ser composição oficial de primitives; não adicionar busca que altere a seleção paginada. Escolher Form/Field conforme suporte da versão Shadcn selecionada; manter validação e estado existentes, sem exigir troca geral para React Hook Form. Sonner é o destino de notificações transitórias existentes; mensagens bloqueantes e erros de formulário continuam persistentes com Alert. Wrappers só para comportamento compartilhado concreto, como `SubjectSelect` e confirmação assíncrona.

### 4. Preservação de comportamento

Adaptar handlers de componentes controlados (`onValueChange`, `onCheckedChange`) aos estados atuais; checkbox indeterminado não vira booleano incorreto. Select sem matéria usa valor sentinela interno mapeado para string vazia no domínio, pois item vazio pode ser incompatível com o primitive. Conservar seleção ausente da página, loading, retry e paginação de `SubjectSelect`.

Manter `type=submit/button`, limites, nomes acessíveis, associação Label/campo, `aria-describedby`, erros, desabilitação e proteção contra envios duplicados. Confirmações permanecem abertas em falha e durante operação pendente; preservar política de Escape, cancelamento e fechamento por clique externo, foco inicial seguro e retorno ao acionador ou fallback quando removido. Alert Dialog não pode fechar automaticamente antes do sucesso assíncrono.

Carrossel mantém intervalo de 6 segundos, pausa por hover/foco/página oculta e movimento reduzido. Não substituir sua lógica só para instalar Carousel. Temporizador, arredondamentos de progresso, condições de preferências e callbacks de API permanecem intactos. HTML semântico de estrutura, gráficos, ilustrações e conteúdos de domínio é permitido; primitives visuais manuais com equivalente adequado precisam ser eliminados ou ter exceção documentada.

## Risks / Trade-offs

- [Preflight e CSS global alteram layouts] → Migrar por área, remover conflitos gradualmente e verificar 320 px, mobile e desktop.
- [Portals e eventos Radix diferem do HTML nativo] → Cobrir foco, teclado, seleção vazia, erro assíncrono e prevenção de dupla submissão com testes de interação.
- [CLI gera aliases ou imports incompatíveis com NodeNext] → Verificar build real de UI e web, consumo de declarations e imports resolvidos antes de migrar páginas.
- [Novas dependências aumentam bundle] → Adicionar apenas componentes utilizados e não criar catálogo vazio.
- [Remoção de CSS ou animate.css quebra outra feature] → Buscar todos os consumidores antes da remoção; conservar animações ainda utilizadas e preferência por movimento reduzido.
- [Specs antigas divergem do código] → Registrar divergência, preservar fluxos implementados e não alterar requisitos de produto nesta mudança.

## Migration Plan

1. Registrar Git e estabelecer baseline dos checks, separando falhas preexistentes. Configurar UI, build e tokens antes das páginas.
2. Migrar componentes compartilhados e páginas públicas; depois shell/conta, tarefas, matérias/roadmaps, flashcards, Pomodoro/rotinas, analytics/progresso/dashboard.
3. Validar cada área antes de retirar estilos antigos; ao final auditar todas as rotas e a lista prioritária, removendo duplicações.
4. Executar lint, typecheck, test e build do monorepo, usando MySQL real isolado para testes de banco. Só concluir após sucesso e evidência da validação de teclado, estados e layouts.
5. Finalizar tasks e criar o commit único do apply, revisando somente arquivos/hunks desta mudança. Sem push, tag ou archive.

Não há migração de dados. Rollback usa a reversão do commit de implementação e restauração do lockfile/configuração, preservando alterações externas à mudança.

Referências oficiais consultadas: [Shadcn em monorepos](https://ui.shadcn.com/docs/monorepo), [instalação Vite](https://ui.shadcn.com/docs/installation/vite) e [catálogo de componentes](https://ui.shadcn.com/docs/components). Adaptar as instruções ao build compilado existente; não executar o scaffold de um novo monorepo.
