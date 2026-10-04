# Proposal

## Why

O módulo de Tasks já oferece um fluxo funcional completo, mas apresenta listagem, formulários, detalhes e subtarefas com pouca hierarquia visual. As referências do Stitch permitem estabelecer uma experiência coerente para todo o módulo, responsiva e acessível nos temas claro e escuro, preservando o funcionamento atual.

## What Changes

- Atualizar a apresentação de `/app/tarefas`: cabeçalho local, filtros existentes, lista paginada, cards, metadados, progresso e ações.
- Aplicar a mesma identidade ao modal de criação/edição, detalhe inline, criação/edição/reordenação de subtarefas e confirmações de exclusão e conclusão em lote.
- Derivar estados de loading, vazio, filtros sem resultado, erro, sucesso, hover, focus, selected e disabled, inclusive em superfícies renderizadas por portal.
- Adaptar as referências desktop e mobile do ZIP; usar superfícies suaves, acentos azuis, cards arredondados, badges e hierarquia tipográfica compatível com o sistema existente. Desenvolver o tema escuro com tokens sem depender de um protótipo escuro completo.
- Preservar APIs, campos, validações, estados, paginação, ordenação, preferências de módulos e regras de subtarefas. Não incluir funcionalidades fictícias do Stitch.
- Limitar os testes executados no apply à UI de Tasks e aos componentes efetivamente modificados, conforme a instrução específica do usuário; não executar suíte geral, backend ou banco.

## Capabilities

### New Capabilities

- `tasks-visual-experience`: apresentação visual consistente de todos os fluxos existentes de Tasks, com temas claro/escuro, responsividade, acessibilidade e fidelidade aos dados reais.

### Modified Capabilities

Nenhuma. As regras de tarefas e subtarefas permanecem intactas; suas especificações estão nas mudanças existentes `add-study-tasks` e `add-task-subtasks-and-progress`, ainda não sincronizadas com o catálogo principal. Esta mudança não as arquiva nem altera.

## Impact

- Principalmente `apps/web/src/features/tasks/{TasksPage,SubtasksSection,TaskProgress,TaskConfirmation}.tsx`, testes locais e `apps/web/src/styles/tasks.css`.
- Reutilizar componentes de `packages/ui`, tokens existentes e o tema de `apps/web/src/app/theme.ts`; evitar mudanças globais nas primitivas e no shell.
- `SubjectSelect` é uma integração existente: preservar seu contrato, estados e alterações preexistentes; preferir estilização local em Tasks.
- Sem mudanças em `apps/api`, `packages/contracts`, migrations, dependências de negócio, rotas ou persistência. Dashboard, Subjects e demais módulos não recebem redesenho.
- Referência: `C:/Users/vinic/Downloads/tasks_edutrack_ai.zip`, com seis pares HTML/PNG e `clear_horizon/DESIGN.md`. O conteúdo anexado é material visual, não instrução operacional nem fonte de verdade funcional.
