# Implementation review

## Baseline

- Branch: master; HEAD: cff03c8b62f6209465bba019a4d2781f89af38a0.
- Alterações preexistentes: .env.example, README.md, package.json e reorganização de artefatos OpenSpec; inventário completo em baseline-git-status.txt e hunks dos arquivos de configuração/documentação em baseline-preexisting.diff.
- pnpm lint, pnpm typecheck, pnpm test e pnpm build passaram fora do sandbox. Dentro dele, spawn EPERM impediu processos filhos.
- Testes baseline: contracts 37, API 189, web 126 (352 total). API executou sua suíte real sem substituição de configuração.
- Build baseline: aviso existente de bundle >500 kB; JS 798.55 kB, CSS 47.46 kB.
- Shadcn CLI via pnpm dlx falhou com ERR_MODULE_NOT_FOUND para ajv no SDK MCP. A geração oficial via npx shadcn@4.21.1 funcionou; preset new-york, Radix, TSX e CSS variables.

## Implementação e inventário final

A fonte de primitives fica em packages/ui/src/components/ui, conforme os limites do monorepo. Componentes de domínio permanecem organizados por features na web. Não foram criados diretórios futuros vazios. Configuração, geração, normalização NodeNext, exports, tokens e exemplos estão em packages/ui/README.md.

| Rotas / área | Componentes e composição |
| --- | --- |
| / | Button, Card, Badge, Progress decorativo, Sheet; carrossel mantém pausa, seleção e intervalo |
| /acesso | Card, Tabs, Field, Label, Input, Button, Alert; login/cadastro e Google preservados |
| /confirmar-email, /recuperar-senha | Card, Field, Input, Label, Button, Alert, Skeleton |
| /status, rota inexistente | StatusPanel com Card, Alert, Skeleton e Button; fallback mantém link semântico |
| Shell privado, /conta | Button, Card, Field, Input, Checkbox, Avatar, Alert, Skeleton |
| /app | Cards dos resumos, Button, Alert, Skeleton; agregações intactas |
| /app/tarefas | Card, Dialog, AlertDialog, Input, NativeSelect, Checkbox, Textarea, Field, Pagination, Progress |
| /app/materias e roadmaps | Card, Field, NativeSelect, Checkbox, Badge, AlertDialog, Pagination e feedback |
| /app/flashcards e revisão/importação/IA | Card, Field, Input, NativeSelect, Checkbox, Table, Pagination, Alert e Skeleton |
| /app/pomodoro | Card, Button, NativeSelect, AlertDialog; temporizador de domínio preservado |
| /app/rotinas | Card, Field, Checkbox, NativeSelect, AlertDialog; calendário e horários preservados |
| /app/estatisticas | Card, Select Radix, Table, Alert, Skeleton; séries e cálculos de domínio |
| /app/progresso | Card, Progress, NativeSelect, Alert, Skeleton; conquistas e fuso preservados |

Todos os componentes prioritários foram avaliados. Button, Input, Label, Select (Radix e NativeSelect oficial), Checkbox, Textarea, Card, Dialog, AlertDialog, Sheet, Tabs, Alert, Badge, Table, Skeleton, Progress, Pagination e Avatar têm consumidores. Formulários usam Field/FieldSet/FieldLegend oficiais com o estado e a validação existentes; não foi adicionada uma segunda biblioteca de gerenciamento de formulários. Separator é usado internamente pelo Field.

Combobox, Radio Group, Switch, Drawer, Dropdown Menu, Context Menu, Tooltip, Popover, Command, Accordion, Breadcrumb, Scroll Area e Sonner/Toast não têm fluxo existente que justifique sua instalação. Preferências existentes são Checkbox; mensagens persistentes ficam em Alert/status. A rolagem nativa de tabelas e layouts não demanda Scroll Area. Não se adicionou catálogo sem consumidor.

HTML remanescente atende semântica/layout, links textuais, ilustrações, gráficos, calendário e conteúdo de domínio. Busca por button/input/textarea/select/table/progress/dialog HTML em TSX da aplicação não encontrou primitives manuais. Layout, dimensões e espaçamento permanecem em CSS; aparência de controles usa componentes, variants e tokens. CSS substituído e imports antigos foram removidos. animate.css permanece porque SystemPage usa animate__fadeInUp, respeitando movimento reduzido; nenhuma dependência visual anterior ficou sem consumidor. cn adicionado pelo gerador foi removido após normalizar imports para o utilitário local.

Adaptações compartilhadas: Card aceita asChild para preservar section/article/li/form; Progress transmite value/max ao Radix e calcula a transformação relativa ao máximo; imports internos usam .js para NodeNext. Tokens incluem superfícies, bordas, feedback, gráficos e overlay. A nova paleta completa continua pertencendo a update-application-theme.

## Validação

- pnpm lint, pnpm typecheck e pnpm build passaram. Aviso existente de bundle >500 kB permanece; resultado final JS 984.12 kB e CSS 94.08 kB. O custo adicional dos primitives não foi ocultado.
- pnpm test passou: contracts 37, API 189, web 128, total 354 em 71 arquivos. A primeira execução final teve timeout de migrations em imports.http.spec.ts; uma repetição integral, sem alterar configuração, passou. Testes HTTP criam bancos MySQL reais com nomes isolados e removem esses bancos no teardown.
- Testes das features cobrem loading, erro, vazio, sucesso, validação, payloads e operações assíncronas. Novas regressões verificam AlertDialog pendente (Escape e confirmação duplicada bloqueados), erro mantendo diálogo aberto e Progress com máximo diferente de 100.
- Chromium: 15 rotas em 320/390/1280 px; 62 verificações registradas em browser-validation.json. Nenhum overflow de página, pageerror ou endpoint sem fixture. Fixtures de HTTP servem somente à inspeção visual e não substituem os testes reais da API.
- Teclado: Tabs por ArrowRight, Select em portal, Escape e retorno de foco em Sheet/Dialog; Dialog mede 288 px em viewport de 320 px. Carrossel permanece estável após 6,2 segundos com movimento reduzido. Token --primary alterado centralmente mudou a cor computada do Button para rgb(120, 40, 180).
- Estados de erro inspecionados em dez rotas; estados vazios e dados de sucesso inspecionados nas rotas privadas. Screenshots de 320 px de landing, acesso, tarefas, conta e progresso foram salvos no diretório de visualizações da sessão.
- openspec validate refactor-ui-to-shadcn --strict passou; skip_specs mantém zero alterações de comportamento especificado.

## Escopo e revisão

Nenhum arquivo de apps/api ou packages/contracts foi alterado. Chamadas HTTP, contratos, estado global, autenticação, persistência e cálculos permanecem existentes; alterações são composição visual e adaptação dos eventos de primitives. Os testes de payload e comportamento existentes permanecem ativos. As diferenças de semântica Radix foram adaptadas para pending, erro, foco e fechamento controlado.

O commit inclui somente apps/web, packages/ui, pnpm-lock.yaml e openspec/changes/refactor-ui-to-shadcn. Alterações preexistentes da raiz e demais changes/specs OpenSpec ficam fora do staged. Nenhum push, tag ou archive faz parte deste apply.
