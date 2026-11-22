# Validação

Implementação concluída em branch própria, a partir de working tree limpo em `master`. Os registros preexistentes foram preservados. Nenhum push, tag ou alteração de callbacks OAuth faz parte desta mudança.

## Verificações

- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` aprovados.
- Suíte completa: 22 testes do workflow, 46 de contratos, 331 da API e 339 da interface.
- Novos testes cobrem validação, 6/10 tarefas, ritmo, limite inclusivo e horário de verão, prazo vencido, meta alcançada, ausência de registros e módulos desabilitados.
- MySQL real em banco temporário: migration reversível, meta única sob concorrência, isolamento de contas/disciplinas, autenticação/origem, edição e reinício de janela, reabertura/desvinculação/exclusão de tarefas, intervalos ativos recortados e revisões comparáveis.
- Interface: carregamento, vazio, sucesso, edição, erro com nova tentativa, preservação de rascunho, atualização ao foco e descarte de respostas antigas.
- Layout reutiliza componentes acessíveis e o tratamento de largura mínima e quebra de texto da página de disciplinas; não foi realizada inspeção visual manual do navegador.
- Migration local de desenvolvimento aplicada: `CreateSubjectGoals20261122100000`; nenhuma migration pendente após aplicação.
- O inventário de tabelas de demonstração inclui `subject_goals`, preservando o reset e os testes existentes.
- Textos determinísticos; nenhuma chamada a provedor de IA.

## Arquivos da implementação

- `README.md`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/subject-goals.ts`
- `packages/contracts/src/subject-goals.spec.ts`
- `apps/api/src/app.ts`
- `apps/api/src/database/migrations/20261122100000-CreateSubjectGoals.ts`
- `apps/api/src/demo/database.ts`
- `apps/api/src/modules/tasks/subject-evidence.ts`
- `apps/api/src/modules/pomodoro/subject-evidence.ts`
- `apps/api/src/modules/flashcards/subject-evidence.ts`
- `apps/api/src/modules/subjects/subjects.routes.ts`
- `apps/api/src/modules/subjects/subject-goals.repository.ts`
- `apps/api/src/modules/subjects/subject-goals.service.ts`
- `apps/api/src/modules/subjects/subject-insights.ts`
- `apps/api/src/modules/subjects/subject-insights.spec.ts`
- `apps/api/test/subject-goals.http.spec.ts`
- `apps/web/src/features/subjects/SubjectsPage.tsx`
- `apps/web/src/features/subjects/SubjectInsightsPanel.tsx`
- `apps/web/src/features/subjects/SubjectInsightsPanel.spec.tsx`
- `apps/web/src/features/subjects/subject-goals-api.ts`
- `apps/web/src/features/subjects/subject-link.ts`
- `apps/web/src/features/tasks/TasksPage.tsx`
- `apps/web/src/features/pomodoro/PomodoroPage.tsx`
- `apps/web/src/features/flashcards/FlashcardsPage.tsx`

Também integram o commit a spec principal `openspec/specs/subject-goal-insights/spec.md` e os artefatos desta mudança (`.openspec.yaml`, `proposal.md`, `design.md`, `tasks.md`, `specs/subject-goal-insights/spec.md` e este relatório), movidos juntos para archive pelo fluxo de conclusão. O snapshot revisado introduz uma capacidade nova, sem substituir requisitos de outras specs.
