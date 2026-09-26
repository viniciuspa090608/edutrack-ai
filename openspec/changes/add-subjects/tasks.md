# Tasks

## 1. Preparação e contratos

- [x] 1.1 Confirmar que autenticação, tarefas, Pomodoro e preferências foram aplicados; registrar estado Git e alterações preexistentes, conferir tipos reais de IDs e migrations, e verificar que as dependências estão presentes antes de editar.
- [x] 1.2 Adicionar schemas e DTOs compartilhados de matérias, assuntos conhecidos, plano manual e `subjectId` opcional em tarefas/sessões; verificar com testes de contrato para enumerações, limites, datas, frações de hora e ausência de vínculo.

## 2. Persistência e API de matérias

- [x] 2.1 Criar migrations versionadas de matérias, assuntos conhecidos e itens de plano, com FKs, índices e `synchronize: false`; verificar aplicação e rollback em MySQL isolado.
- [x] 2.2 Implementar repositories e services de CRUD de matérias com validação, transação para atualização de assuntos conhecidos e filtro por usuário; verificar em testes HTTP com duas contas, entradas inválidas, paginação e IDs alheios.
- [x] 2.3 Implementar CRUD e reordenação atômica dos itens de plano, com status manual e autorização por matéria/usuário; verificar adição, edição, exclusão, ordem persistida, sequência inválida e isolamento em MySQL real.

## 3. Integração opcional

- [x] 3.1 Criar migration para `subject_id` anulável em tarefas e sessões Pomodoro com `ON DELETE SET NULL`; verificar que a exclusão de matéria preserva tarefas, tempo ativo e blocos em testes de banco.
- [x] 3.2 Expor validação pública de matéria própria e integrar criação/edição/desassociação de tarefa sem acesso cruzado a repositories; verificar tarefa sem matéria, ID alheio, matéria excluída e módulo de matérias desativado.
- [x] 3.3 Integrar seleção de matéria no início da sessão Pomodoro e filtro opcional por matéria, mantendo o vínculo histórico fixo; verificar sessões livres, tarefa sem matéria, combinação incompatível, edição posterior da tarefa e totais preservados.

## 4. Interface e preferências

- [x] 4.1 Criar página protegida de matérias com lista, detalhe, formulários e plano manual ordenável por controles de teclado; verificar estados vazio/loading/erro/sucesso, confirmação de exclusão e layout a 320 px.
- [x] 4.2 Integrar seletores opcionais de matéria em tarefas e Pomodoro e aplicar a preferência de matérias à navegação, widgets, páginas e API; verificar desativação/reativação com dados preservados e uso independente dos outros módulos.
- [x] 4.3 Verificar que a preferência de IA desativada mantém todo o CRUD e plano manual operáveis e não gera chamada de IA; cobrir o fluxo em teste web e HTTP.

## 5. Verificação final

- [x] 5.1 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, além de `openspec validate add-subjects --strict`; revisar falhas concretas e confirmar os critérios das specs.
- [x] 5.2 Revisar diff e alterações preexistentes, adicionar somente arquivos/hunks deste apply, executar `git diff --cached --check` e criar exatamente um commit de conclusão com implementação e `tasks.md` final; confirmar hash e arquivos incluídos.
