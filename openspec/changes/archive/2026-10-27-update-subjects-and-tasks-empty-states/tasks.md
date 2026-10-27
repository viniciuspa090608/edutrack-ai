# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD e `git status --short` antes de editar; identificar alterações preexistentes e verificar que o plano de arquivos se restringe às duas páginas, apresentação do vazio, estilos isolados, testes relacionados e artefatos desta mudança.

## 2. Apresentação dos estados vazios

- [x] 2.1 Criar a apresentação mínima compartilhada na web conforme design, reutilizando Button e ícones existentes, com título, descrição e um CTA interno; verificar que não possui fetch, lógica de negócio, dependências novas ou importação de HTML do Stitch.
- [x] 2.2 Aplicar estilos exclusivos com tokens de tema, tipografia herdada, destaque do ícone, borda/superfície arredondada, foco visível e dimensões fluidas; verificar no diff que `.subject-empty` do plano e `.task-empty` de filtros não foram alteradas globalmente.
- [x] 2.3 Integrar o vazio de Matérias somente após sucesso sem loading/erro e com `items` vazio e `total === 0`, usando o conteúdo da spec e a ação local de criação existente; verificar que o CTA abre o mesmo formulário e preserva validação, cancelamento e foco.
- [x] 2.4 Integrar o vazio de Tasks com as mesmas condições mais ausência de filtros restritivos, usando o conteúdo da spec e a ação local de criação existente; verificar que o CTA abre o mesmo editor e que resultado filtrado vazio mantém mensagem e limpar filtros atuais.

## 3. Validação focada de UI/front-end

- [x] 3.1 Atualizar asserções antigas e adicionar cobertura nas specs das duas páginas para resposta vazia real, presença de título/descrição/CTA e ausência do novo bloco com dados, loading e erro; verificar resposta pendente controlada, falha/retry e atualização após primeiro cadastro sem esconder falhas.
- [x] 3.2 Cobrir Tasks com filtro sem resultados e limpeza de filtros, além de página vazia com total positivo nas duas páginas; verificar que não há alegação de primeiro cadastro e que filtros/paginação existentes permanecem intactos, sem novas consultas.
- [x] 3.3 Cobrir ativação por teclado dos dois CTAs, abertura do cadastro existente e preservação do foco ao cancelar; se criar spec do componente compartilhado, limitar sua cobertura a semântica, conteúdo e callback diretamente relevantes.
- [x] 3.4 Executar somente `pnpm --filter @study-platform/web test -- src/features/subjects/SubjectsPage.spec.tsx src/features/tasks/TasksPage.spec.tsx`, acrescentando apenas a spec do componente diretamente modificado se houver; registrar resultado sem executar suíte global, testes backend ou testes não relacionados.
- [x] 3.5 Inspecionar Matérias e Tasks vazias em browser nos temas claro/escuro e larguras 320, 768 e 1280 px; verificar contraste, quebra de texto, tamanho do ícone, CTA acessível, foco e movimento reduzido, registrando evidência de cada combinação e eventuais limitações reais.
- [x] 3.6 Comparar a apresentação com dados antes/depois e inspecionar filtros sem resultados, loading e erro; verificar que cards, listas, toolbar, filtros, ordenação, contagem, paginação, detalhes, plano manual e formulários preservam layout e comportamento atuais.
- [x] 3.7 Executar `pnpm --filter @study-platform/web lint`, `pnpm --filter @study-platform/web typecheck` e `pnpm --filter @study-platform/web build`; verificar sucesso das checagens da web sem executar testes globais ou de backend.

## 4. Conclusão e versionamento

- [x] 4.1 Revisar o diff final contra a spec e o estado inicial do Git, verificar ausência de alterações em APIs/stores/backend e de recursos inexistentes do Stitch, concluir o `tasks.md` e validar `openspec validate update-subjects-and-tasks-empty-states --strict`; não concluir apply com tarefa ou verificação pendente/falha.
- [x] 4.2 Adicionar somente arquivos/hunks desta mudança e `tasks.md` final, revisar `git diff --cached` e executar `git diff --cached --check`; após sucesso, criar exatamente um commit `[update] atualizar estados vazios de matérias e tarefas`, confirmar hash e arquivos com `git show --stat --oneline HEAD` e informar o resultado, sem commit vazio, push, tag ou archive.
