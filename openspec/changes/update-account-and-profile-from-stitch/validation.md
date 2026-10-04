# Validação de Perfil/Conta

## Baseline e escopo

Apply iniciado em `master`, HEAD `c4b23a8645e7ee290211ec8a3ec8ee474aafe408`. Somente esta proposta estava untracked; nenhum diff tracked preexistente. Registro em `baseline-git.txt`. Os trabalhos citados como concorrentes na proposta já estavam commitados quando o apply começou. O fuso já possuía classes visuais de Progresso e foi integrado por CSS local, mantendo seu componente e lógica.

Referência externa: `C:/Users/vinic/Downloads/accont_edutrack_ai.zip`, inventário e limitações documentados em `design.md`. Nenhum script, dado fixo, instrução, dependência ou regra do anexo foi executado/incorporado como regra de produto.

Implementação restrita a cinco arquivos web: `ProfilePage.tsx`, `ProfilePage.spec.tsx`, `PrivatePage.tsx`, `StudyTimeZoneSection.tsx` e `account.css`. Sem mudanças em backend, contratos, adapters/API clients, autenticação, armazenamento, rotas, catálogo de módulos ou mecanismo de tema.

## Verificações automatizadas

- `pnpm --filter @study-platform/web test src/features/profile/ProfilePage.spec.tsx`: **14/14 aprovados**. Incluem os nove casos existentes e cinco casos novos de navegação/drafts/temas, load failure/retry, submissão pendente sem sucesso antecipado, falhas de logout/vínculo e retorno Google bem-sucedido. Validação dos campos reais, normalização de nome, upload de bytes/preview/remoção/limite, último módulo ativo, recusa do servidor, etapas/cooldown/código/e-mail, senha local, conta Google exclusiva e prova expirada preservadas. Acessos Google/logout continuam disponíveis quando o carregamento do perfil falha.
- `pnpm --filter @study-platform/web test src/features/auth/Auth.spec.tsx -t 'private account content|authenticated user leave|Google failure'`: **3 aprovados, 3 fora do escopo ignorados**. Nenhum dado privado antes da verificação, saída e retorno Google com erro.
- `pnpm --filter @study-platform/web test src/features/study-progress/StudyProgressPage.spec.tsx -t 'timezone load retry'`: **1 aprovado, 5 fora do escopo ignorados**. Fuso com loading/retry, sugestão explícita, busy, falha e nova tentativa bem-sucedida.
- `pnpm lint`: aprovado, incluindo Prettier.
- `pnpm typecheck`: aprovado.
- `pnpm build`: aprovado. Aviso já existente de bundle acima de 500 kB mantido; sem refatoração global para otimização.
- Nenhuma suíte completa, teste backend/banco ou teste de módulo não relacionado executado. Os comandos globais acima são lint/tipos/compilação, não testes.

A execução inicial de Vite foi impedida pelo sandbox (`spawn EPERM`); comandos com subprocessos foram executados com escalonamento aprovado. Os novos testes precisaram do mesmo stub de Storage já usado nos testes de tema do projeto, pois o Node expõe um placeholder de localStorage. Falhas iniciais de seleção/typing dos testes foram corrigidas; os resultados acima são da versão final.

## Navegador e API real

Web/API locais existentes em `localhost:5173`; usada a sessão e conta local de demonstração `ativo@demo.edutrack.test`. Sem seed/reset, edição direta do banco ou transporte mockado no produto.

| Validação | Resultado observado |
| --- | --- |
| Temas e responsividade | Claro/escuro em 320, 390, 768 e 1280 px; `scrollWidth === clientWidth` em todas as oito combinações e nenhum elemento da área ultrapassando a borda direita. Cliente efetivo 305/375/753/1265 px por causa da barra vertical. |
| Navegação | Âncoras reais, seleção indicada por `aria-current`, sem desmontar forms; nome em draft preservado após navegar e alternar tema. Foco por Tab observado com outline visível. |
| Texto longo | Nome longo dentro do limite existente salvo pela API, conferido após reload, sem overflow em 320 px; nome original restaurado e confirmado. |
| Preferências | Tarefas desativadas pela UI, confirmação real e remoção do link no shell; reativadas e link restaurado. Demais valores originais preservados. |
| Foto | PNG temporário gerado para o teste (128×128), preview sem indicar persistência, PUT real confirmado, foto mantida após reload. Remoção aprovada explicitamente pelo usuário nesta conversa; DELETE confirmado e avatar padrão restaurado. Limites e rejeições adicionais cobertos nos testes UI. |
| Identidade | Senha existente da demonstração confirmou identidade por 5 minutos; formulário do novo e-mail exibido somente após resposta real. Nenhum novo e-mail ou senha foi definido. |
| Logout | Ação “Encerrar sessão” chamou o fluxo existente e levou a `/acesso` sem dados privados; login normal da mesma conta restaurou a sessão, seguido de retorno a `/conta`. |
| Loading/erros/sucesso/disabled | Loading observado naturalmente; feedback real de nome, preferências, foto, identidade e erro de fuso. Botões de salvar/remover foto bloqueados sem arquivo/foto. Falhas de rede, submissão pendente, código inválido/prova expirada e Google cobertos nos testes UI. |
| Hover/selected/movimento reduzido | Seleção e foco conferidos visualmente; regras locais de hover usam tokens e foram revisadas. Regra `prefers-reduced-motion` remove animações/transições sem mudar timers. O sistema de teste estava sem redução de movimento; essa preferência foi conferida no CSS, sem mudar a configuração global do computador. |

## Limitações observadas, sem ampliação do escopo

- **Fuso:** a API local recusou tanto um fuso inválido quanto o valor válido já persistido (`America/Sao_Paulo`), exibindo a mensagem de erro existente. Reload confirmou o valor original. O client e handler de salvamento não foram alterados por esta mudança; `progress-api.ts` já envia o corpo de PATCH sem definir Content-Type JSON, possível causa observada na leitura do código, sem prova por inspeção de rede. Sucesso/retry/busy estão cobertos no teste focado; não se afirma sucesso de salvamento real de fuso.
- **Google:** a sessão real apresenta divergência preexistente entre o indicador de meios de entrada de `/profile` e a disponibilidade do vínculo baseada em `/auth/me`. Cada área continua consumindo os mesmos dados/condições de antes; não foram alteradas consultas, schemas ou regras para corrigir essa divergência. OAuth externo/vínculo/reautenticação Google não foram concluídos na conta de demonstração; seus retornos e disponibilidade foram verificados em testes UI.
- **Credenciais:** não foram alterados e-mail ou senha reais durante validação. Esses fluxos completos, redirects, confirmação de código, cooldown, erros e contas Google exclusivas foram verificados pelos testes de front-end, preservando APIs/segurança.

## Evidências e revisão final

Capturas locais e matriz JSON em `C:/Users/vinic/.codex/visualizations/2026/10/04/01a1082d-49c3-7701-a5e3-cab94dfcad98/`, sem incluir imagens de teste no commit:

- `account-layout-validation.json`: medições finais nas oito combinações.
- `account-final-light-desktop.jpg`, `account-final-dark-desktop.jpg`: apresentação final.
- `account-escuro-320.jpg`, `account-claro-320.jpg`: formulários na largura mínima.
- `account-long-name-mobile.jpg`, `account-nav-focus-dark-mobile.jpg`: texto longo e foco.
- `account-timezone-error-mobile.jpg`, `account-security-identity-mobile.jpg`, `account-photo-saved-mobile.jpg`, `account-logout-confirmed.jpg`: estados reais.

Diff revisado: efeitos/mutações originais preservados, mais estado exclusivamente visual da âncora ativa; formularios mantidos no DOM na mesma ordem de navegação visual. Foto continua via Blob/object URL e bytes autenticados. Shell conserva `leave`, `linkGoogle`, verificação e callbacks; ações compostas também ficam disponíveis no fallback de perfil. CSS tem seletores locais e tokens, sem alterar estilos de outros módulos. O botão de sugestão de fuso recebeu somente variante outline.

Estado final da demonstração: nome e avatar originais, módulos originais, fuso original, tema claro e sessão restaurada. Override de viewport removido; console da aba final sem erros. `/conta` deixada aberta como resultado.

Comparação estrutural das callbacks de formulários/controles contra HEAD confirmou preservação de 18/18 handlers originais em ProfilePage, 3/3 em PrivatePage e 4/4 em StudyTimeZoneSection (ignorando somente whitespace e vírgulas finais de formatação).

Arquivos incluídos no commit único:

- `apps/web/src/features/profile/ProfilePage.tsx`
- `apps/web/src/features/profile/ProfilePage.spec.tsx`
- `apps/web/src/features/auth/PrivatePage.tsx`
- `apps/web/src/features/study-progress/StudyTimeZoneSection.tsx`
- `apps/web/src/styles/account.css`
- `openspec/changes/update-account-and-profile-from-stitch/.openspec.yaml`
- `openspec/changes/update-account-and-profile-from-stitch/proposal.md`
- `openspec/changes/update-account-and-profile-from-stitch/design.md`
- `openspec/changes/update-account-and-profile-from-stitch/specs/account-profile-visual-experience/spec.md`
- `openspec/changes/update-account-and-profile-from-stitch/tasks.md`
- `openspec/changes/update-account-and-profile-from-stitch/baseline-git.txt`
- `openspec/changes/update-account-and-profile-from-stitch/validation.md`
