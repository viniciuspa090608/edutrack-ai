# Validação de refine-platform-ui-details

## Estado inicial e escopo

Apply iniciado em 03/11/2026 na branch `codex/refine-interface-navigation-and-creation`, HEAD `a15c399d18a16b9092fb63f6f1e39cf994d0402c`. O único conteúdo preexistente sem versionamento era a própria proposta `openspec/changes/refine-platform-ui-details/`. A implementação usa a branch `codex/refine-platform-ui-details`. Nenhuma alteração foi feita nos artefatos de `refine-auth-desktop-layout`, na API, nos contratos, no ambiente privado ou na master.

## Regressão e verificação visual

A suíte web anterior aos três novos testes passou com 275 testes. Foram acrescentadas verificações de navegação SPA/foco/animação de recuperação, formato da data e scrollspy sem perda de foco. As cinco suítes com falhas de prazo durante concorrência passaram em execução com um worker: 58 testes, sem ampliar limites ou enfraquecer assertions. Os testes de controles agora operam menus visíveis por roles e preservam assertions de payloads e persistência.

O QA usa Microsoft Edge via Playwright, com respostas HTTP sintéticas somente para alcançar estados de UI; isso não homologa OAuth externo ou importação real. As fixtures de Dashboard foram validadas pelo contrato público. Os testes gerais da API usam MySQL real e bancos isolados conforme setup existente.

| Matriz | Cobertura | Resultado |
| --- | --- | --- |
| Superfícies principais | Acesso, recuperação, conta, Dashboard e Pomodoro; temas claro/escuro; 320×900, 768×900 e 1440×900 | 30 combinações sem overflow horizontal ou erros de execução |
| Movimento reduzido | Recuperação com preferência reduce | animação computada none |
| Select em FormModal | 80 opções e rótulo longo em 320 px, ambos os temas; setas, End, Enter, Escape, Tab e retorno de foco | seleção final, fechamento só do menu e contenção do modal preservados |
| Ampliação | Cinco superfícies, ambos os temas, viewport 1440×900 com CSS zoom 200% | 10 combinações sem overflow; teste de ampliação CSS, não zoom da interface do navegador |
| Pomodoro em sessão | RUNNING, PAUSED e BETWEEN_BLOCKS; 320/1440 px, ambos os temas | 12 combinações; diferença entre bases das colunas desktop até 1 px; mobile empilhado |
| Classroom conectado e Configurações | 320/1440 px, ambos os temas; seleção de IA por setas | 4 combinações; card e logo, preferências alinhadas e Salvar maior que Recarregar em desktop |
| Loading e erro extenso | Conta, Dashboard e Pomodoro; 320/1440 px, ambos os temas; mensagem com trecho de 200 caracteres contínuos | 24 combinações sem overflow horizontal |

Resultados e capturas locais ficam em `.openspec-local/platform-qa/`, com 43 casos da matriz principal em `results.json` e 40 casos de estados em `states.json`. Capturas inspecionadas incluem Dashboard/Pomodoro desktop, conta e menu em modal estreito. A inspeção encontrou e corrigiu o grid dos parágrafos nas preferências, a largura de menus longos e a atualização visual do modelo ao trocar o provedor.

## Revisão de specs

Os cinco deltas adicionam nove requisitos e 14 cenários. Os snapshots preservam integralmente os 29 requisitos e 65 cenários anteriores das cinco capacidades. Não substituem requisitos posteriores nem sincronizam outras mudanças. A restrição histórica contra integrações fictícias permanece: o card usa a integração Classroom já implementada e suas ações reais.

## Qualidade

Typecheck e build do monorepo aprovados. O build mantém o aviso informativo de bundle acima de 500 kB. As duas primeiras execuções concorrentes da web tiveram timeouts; a execução final usa `VITEST_MAX_WORKERS=1`, suportado pelo Vitest, mantendo os mesmos limites e MySQL real. Lint, typecheck, test e build aprovados. A execução geral com um worker terminou com 22 testes do workflow, 41 testes de contratos, 277 testes da API/MySQL e 278 testes web aprovados (618 no total). O staged foi revisado e git diff --cached --check passou. O encerramento local usa o finalizador controlado do projeto; o hash final é informado após sync/archive e verificação do resultado.

## Arquivos do commit de conclusão

O manifesto delimita 55 arquivos, incluindo implementação, testes, asset local, artefatos arquivados e cinco specs sincronizadas:

- `apps/web/src/features/auth/PasswordRecoveryPage.tsx`
- `apps/web/src/features/classroom/ClassroomSection.tsx`
- `apps/web/src/features/classroom/assets/README.md`
- `apps/web/src/features/classroom/assets/google-classroom.png`
- `apps/web/src/features/dashboard/DashboardPage.spec.tsx`
- `apps/web/src/features/dashboard/DashboardPage.tsx`
- `apps/web/src/features/flashcards/FlashcardAIFlow.spec.tsx`
- `apps/web/src/features/flashcards/FlashcardAIFlow.tsx`
- `apps/web/src/features/flashcards/FlashcardsPage.spec.tsx`
- `apps/web/src/features/flashcards/ImportFlow.spec.tsx`
- `apps/web/src/features/flashcards/ImportFlow.tsx`
- `apps/web/src/features/flashcards/ReviewQueue.spec.tsx`
- `apps/web/src/features/flashcards/ReviewQueue.tsx`
- `apps/web/src/features/landing/AccessPage.spec.tsx`
- `apps/web/src/features/landing/AccessPage.tsx`
- `apps/web/src/features/landing/public-navigation.ts`
- `apps/web/src/features/pomodoro/PomodoroPage.spec.tsx`
- `apps/web/src/features/pomodoro/PomodoroPage.tsx`
- `apps/web/src/features/profile/AISettingsSection.spec.tsx`
- `apps/web/src/features/profile/AISettingsSection.tsx`
- `apps/web/src/features/profile/ProfilePage.spec.tsx`
- `apps/web/src/features/profile/ProfilePage.tsx`
- `apps/web/src/features/profile/useAccountSections.ts`
- `apps/web/src/features/routines/RoutinesPage.spec.tsx`
- `apps/web/src/features/routines/RoutinesPage.tsx`
- `apps/web/src/features/subjects/RoadmapsSection.tsx`
- `apps/web/src/features/subjects/SubjectSelect.tsx`
- `apps/web/src/features/subjects/SubjectsPage.spec.tsx`
- `apps/web/src/features/subjects/SubjectsPage.tsx`
- `apps/web/src/features/tasks/TasksPage.spec.tsx`
- `apps/web/src/features/tasks/TasksPage.tsx`
- `apps/web/src/styles/account.css`
- `apps/web/src/styles/auth.css`
- `apps/web/src/styles/classroom.css`
- `apps/web/src/styles/dashboard.css`
- `apps/web/src/styles/pomodoro.css`
- `apps/web/src/test/select-option.ts`
- `apps/web/src/test/setup.ts`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/.openspec.yaml`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/design.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/proposal.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/specs/account-profile-visual-experience/spec.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/specs/account-recovery/spec.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/specs/dashboard-presentation/spec.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/specs/frontend-ui-controls/spec.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/specs/pomodoro-visual-experience/spec.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/tasks.md`
- `openspec/changes/archive/2026-11-03-refine-platform-ui-details/validation.md`
- `openspec/specs/account-profile-visual-experience/spec.md`
- `openspec/specs/account-recovery/spec.md`
- `openspec/specs/dashboard-presentation/spec.md`
- `openspec/specs/frontend-ui-controls/spec.md`
- `openspec/specs/pomodoro-visual-experience/spec.md`
- `packages/ui/src/components/ui/radio-group.tsx`
- `packages/ui/src/components/ui/select.tsx`
