# Registro do apply

## Estado inicial

- Branch: master; HEAD: cc5bc1ae11ce44146c8781065f25a52a31d4c107.
- git status --short: somente `?? openspec/changes/update-public-landing-from-stitch/`, proposta criada nesta conversa.
- git diff e git diff --cached vazios; nenhum arquivo de implementação previamente modificado.
- Inventário continua sem application-theme principal; mantido delta ADDED consolidado e dependência documental com update-application-theme. Nenhuma sincronização/arquivamento realizado.
- Referências disponíveis no ZIP anexado e na extração temporária inspecionada na proposta.

## Verificação visual e comportamento

- Chromium headless real: 320, 375, 768, 1024 e 1440 px em claro e escuro (10 combinações), sem overflow horizontal do documento/body ou do menu aberto.
- Capturas inspecionadas em desktop e mobile contra as quatro referências do Stitch. Mantida composição desktop claro em ambos os temas, com hero lateral, blocos alternados, IA e personalização. Mobile empilha os blocos e preserva prévias: fotografia e barra inferior fictícia foram removidas conforme design.
- Exemplos coerentes: plano 3/4 itens = 75%, gráfico semanal total 400 minutos = 6h40 e conquista Foco consistente por 5 blocos. Prévias não têm controles no Tab nem operações reais.
- API explicitamente bloqueada na inspeção final da landing: zero chamadas à API, nenhum erro de execução; página e navegação utilizáveis sem sessão.
- Menu por teclado/Escape, retorno do foco, destinos login/cadastro, âncoras com título abaixo dos 72 px do header e tema disponível no mobile aprovados.
- Tema por teclado, override sobre SO, persistência entre rotas/abas, remoção da preferência, storage bloqueado com memória em navegação SPA e fallback após recarga aprovados.
- Primeira pintura do build local com tema escuro salvo e SO claro: 30/30 frames no tema correto, CPU 4x e latência 100 ms. Teste automatizado adicional compara bootstrap/runtime em 10 combinações de preferência salva/SO e erro de leitura.
- Movimento do hero limitado a aproximadamente 6 px; reduced-motion alterado em tempo real remove transform e smooth scroll; ponteiro touch não ativa parallax. Entradas são progressivas, visíveis por padrão, uma vez por elemento e toleram ausência/falha do observer.
- Contraste renderizado: 173 textos no desktop e 176 com menu mobile por tema/estado. Mínimos: claro 6,90:1; escuro 6,87:1 normal e 6,75:1 hover/foco. Sem pares abaixo dos limites aplicáveis. Foco visível por ring/outline dos componentes; tokens globais de controles/foco mantidos e testes de contraste existentes preservados.
- Regressão interna: /acesso, /app, /conta e /status, claro/escuro, capturas com CSS atual comparadas ao CSS de HEAD inicial: 8/8 idênticas pixel a pixel. Fixtures HTTP usadas exclusivamente para apresentar UI de conta/dashboard/status; não substituem testes de banco.

Evidências locais: `C:/Users/vinic/.codex/visualizations/2026/10/04/01a10499-0461-75e0-8521-430aaa6ec579/` contém `landing-{light,dark}-{320,375,768,1024,1440}.png`, previews mobile, capturas internas e relatórios JSON de layout/comportamento/regressão. Scripts de inspeção temporários: `edutrack-landing-visual.cjs`, `edutrack-landing-checks.cjs`, `edutrack-internal-regression.cjs` no TEMP. Nenhuma dependência adicionada ao monorepo.

## Verificações de qualidade

- pnpm lint e pnpm typecheck aprovados.
- pnpm test: contratos e API aprovados, incluindo MySQL real em bancos isolados criados/removidos pelos testes existentes; nenhum banco de usuário foi limpo. Resultado final da web registrado abaixo.
- pnpm build aprovado; mantém aviso de bundle maior que 500 kB, sem ampliar o escopo para divisão de chunks.
- openspec validate update-public-landing-from-stitch --strict aprovado; deltas coerentes com acesso real, substituição do carrossel e prioridade manual de tema.
- Sem alterações em API, banco, contratos de domínio, regras de IA ou módulos de estudo. Sem push, tag, sync ou archive.

Resultado final de pnpm test: 75 arquivos de teste aprovados, 390 testes (37 contratos + 195 API + 158 web). Testes novos incluem 10 combinações bootstrap/runtime e navegação SPA com tema, mode e returnTo. Build final aprovado. Ajuste final de observer verificado no navegador com construtor indisponível: prévias e navegação continuam acessíveis.

## Arquivos incluídos no commit único

- `apps/web/index.html`
- `apps/web/public/illustrations/flashcards.svg`
- `apps/web/public/illustrations/focus.svg`
- `apps/web/public/illustrations/roadmap.svg`
- `apps/web/public/illustrations/tasks.svg`
- `apps/web/src/app/App.spec.tsx`
- `apps/web/src/app/theme-bootstrap.spec.ts`
- `apps/web/src/app/theme.spec.tsx`
- `apps/web/src/app/theme.ts`
- `apps/web/src/features/landing/AccessPage.spec.tsx`
- `apps/web/src/features/landing/AccessPage.tsx`
- `apps/web/src/features/landing/FeatureCarousel.spec.tsx`
- `apps/web/src/features/landing/FeatureCarousel.tsx`
- `apps/web/src/features/landing/ProductPreview.tsx`
- `apps/web/src/features/landing/PublicLanding.tsx`
- `apps/web/src/features/landing/ThemeToggle.tsx`
- `apps/web/src/features/landing/public-navigation.ts`
- `apps/web/src/features/landing/useLandingMotion.ts`
- `apps/web/src/styles/landing.css`
- `openspec/changes/update-public-landing-from-stitch/.openspec.yaml`
- `openspec/changes/update-public-landing-from-stitch/design.md`
- `openspec/changes/update-public-landing-from-stitch/proposal.md`
- `openspec/changes/update-public-landing-from-stitch/specs/application-theme/spec.md`
- `openspec/changes/update-public-landing-from-stitch/specs/public-landing/spec.md`
- `openspec/changes/update-public-landing-from-stitch/specs/user-authentication/spec.md`
- `openspec/changes/update-public-landing-from-stitch/tasks.md`
- `openspec/changes/update-public-landing-from-stitch/validation.md`

A pasta não relacionada openspec/changes/update-dashboard-from-stitch/ apareceu durante o apply e foi preservada fora do stage/commit desta mudança. Diff staged revisado e git diff --cached --check aprovado após normalização de linhas vazias finais dos artefatos.
