# Auditoria do backlog

Baseline: 36 mudanças históricas, 35 com checklist concluído e uma com 20/23 tarefas. A auditoria cruza commits com arquivos de implementação/testes e registros de validação; checkboxes isolados não comprovam execução histórica. A suíte atual passou e está registrada em validation.md antes do archive.

## Ordem e evidências

| Ordem | Mudança | Commit inicial | Arquivos de código no commit | Evidência histórica | Dependências de sync | Decisão |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | add-user-authentication | 94b11e4 | 29 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 2 | add-email-verification-and-recovery | 1c70b5e | 31 | checklist + commit; sem log independente | add-user-authentication | Arquivada; integridade verificada |
| 3 | add-profile-and-module-preferences | fc373d7 | 38 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 4 | add-study-tasks | e7c0849 | 23 | checklist + commit; sem log independente | base ou capacidade independente | Manter ativa: delta incompatível com cenário posterior |
| 5 | add-task-subtasks-and-progress | b9f960c | 20 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 6 | add-pomodoro-sessions | ce303f7 | 17 | checklist + commit; sem log independente | add-study-tasks | Arquivada; integridade verificada |
| 7 | add-study-routines | d8a016f | 20 | checklist + commit; sem log independente | add-pomodoro-sessions | Arquivada; integridade verificada |
| 8 | add-subjects | 4bea4c8 | 39 | checklist + commit; sem log independente | add-study-routines | Arquivada; integridade verificada |
| 9 | generate-subject-roadmaps-with-ai | 00b9782 | 28 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 10 | regenerate-roadmap-steps | a701a93 | 24 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 11 | add-manual-flashcards | 7f3e9dd | 20 | checklist + commit; sem log independente | add-subjects | Arquivada; integridade verificada |
| 12 | import-flashcards | b05abb8 | 18 | checklist + commit; sem log independente | add-manual-flashcards | Arquivada; integridade verificada |
| 13 | add-spaced-repetition | 41635c1 | 21 | checklist + commit; sem log independente | import-flashcards | Arquivada; integridade verificada |
| 14 | generate-flashcards-with-ai | 0f3efa9 | 21 | checklist + commit; sem log independente | add-spaced-repetition | Arquivada; integridade verificada |
| 15 | add-study-analytics | 97907e7 | 28 | checklist + commit; sem log independente | generate-flashcards-with-ai | Arquivada; integridade verificada |
| 16 | add-study-streaks-and-achievements | 1e6b39b | 32 | checklist + commit; sem log independente | add-study-analytics | Arquivada; integridade verificada |
| 17 | compose-user-dashboard | 0abddc2 | 22 | checklist + commit; sem log independente | add-study-streaks-and-achievements | Arquivada; integridade verificada |
| 18 | replace-docker-with-local-database | cff03c8 | 5 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 19 | refactor-ui-to-shadcn | cb74ca3 | 83 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 20 | update-application-theme | 5872582 | 27 | verification.md | base ou capacidade independente | Arquivada; integridade verificada |
| 21 | prepare-demo-environment | 907e9dc | 28 | verification.md | base ou capacidade independente | Arquivada; integridade verificada |
| 22 | update-public-landing-from-stitch | cd8d636 | 19 | validation.md | update-application-theme, add-email-verification-and-recovery | Arquivada; integridade verificada |
| 23 | update-dashboard-from-stitch | f224027 | 5 | checklist + commit; sem log independente | base ou capacidade independente | Arquivada; integridade verificada |
| 24 | update-auth-screens-from-stitch | 6140e0d | 6 | validation.md | update-public-landing-from-stitch | Arquivada; integridade verificada |
| 25 | update-subjects-from-stitch | 36c980a | 10 | verification.md | base ou capacidade independente | Arquivada; integridade verificada |
| 26 | update-tasks-from-stitch | eecfae7 | 7 | validation.md | base ou capacidade independente | Arquivada; integridade verificada |
| 27 | update-study-sessions-and-pomodoro-from-stitch | d51ee97 | 3 | validation.md | base ou capacidade independente | Arquivada; integridade verificada |
| 28 | update-progress-and-achievements-from-stitch | c4b23a8 | 9 | validation.md | base ou capacidade independente | Arquivada; integridade verificada |
| 29 | update-account-and-profile-from-stitch | ee13f27 | 5 | validation.md | base ou capacidade independente | Arquivada; integridade verificada |
| 30 | update-subjects-and-tasks-empty-states | 69eb7ae | 6 | validation.md | base ou capacidade independente | Arquivada; integridade verificada |
| 31 | refine-auth-desktop-layout | cb85dcd | 12 | validation.md | base ou capacidade independente | Manter ativa |
| 32 | update-authenticated-shell-visuals | cb85dcd | 12 | validation.md | base ou capacidade independente | Arquivada; integridade verificada |
| 33 | update-transactional-email-copy | c115ef3 | 6 | validation.md | update-auth-screens-from-stitch | Arquivada; integridade verificada |
| 34 | update-study-routines-visuals | fcca980 | 3 | validation.md | base ou capacidade independente | Arquivada; integridade verificada |
| 35 | fix-frontend-ui-controls | 86c3414 | 18 | checklist + commit; sem log independente | update-transactional-email-copy | Arquivada; integridade verificada |
| 36 | fix-frontend-api-integration | 5acb1ba | 15 | validation.md | fix-frontend-ui-controls | Arquivada; integridade verificada |

## Reconciliação semântica

- As specs principais de autenticação já incorporavam confirmação de e-mail, embora os deltas de autenticação antiga ainda estivessem ativos. A projeção histórica reaplica a evolução na ordem de commits; o resultado final preserva conta pendente, contexto restrito e gates de confirmação, sem restaurar login privado imediato após cadastro.
- Contratos mínimos evoluem de health/erro para tarefas e Pomodoro; os cenários de tarefas são preservados, e os contratos posteriores de rotinas, matérias, flashcards, revisão, analytics e dashboard são adicionados sem substituir os anteriores.
- CI passa a exigir MySQL nativo real; execução local incorpora worker, demo e encerramento coordenado. Não se retorna à configuração Docker antiga.
- Tema incorpora precedência da escolha manual e armazenamento resiliente. Landing substitui os requisitos de carrossel/destino provisório por blocos estáticos e rotas reais de login/cadastro; requisitos e cenários não mencionados permanecem.
- O status manual de tarefas é explicitamente restrito a tarefas sem subtarefas, conforme a mudança posterior task-subtasks-and-progress. O requisito antigo de edição irrestrita não pode prevalecer sobre o status derivado.
- Capacidade nova usa o Purpose do delta e seus requisitos/scenarios completos. Deltas sem specs não geram capacidades artificiais. Nenhuma capacidade com MODIFIED ficou sem base; nenhum RENAMED ou aposentadoria total foi necessário.
- As 34 mudanças elegíveis foram movidas com integridade de conteúdo; alterações históricas não recebem novos commits de implementação. A migração documental pertence ao único commit desta mudança.

## Pendência preservada: refine-auth-desktop-layout

O relatório histórico registra falha real de pnpm test (API 194/195; importação demo expirada) e ausência de commit de conclusão. O commit cb85dcd posteriormente incorporou arquivos de autenticação em conjunto com o shell e corrigiu a fixture demo; o relatório do shell registra 455 testes aprovados. Isso comprova evolução posterior, mas não autoriza fabricar o commit específico nem marcar retroativamente as tarefas 5.2/5.4/5.5 desta mudança. Ela permanece ativa, sem sync dos seus três requisitos de layout. Sua reconciliação deve ocorrer em apply próprio usando o estado atual, sem commit vazio ou duplicação de implementação. Não é necessária uma nova mudança de produto apenas para repetir código já incorporado.

## Fontes

O inventory.json contém paths de deltas, requisitos, commits, arquivos de código e decisões por mudança. Os relatórios históricos permanecem junto aos respectivos artefatos ativos/arquivados. A comparação remota confirmada está em baseline.md. O inventário descreve evidência histórica com suas limitações e não a substitui por alegação de testes nunca executados.

## Bloqueio de validação histórica: add-study-tasks

Após a consolidação, openspec validate --changes --strict aprovou 36/37 mudanças e recusou add-study-tasks: o MODIFIED de Contratos compartilhados mínimos omite Contratos de sessão Pomodoro, acrescentado posteriormente. A spec principal preserva ambos os cenários, e 44/44 specs consolidadas passaram em strict. A mudança antiga permanece ativa por incompatibilidade de replay do delta; o archive não usa --no-validate nem altera a evidência histórica. Uma reconciliação posterior pode atualizar explicitamente o delta ao estado atual antes de arquivá-lo. Isso é uma pendência documental, não código faltante de tarefas.
