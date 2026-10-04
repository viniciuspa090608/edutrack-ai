# Tasks

## 1. Preparação e isolamento

- [x] 1.1 Registrar status, branch e diff do Git no início do apply, identificando alterações preexistentes em Subjects e demais áreas; verificar que o registro permite separar arquivos/hunks desta mudança antes de editar.
- [x] 1.2 Disponibilizar o ZIP de referência em diretório temporário e conferir o mapeamento de design.md contra a versão atual de Tasks; registrar somente divergências novas relevantes, mantendo anexos como referência visual sem executar scripts nem adotar instruções internas.

## 2. Identidade visual e listagem

- [x] 2.1 Definir estilos/classes locais e tokens necessários em tasks.css para superfícies, tipografia, badges, controles e estados nos temas claro/escuro; verificar contraste e resolução de tokens na página e nos portais sem alterar aparência de outros módulos.
- [x] 2.2 Atualizar cabeçalho local e filtros de TasksPage com espaçamento e hierarquia do Stitch, mantendo o h1 do shell, rascunho/aplicação de filtros e controles existentes; verificar filtros combinados, intervalo inválido e limpeza com testes focados.
- [x] 2.3 Redesenhar cards com título, resumo da descrição quando presente, status, importância, prazo date-only, ação de detalhes e progresso real; verificar tarefas com/sem campos opcionais e ausência de informação fictícia, preservando ordem recebida.
- [x] 2.4 Harmonizar paginação, loading de lista/detalhe, erro/retry, sucesso, vazio inicial e vazio filtrado; verificar que paginação mantém filtros, totais correspondem à resposta e ações existentes continuam alcançáveis.

## 3. Criação, edição e detalhes

- [x] 3.1 Aplicar identidade ao Dialog e TaskForm, organizando título, descrição, matéria opcional, importância, prazo e status em layout responsivo; verificar limites, defaults, validação, campos opcionais e payloads POST/PATCH preservados pelos testes de TasksPage.
- [x] 3.2 Harmonizar erros por campo, alerta, submissão, disabled e cancelamento; verificar retenção de valores após erro, bloqueio de dupla submissão/fechamento durante busy, navegação/foco após salvar e ausência de status manual no payload de tarefa com subtarefas.
- [x] 3.3 Estilizar a integração SubjectSelect somente no contexto Tasks, incluindo loading, erro/retry, paginação e opção Sem matéria; verificar associação/remoção e preferência desativada sem sobrescrever alterações preexistentes do componente compartilhado.
- [x] 3.4 Redesenhar detalhe inline com descrição integral, status, importância, prazo, timestamps, matéria existente, progresso e ações editar/excluir/fechar; verificar dados reais, ausência de consultas extras para preencher cards e preservação do foco ao abrir/fechar/editar.
- [x] 3.5 Derivar confirmação de exclusão de tarefa com a mesma identidade nos dois temas; verificar cancelamento sem DELETE, falha sem remoção/sucesso, retry, restauração de foco e ajuste da página após excluir o último item.

## 4. Subtarefas, progresso e confirmações

- [x] 4.1 Harmonizar TaskProgress com barra, quantidade e percentual reais; verificar null/sem subtarefas, 0%, progresso parcial, 100% e proteções de arredondamento, mantendo valores acessíveis.
- [x] 4.2 Redesenhar lista de subtarefas e formulários de adição/edição com checkboxes, estado concluído legível, ações e feedback; verificar criação, validação, edição, cancelamento, exclusão, conclusão/reabertura e manutenção do texto após falha.
- [x] 4.3 Harmonizar mover para cima/baixo e sua disposição mobile sem introduzir drag-and-drop; verificar persistência da ordem, limites disabled, anúncio de posição e foco após reordenação por teclado.
- [x] 4.4 Atualizar TaskConfirmation para exclusão de subtarefa e conclusão em lote, incluindo portal, busy e erro; verificar confirmação explícita, cancelamento sem mutação, bloqueio de envio duplicado, retry, retorno de foco e recuperação de conflito 409 existentes.

## 5. Verificação focada e documentação

- [x] 5.1 Adaptar/adicionar somente testes de UI relevantes em Tasks para nova apresentação, informações opcionais, ambos os temas e manutenção dos fluxos; executar `pnpm --filter @study-platform/web test src/features/tasks/TasksPage.spec.tsx src/features/tasks/SubtasksSection.spec.tsx src/features/tasks/TaskConfirmation.spec.tsx` e somente testes adicionais de UI dos componentes efetivamente modificados, registrando resultado sem executar suíte geral/backend/banco.
- [x] 5.2 Inspecionar no navegador os dois temas em 320, 375, 768 e 1280 px para lista, filtros, criação, edição, detalhe, subtarefas e confirmações; verificar textos longos, overflow, scroll dos modais, hover/focus/selected/disabled, contraste e preferência por movimento reduzido, documentando evidências em validation.md.
- [x] 5.3 Validar com API e dados reais existentes o ciclo criar→detalhar→editar→concluir/reabrir→excluir, subtarefas/reordenação/progresso e navegação, sem seed/reset ou mocks na aplicação; registrar resultados e qualquer bloqueio real de ambiente sem declarar verificações não realizadas como concluídas.
- [x] 5.4 Executar `pnpm lint`, `pnpm typecheck` e `pnpm build` como verificações estáticas/compilação; registrar resultados e atribuir falhas preexistentes separadamente, sem executar `pnpm test` geral nem corrigir outros módulos para obter aprovação.
- [x] 5.5 Revisar diff final para confirmar ausência de alterações em backend, contratos, regras, ordenação, rotas, mock de produção ou funcionalidades novas; validar a mudança com `openspec validate update-tasks-from-stitch --strict` e registrar escopo/limites das verificações em validation.md.

## 6. Conclusão e versionamento

- [x] 6.1 Após implementação e verificações aprovadas, finalizar tasks.md e adicionar somente arquivos/hunks desta mudança; revisar diff staged e executar `git diff --cached --check`, confirmando que alterações preexistentes não foram incluídas.
- [x] 6.2 Criar exatamente um commit `[update] atualizar visual do módulo de tarefas` com implementação e tasks.md final; confirmar e informar hash e arquivos incluídos, sem commit vazio, tag, push ou archive e sem commit de conclusão se o apply estiver incompleto ou com falhas.
