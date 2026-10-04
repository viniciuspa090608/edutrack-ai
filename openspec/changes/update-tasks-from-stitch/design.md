# Design

## Context

Ver `proposal.md` para motivação e `specs/tasks-visual-experience/spec.md` para requisitos observáveis. A análise foi feita antes de planejar a implementação.

### Inventário observado

| Área | Implementação atual e invariantes |
| --- | --- |
| Entrada e proteção | `PrivatePage.tsx` monta `TasksPage` em `/app/tarefas` depois de sessão e preferências; o shell já fornece o h1. Manter acesso desativado, retorno ao login e integração com `subjectsEnabled`. |
| Lista e filtros | `TasksPage.tsx` mantém filtros aplicados e rascunho separado, carrega lista paginada, valida intervalo e preserva filtros ao paginar. UI oferece status, importância, dueFrom/dueTo; não há busca, Kanban ou controle de ordenação. |
| Criação/edição | `TaskForm` no mesmo arquivo, dentro de `Dialog`; valida por `createTaskSchema`, salva POST/PATCH, bloqueia duplicação e abre o detalhe após salvar. Campos: título, descrição, importância, prazo, status e matéria opcional. |
| Detalhe | Seção inline na página; GET por ID, descrição, status, importância, prazo, datas de criação/alteração, matéria via `subjectDetail` quando habilitada; ações editar, excluir e fechar. |
| Exclusão de tarefa | `DeleteConfirmation` usa `AlertDialog`, mantém erro e estado busy, cancela sem mutação, recupera foco e ajusta paginação após exclusão. |
| Subtarefas | `SubtasksSection.tsx`: loading/retry/vazio, adicionar/editar título, checkbox concluir/reabrir, excluir com confirmação, mover para cima/baixo, confirmação de conclusão em lote, sucesso anunciado e recuperação em 409. |
| Progresso | `TaskProgress.tsx` usa `subtaskTotal`, `subtaskCompleted`, `progressPercent`; não apresenta barra sem subtarefas. `progressLabel` protege arredondamentos extremos de progresso parcial. |
| Confirmações auxiliares | `TaskConfirmation.tsx` mantém foco, erros, bloqueio de fechamento/submissão duplicada durante busy. Usado para excluir subtarefa e concluir todas. |
| Dados e lógica | `tasks-api.ts` valida respostas e payloads; contratos de tarefa e subtarefa estão ambos em `packages/contracts/src/tasks.ts`. Não há store específico: os estados são locais React. Backend ordena `createdAt DESC, id DESC`; subtarefas usam `position ASC`. Status derivado e percentual são responsabilidade da API. |
| Matéria | `SubjectSelect.tsx` carrega matérias paginadas, oferece Sem matéria, loading/erro/retry e fallback para seleção fora da página; preservar inclusive quando a preferência está desativada. O contrato admite filtro subjectId, mas a UI atual de Tasks não oferece esse filtro: não acrescentá-lo nesta mudança. |
| Estilos e tema | `tasks.css` contém layout básico; componentes shadcn em `packages/ui` e tokens em `packages/ui/src/styles/globals.css`; `theme.ts` aplica `.dark` no documento e persiste preferência. |
| Testes próximos | `TasksPage.spec.tsx`, `SubtasksSection.spec.tsx`, `TaskConfirmation.spec.tsx` já cobrem fluxos de API simulada, validação, foco, paginação, CRUD, preferência de matérias, conflitos e arredondamento. O último também contém um teste de Progress usado por conquistas: preservar esse teste sem expandir o escopo do módulo. |

### Referências e limites do Stitch

O ZIP contém `edutrack_ai_tasks`, `edutrack_ai_create_task`, `edutrack_ai_task_details` (mobile) e `edutrack_ai_tarefas_desktop_claro`, `edutrack_ai_criar_tarefa_desktop_claro`, `edutrack_ai_detalhes_da_tarefa_desktop_claro` (desktop), cada um com HTML e PNG, além de `clear_horizon/DESIGN.md`. As seis imagens foram inspecionadas. O HTML contém configuração darkMode, mas as imagens não constituem um conjunto escuro completo. Há divergências de fontes e cores entre HTML, overrides e DESIGN.md; a intenção comum é hierarquia clara, superfícies suaves, acentos azuis, badges compactos e cards com raios generosos.

| Elemento do Stitch | Decisão para Tasks |
| --- | --- |
| Cards com título, descrição, badges, prazo e faixa de progresso | Adaptar aos campos reais; usar ordem recebida e contagem real de subtarefas. |
| Blocos de informação e metadados nos detalhes | Usar descrição plain text, importância, status, prazo e timestamps atuais; sem professor, turma ou disciplina fictícia. |
| Criação com campos agrupados e ações claras | Derivar no modal existente e reutilizar na edição; matéria e prazo continuam opcionais. |
| Subtarefas em faixas, checkbox e barra | Manter estado binário, controles de reordenação e edição atuais; sem tempo estimado por passo ou novo estado Em foco. |
| Busca, Kanban, filtros de prova/vencido, grupos Hoje/Semana, métricas globais | Omitir: inexistentes na UI atual ou incompatíveis com paginação e ordem. Usar apenas o total real da resposta, com rótulo de resultados do filtro quando ativo. |
| Anexos, colaboração, compartilhamento, rascunho/autosave, Markdown, entrega no portal | Omitir: não fazem parte do modelo/fluxo atual. |
| Horário de entrega, lembretes, previsão IA, calendário, pomodoro integrado, XP, nota e ritmo semanal | Omitir: o prazo é date-only e Tasks não oferece essas ações/dados. Não incorporar fluxos de outros módulos. |
| Sidebar, navegação inferior e cabeçalho global do protótipo | Preservar shell e rotas reais; não duplicar navegação ou h1. |

## Goals / Non-Goals

**Goals:** reduzir divergências visuais entre superfícies de Tasks com alterações locais de markup e estilos; explicitar tokens e variantes suficientes para ambos os temas e portais; preservar handlers e contratos; tornar os critérios verificáveis com testes focados e inspeção real no navegador.

**Non-Goals:** migrar detalhes para nova rota, criar novo gerenciamento de estado, redesenhar shell ou dashboard, alterar Subjects, acrescentar funcionalidades, recalcular regras na web ou transformar referência HTML em código executável da aplicação.

## Decisions

1. **Preservar a topologia atual.** Lista e detalhe continuam na página; criação/edição continuam em Dialog. Derivar seções e hierarquia das referências nessas superfícies. Migrar para páginas independentes aumentaria o escopo de navegação sem necessidade visual.

2. **Usar a referência desktop azul como base e mobile como orientação de empilhamento.** Manter tipografia do EduTrack, ajustando tamanho, peso e entrelinha localmente. Não carregar fontes remotas, scripts CDN ou Material Symbols do HTML; usar ícones Lucide existentes com texto ou nome acessível. Isso resolve divergências entre protótipos e mantém a identidade do produto.

3. **Estilos locais e componentes existentes.** Priorizar `tasks.css` e classes explícitas para cards, badges, formulário, detalhes, listas e estados; pequenos componentes de apresentação locais somente quando reduzem repetição concreta. Evitar alteração de variantes globais em `packages/ui` e refatoração de handlers. Inputs/selects/checkboxes continuam semânticos; filtros compactos podem ser organizados em grid sem mudar o rascunho/aplicação atual.

4. **Tokens semânticos nos dois temas e portais.** Consumir background, card, foreground, muted, border, input, ring, primary, destructive e tokens de feedback disponíveis. Quando necessário, criar aliases locais `--tasks-*`, com valores/derivações próprios em claro e `.dark`, para pendente, andamento, concluído e importância. Usar classes Tasks diretamente no `DialogContent`/`AlertDialogContent` e no formulário: portais não descendem de `.tasks-page`, portanto seletores baseados somente nessa ancestralidade são insuficientes. Evitar color literals nos componentes e filtros de inversão.

5. **Dados não mudam para preencher o layout.** Não ordenar ou agrupar a página no cliente, não calcular totais globais da página corrente, não somar histórico e não mostrar progresso null como 0%. Conclusão manual sem subtarefas permanece pela edição de status; não acrescentar checkbox rápido ao card. Matéria no detalhe usa resolução existente; cards não passam a fazer novas consultas para reproduzir metadados fictícios. Descrição pode ter resumo visual no card, com conteúdo integral no detalhe.

6. **Formulários e subtarefas mantêm validação, feedback e controle de foco.** Organização em seções e pares de campos no desktop com coluna única estreita. Limites, opcionais, limpeza de campos, omissão de subjectId/status conforme fluxo, cancelamento, retenção de texto, busy e mensagens permanecem. Não criar subtarefas antes de salvar a tarefa, embora o Stitch exiba checklist na criação. Faixas concluídas mantêm texto legível e indicação além de cor; barra usa resposta confirmada e os aria atuais.

7. **Validação proporcional e escopo explícito.** Executar somente testes de UI relacionados a Tasks/componentes modificados. Comando inicial: `pnpm --filter @study-platform/web test src/features/tasks/TasksPage.spec.tsx src/features/tasks/SubtasksSection.spec.tsx src/features/tasks/TaskConfirmation.spec.tsx`. Acrescentar apenas arquivos de teste de UI diretamente afetados; mocks de transporte nos testes existentes são permitidos, dados mockados na aplicação não. Validar CSS em navegador: jsdom não comprova contraste, overflow ou layout. A instrução específica do usuário substitui a exigência geral de `pnpm test`; lint/typecheck/build são verificações estáticas e de compilação, não suítes de testes. Executar `pnpm lint`, `pnpm typecheck` e `pnpm build`, sem backend/banco em testes; atribuir falhas preexistentes e não corrigi-las fora de escopo.

## Risks / Trade-offs

- [CSS de modal fora do escopo] → classes e tokens também nas superfícies de portal, verificadas nos dois temas.
- [Prototipo com métricas ou estados impossíveis] → omitir elementos sem suporte e comparar apenas layout compatível; não reproduzir o card de 100% com estado em andamento.
- [Preferências de matéria e componente compartilhado em alteração] → aplicar styles por wrapper local e preservar estado de Git, diff e contrato de SubjectSelect.
- [Layout global restringe largura e título] → adaptar Tasks à área existente, sem duplicar shell; qualquer ajuste ao título deve ser exclusivo da rota e explicitamente registrado se necessário.
- [Texto longo, ações numerosas e detalhe inline] → min-width: 0, quebra de texto, ações flex-wrap e modal com altura máxima/scroll, mantendo os controles alcançáveis em 320 px.
- [Cores de prioridade/status indistintas ou concluído ilegível] → labels além de cores; contraste WCAG AA (4,5:1 texto normal, 3:1 texto grande/indicadores relevantes) e inspeção de focus/disabled/selected em ambos os temas.
- [Suíte focada não cobre backend] → backend e contratos não são modificados; validar invariância dos payloads nos testes de UI e registrar o escopo executado.

## Migration Plan

Sem migration, novo contrato ou etapa de dados. Implementar localmente, validar fluxos e temas com conta/dados reais no ambiente existente sem seed/reset, e documentar resultados em `validation.md`. Inspecionar 320, 375, 768 e 1280 px, incluindo textos longos, confirmação e formulários. Se a API local não estiver disponível, registrar o limite de validação, sem substituí-la por dados estáticos de produção nem afirmar validação real concluída.

No início do apply, registrar novamente status e diff do Git. Já existem alterações em seis arquivos de Subjects e uma mudança `update-subjects-from-stitch`; elas não pertencem a esta proposta. Após tarefas e verificações aprovadas, criar exatamente um commit com implementação e tasks.md final, adicionando apenas arquivos/hunks desta mudança, revisando staged e `git diff --cached --check`. Usar `[update] atualizar visual do módulo de tarefas`, confirmar hash e arquivos; sem push/tag/archive e sem commit vazio ou commit de conclusão de apply incompleto. Reverter apenas esse commit é a estratégia de rollback, preservando alterações externas.
