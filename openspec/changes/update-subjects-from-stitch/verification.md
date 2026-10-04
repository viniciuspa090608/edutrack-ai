# Verificação do apply

## Estado inicial e escopo

- Branch `master`, HEAD inicial `6140e0d05d8b02920e7ba25885386684376337bf`.
- Sem diff tracked/staged inicial. A única entrada untracked era esta proposta OpenSpec, incluída no commit da mudança.
- Durante o apply surgiu `openspec/changes/update-tasks-from-stitch/`; essa proposta externa foi preservada e excluída do staging.
- Fontes alteradas limitadas à apresentação de Matérias, seus auxiliares, CSS local e classe do container de Matérias em `PrivatePage`. Clientes API, contratos, backend, migrations, lockfile e regras não foram alterados.
- `AuthFeedback.spec.tsx` recebeu somente formatação, autorizada pelo usuário para corrigir uma falha preexistente no lint global.

## Verificações automatizadas

| Verificação | Resultado |
| --- | --- |
| `pnpm lint` | Aprovado após a formatação autorizada; repetido após ajustes finais |
| `pnpm typecheck` | Aprovado, inclusive após ajustes finais |
| `pnpm test` | 399 testes aprovados: contracts 37, API 195, web 167 |
| Testes específicos de SubjectsPage, RoadmapsSection e RoadmapRevisionTools | 20 testes aprovados em 3 arquivos; sem necessidade de mudar suas expectativas |
| `pnpm build` | Aprovado, inclusive após ajustes finais; aviso de tamanho do bundle permanece |
| `openspec validate update-subjects-from-stitch --strict` | Aprovado |

Testes de integração de banco executaram suas suites existentes com MySQL real e bancos temporários isolados. Não houve substituição de falhas de configuração por mocks.

## Inspeção visual e comportamento

Playwright com Edge local, viewports 320/375/768/1024/1440 px, temas claro e escuro. Capturas e medidas de largura cobriram listagem, detalhe, plano manual, registros vinculados, criação/edição, formulário com textos longos, confirmações de matéria e roadmap, parâmetros de IA, editor manual, reordenação, histórico, snapshot e erro real de restauração incompatível.

Prévia de geração, prévia de restauração/revisão e falha de provedor foram inspecionadas com respostas contratuais no navegador de teste, derivadas do conteúdo real lido da conta demo. Os passos repetidos dessa fixture também exercitaram o alerta e bloqueio de confirmação existentes. Vazio, erro e loading da lista foram inspecionados com fixtures de teste. Nenhuma fixture foi incorporada ao código da aplicação; nenhuma prévia foi confirmada e nenhuma entidade demo foi criada, editada ou excluída na inspeção visual.

Os auxiliares foram abertos diretamente em tarefas, flashcards e Pomodoro, sem depender de visitar Matérias primeiro. Não houve overflow horizontal nas 210 combinações de interface, largura e tema inspecionadas. O layout deriva do desktop claro do Stitch: cards claros arredondados, metadados em superfícies suaves, hierarquia de texto e ações azuis. A adaptação móvel empilha campos/ações e não replica lacunas do export; dados acadêmicos incompatíveis foram omitidos.

Foco inicial no nome do formulário, retorno ao botão Criar matéria após cancelamento, foco inicial em Cancelar exclusão no diálogo e retorno após Escape foram confirmados no navegador. Os testes de interação existentes verificaram CRUD e reordenação por teclado, limites, bloqueios, cancelamento, erros preservando edição, preferências, expiração, conflitos e restauração. Anúncios semânticos e nomes acessíveis foram preservados. Temas foram capturados após estabilizar as transições; botões, badges e diálogo mantêm contraste legível. Movimento reduzido produziu duração de transição de `0.00001s` no card.

Evidências locais persistidas em `C:/Users/vinic/.codex/visualizations/2026/10/04/01a104eb-1676-7173-ad6d-7622eb502bd3/subjects/`: `layout-report.json` e capturas representativas da listagem, detalhe, edição, confirmação, prévias, auxiliar e vazio. Scripts temporários de inspeção são removidos antes do staging.

## Arquivos incluídos

- `apps/web/src/features/subjects/`: `SubjectsPage.tsx`, `RoadmapsSection.tsx`, `RoadmapEditor.tsx`, `RoadmapRevisionTools.tsx`, `SubjectSelect.tsx` e `SubjectName.tsx`.
- `apps/web/src/styles/`: `subjects.css` e `subject-associations.css`.
- `apps/web/src/features/auth/`: `PrivatePage.tsx` e a formatação autorizada de `AuthFeedback.spec.tsx`.
- `openspec/changes/update-subjects-from-stitch/`: `.openspec.yaml`, `proposal.md`, `design.md`, `specs/subjects-visual-experience/spec.md`, `tasks.md` e `verification.md`.
