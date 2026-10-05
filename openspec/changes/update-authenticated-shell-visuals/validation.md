# Validação do apply

## Implementação e baseline

HEAD inicial: `69eb7aedbbfb2268eaf28622fd2353e0f13f0684`. Status e diff anteriores às edições estão em `baseline-git.json`. Alterações preexistentes em `AccessPage.tsx`, `auth.css`, assets públicos e `refine-auth-desktop-layout` foram preservadas; o diff dos dois arquivos públicos foi comparado com o registro e continua idêntico. O stage de conclusão inclui somente arquivos desta mudança e os dois ajustes de testes autorizados na retomada.

A implementação usa `AuthenticatedShell.tsx`, `ShellAvatar.tsx` e CSS próprio, com integração externa de `PrivatePage` e callback opcional após confirmação da foto em `ProfilePage`. Mantidos os handlers de sessão, preferências, vínculo Google, logout, rotas, contratos e requests de mutação. O feedback da saída usa “Processando…” porque o estado `busy` já é compartilhado com vínculo Google. Nenhuma alteração em backend, APIs, dependências, conteúdo de módulos, editor de perfil ou autenticação pública pertence a esta mudança.

## Verificações aprovadas

- **62 testes de UI diretamente relacionados**, em AuthenticatedShell, Auth, ProfilePage, App e theme. Os 25 novos casos cobrem combinações de módulos, destinos e ativo/Mais, teclado/Escape/resize, callback de saída, persistência/estado do tema, avatar confirmado/falha/removido e respostas obsoletas. Testes de Conta existentes foram ampliados para conferir nome/foto confirmados versus draft, preview e falha.
- `pnpm lint`: aprovado em todos os workspaces e Prettier.
- `pnpm typecheck`: aprovado em todos os workspaces.
- `pnpm build`: aprovado em todos os workspaces; permanece o aviso de chunk maior que 500 kB, sem falha de build.
- `openspec validate update-authenticated-shell-visuals --strict` e `git diff --check`: aprovados.

O sandbox inicialmente recusou subprocessos (`spawn EPERM`); comandos pnpm obrigatórios e Chromium foram executados com aprovação automática fora dessa restrição. Vite/Vitest locais usaram `--configLoader native` conforme diagnóstico já documentado no projeto; os testes diretos de UI usaram `--pool threads`. Nenhuma dependência ou configuração de produto foi alterada para contornar o ambiente.

## Evidência de browser

`browser-validation.cjs` usa Chromium headless já instalado. Fixtures são interceptadas somente no navegador e não alteram o runtime do produto nem dados reais. Os testes obrigatórios de banco da raiz usaram MySQL real isolado conforme a configuração existente.

- Baseline: **36 combinações**, nove destinos × dois temas × 320/1440 px, mais preferências indisponíveis.
- Shell final: **108 combinações**, nove destinos × dois temas × 320/375/768/1023/1024/1440 px; 1024 px com altura de 480 px. Nenhum overflow horizontal observado.
- Comparação com baseline: texto interno das páginas idêntico em todas as 36 combinações correspondentes. Essa comparação confirma conteúdo, não identidade de pixels; largura útil e posicionamento externo mudam conforme o shell. Diff confirma preservação do JSX/CSS internos dos módulos e da Conta.
- Inspeção visual das capturas e contact sheets dos nove destinos nos dois temas: header e itens ativos legíveis, sem controles cortados; sidebar da Conta e navegação interna continuam presentes.
- Menu Mais verificado nos dois temas: teclado, foco inicial, Escape e retorno ao acionador, fechamento no resize para desktop, ausência de navegação mobile residual e liberação de scroll.
- Desktop de pouca altura: navegação lateral com scroll e Sair alcançável por Tab. Mobile paisagem 568×320: menu rolável e última ação da página acima da barra.
- Safe area de 20 px **simulada** por override de teste das variáveis/padding: barra de 84 px e última ação fora da região encoberta. Não foi usado dispositivo físico com recorte.
- Zoom desktop de 125%: sem overflow horizontal do shell. `reducedMotion: reduce` durante inspeção, incluindo Sheet em portal.
- Controles do menu com área de pelo menos 44×44 px. Contraste renderizado dos textos/controles de header, avatar/fallback, navegações, Mais e Sair: mínimo **5,2676:1**, nos dois temas. Foco visível verificado em capturas e teclado.
- Navegação da Conta com query/hash e draft preservado ao alternar tema e seção; reload, voltar/avançar e links reais verificados.
- Módulo desativado permanece omitido e apresenta estado atual na URL direta. Preferências indisponíveis preservam o estado atual sem habilitar módulos.
- Logout desktop/mobile: requisição controlada pendente bloqueia o botão; falha mantém sessão, fecha Mais e deixa alerta visível; retry confirmado redireciona para `/acesso`.

Evidências em `validation/baseline/` e `validation/final/`: capturas, `results.json`, `interactions.json`, contraste e comparação de conteúdo. Pomodoro foi exercitado com a fixture de erro da consulta complementar, preservando esse estado real; a matriz não equivale a validação de integração com todos os endpoints reais. Os testes relacionados cobrem outros estados existentes.

## Retomada e correções dos bloqueios

A primeira execução obrigatória falhou em dois testes preexistentes: importação demo com HTTP 410 por fixture datada e busca de objetivo ambígua entre lista e detalhe. A retomada solicitada pelo usuário autorizou ajustes mínimos nesses testes, sem mudanças em código de produto:

- `apps/api/test/demo.spec.ts`: Date.now utiliza o mesmo relógio fixo já adotado pelo cenário somente durante a consulta da importação, com restauração em finally. O MySQL continua real e isolado; nenhum serviço ou repository foi alterado.
- `apps/web/src/features/subjects/SubjectsPage.spec.tsx`: aguarda e confirma as duas apresentações do objetivo atualizado, na lista e no detalhe, evitando uma consulta que exigia ocorrência única. Os oito testes de Matérias passaram no run dirigido.

Lint, typecheck e build foram novamente aprovados. A execução final de pnpm test foi aprovada: 37/37 contratos, 195/195 API em MySQL real isolado e 223/223 web (455 testes). Todas as 22 tarefas foram concluídas. Nenhuma tag, push ou archive faz parte deste apply.
