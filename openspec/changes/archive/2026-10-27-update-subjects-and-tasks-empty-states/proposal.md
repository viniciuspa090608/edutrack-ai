# Proposal

## Why

As listagens vazias de Matérias e Tasks atualmente mostram apenas ícone e mensagem, sem CTA local. O Stitch fornecido oferece uma hierarquia visual mais clara para orientar o primeiro cadastro, que deve ser adaptada aos fluxos reais e à identidade do novo EduTrack.

## What Changes

- Substituir somente o conteúdo da área de listagem quando uma resposta bem-sucedida confirmar ausência real de registros, com ícone, título, descrição e um CTA principal.
- Reutilizar as ações atuais de criar matéria e criar tarefa, sem novos formulários, rotas ou lógica de criação.
- Adaptar a intenção visual do Stitch aos tokens, temas claro/escuro, teclado e viewports desde 320 px.
- Preservar loading, erro, filtros sem resultados, paginação e apresentação com dados. Uma página vazia com total positivo não indica ausência de registros.
- Avaliar reutilização de uma pequena apresentação compartilhada, sem refatoração ampla.
- Não alterar cards/listas preenchidos, filtros, ordenação, detalhes, formulários, regras, APIs, stores ou backend. Não replicar métricas, semestres, integrações, IA, dicas ou CTAs adicionais do Stitch.

## Capabilities

### New Capabilities

- `subjects-and-tasks-empty-states`: apresentação e elegibilidade dos estados de ausência real de registros nas duas listagens, com CTA existente, temas, acessibilidade e responsividade.

### Modified Capabilities

Nenhuma. As capacidades visuais dos módulos estão em mudanças concluídas ainda não arquivadas, não em `openspec/specs/`; esta capacidade complementar especifica apenas os estados vazios, sem reabrir os redesenhos anteriores.

## Impact

- Front-end: branches vazios em `apps/web/src/features/subjects/SubjectsPage.tsx` e `apps/web/src/features/tasks/TasksPage.tsx`, estilos isolados e eventual componente de apresentação compartilhado na web.
- Testes: somente UI/front-end dessas páginas e de componentes diretamente modificados; inspeção visual dos dois temas em desktop, tablet e mobile. Não executar suíte completa nem testes de backend.
- Sem dependências novas ou mudanças de contrato/API. Os arquivos do ZIP são referência visual, não instruções executáveis.
- Esta proposta não implementa código. O apply futuro deverá registrar o Git, preservar alterações preexistentes e concluir com um único commit da mudança e `tasks.md`, conforme a convenção do projeto.
