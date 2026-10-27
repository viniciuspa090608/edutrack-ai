# Revisão da implementação

## Escopo entregue

Rotinas próprias com vários horários semanais, fuso IANA explícito, intervalos locais no mesmo dia, validação de sobreposição, operações transacionais, listagem paginada e programação ordenada. A página `/app/rotinas` permite criar, editar e excluir por teclado, mantém dados após falhas e confirma exclusão com restauração de foco. README atualizado.

As alterações preexistentes no Git eram arquivos OpenSpec de outras mudanças, arquivos de skills e movimentações de propostas antigas. Foram preservadas; nenhum arquivo dessas outras mudanças foi adicionado ao index.

## Verificações concluídas

- Autenticação confirmada antes da integração por cinco testes HTTP existentes com MySQL real.
- Três testes de contratos de rotinas e sete testes HTTP de rotinas em MySQL real isolado aprovados. Cobrem migrations/reversão, CRUD, isolamento, intervalos adjacentes, sobreposição, programação, preservação de horas, rollback após falha de banco e ausência de gravação em tarefas/Pomodoro.
- Sete testes web de rotinas aprovados, incluindo rota protegida, teclado, confirmação, erros e sucesso após resposta da API. Suite web completa: 59 testes aprovados.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` e `openspec validate add-study-routines --strict` aprovados. O build emite o aviso não bloqueante de bundle acima de 500 kB.
- Revisão manual usando o componente real e API real com duas contas fictícias em MySQL isolado: criação/edição/exclusão por teclado, cancelamento sem mutação, foco, fusos Asia/Tokyo e Europe/Lisbon, horas 08:00–09:00 preservadas, dias distintos e dados separados entre contas.
- Iframe de 320 px: formulário com duas linhas e programação sem overflow horizontal (`clientWidth = scrollWidth = 305`, descontada a barra vertical). Fixtures, servidores e banco da revisão manual removidos após a revisão.

## Correção adicional autorizada

`pnpm test` falhou inicialmente em duas execuções no teste preexistente `apps/api/test/email-flow.spec.ts`, cenário “blocks five wrong codes and expiration, including concurrent consumption”. Duas confirmações concorrentes de e-mail retornavam `[204, 401]`; a asserção exigia `[204, 400]`. Após autorização explícita do usuário para investigar e corrigir o teste, a asserção foi ajustada para reconhecer ambas as ordens válidas: a segunda chamada encontra código consumido (`400/INVALID_CODE`) ou contexto invalidado (`401/UNAUTHENTICATED`). Mantém exatamente um sucesso `204` e confirma no banco um único desafio consumido e nenhum contexto ativo. Os oito testes desse arquivo passaram. Não foi alterado código de produção da confirmação de e-mail.

O erro de tipos do mock de rotinas encontrado na primeira rodada foi corrigido. A validação completa foi repetida após a correção autorizada.

Validação final: lint, typecheck, 164 testes (17 contratos, 88 API, 59 web), build e OpenSpec strict aprovados.

## Arquivos do commit

- README.md
- apps/api/src/app.ts
- apps/api/src/database/data-source.ts
- apps/api/src/database/migrations/20260926210000-CreateStudyRoutines.ts
- apps/api/src/modules/auth/google.service.ts
- apps/api/src/modules/routines/routine.entity.ts
- apps/api/src/modules/routines/routines.repository.ts
- apps/api/src/modules/routines/routines.routes.ts
- apps/api/src/modules/routines/routines.service.ts
- apps/api/test/routines.http.spec.ts
- apps/api/test/email-flow.spec.ts
- apps/web/src/app/App.tsx
- apps/web/src/features/auth/PrivatePage.tsx
- apps/web/src/features/auth/auth-api.ts
- apps/web/src/features/routines/RoutinesPage.tsx
- apps/web/src/features/routines/RoutinesPage.spec.tsx
- apps/web/src/features/routines/routines-api.ts
- apps/web/src/styles/routines.css
- packages/contracts/src/index.ts
- packages/contracts/src/routines.ts
- packages/contracts/src/routines.spec.ts
- openspec/changes/add-study-routines/.openspec.yaml
- openspec/changes/add-study-routines/proposal.md
- openspec/changes/add-study-routines/design.md
- openspec/changes/add-study-routines/tasks.md
- openspec/changes/add-study-routines/specs/shared-contracts/spec.md
- openspec/changes/add-study-routines/specs/study-routines/spec.md
- openspec/changes/add-study-routines/implementation-review.md
