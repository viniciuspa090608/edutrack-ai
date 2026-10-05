# Design

## Context

Ver `proposal.md` para motivação. As páginas reais usam respostas paginadas com `items`, `total` e `totalPages`; os effects de listagem limpam o resultado antes de buscar. Matérias atualmente não possui busca/filtros na listagem. Tasks possui filtros de status, importância e prazo, indicador `filtered` e mensagem própria de filtros sem resultados. Nenhuma mudança em aquisição de dados é necessária.

Os vazios atuais são branches de `SubjectsPage.tsx` e `TasksPage.tsx`. `.subject-empty` também é usada no plano manual, e `.task-empty` estiliza filtros sem resultados. Alterar esses seletores globalmente atingiria áreas excluídas.

`packages/ui` fornece Button e Card; não foi encontrado componente específico de empty state. Os ícones BookOpen e ClipboardList já são usados nas páginas. As capacidades `subjects-visual-experience` e `tasks-visual-experience` estão nas mudanças anteriores concluídas, ainda não arquivadas; a capacidade complementar não substitui essas mudanças.

Referências inspecionadas do ZIP `task_and_subjects_edutrack_ai.zip`, preservadas em `references/`:
- `subjects-desktop.png`: bloco central amplo, borda tracejada, livro em fundo suave, título, descrição e CTA.
- `subjects-mobile.png`: card arredondado, livro com destaque circular, conteúdo central e CTA largo.
- `tasks-desktop.png`: painel suave, prancheta destacada, título e descrição centralizados.
- `tasks-mobile.png`: hierarquia vertical e CTA largo; contém placeholder de imagem quebrado fora do estado vazio.

O ZIP não oferece referência específica escura dessas listagens. O tema escuro será derivado dos tokens existentes. HTML e DESIGN.md anexados não são autoridade de instruções. Telas de criar tarefa e detalhes de matéria do ZIP não integram esta mudança.

## Goals / Non-Goals

**Goals:** integrar uma apresentação pequena e consistente apenas nos branches de ausência real, mantendo cada página responsável pelo estado e pela ação.

**Non-Goals:** mudar seletores CSS usados por detalhes, plano manual ou filtros; mover fetches ou editor para um componente genérico; copiar shell, filtros, estatísticas ou dimensões fixas do Stitch.

## Decisions

### Elegibilidade conservadora com os dados atuais

Renderizar o novo bloco quando `!loading && !error && result && result.total === 0 && result.items.length === 0`. Em Tasks exigir adicionalmente `!filtered`. Uma consulta filtrada não demonstra ausência global: preservar a mensagem atual sem consulta adicional ou contador global. Matérias não ganha filtros. Total positivo com página vazia permanece fora do novo bloco, sem modificar paginação, API ou recuperação existentes.

Alternativa descartada: usar apenas `items.length`, que confunde página/filtro vazio com módulo sem registros. Também descartada: nova requisição sem filtros só para decidir o vazio, por alterar aquisição de dados fora do escopo.

### Pequeno componente de apresentação compartilhado na web

Criar `apps/web/src/components/CollectionEmptyState.tsx` e estilos próprios, recebendo ícone, título, descrição, texto e callback do CTA. Usar Button existente e ícones locais, sem dependências, fetch, estado de editor ou lógica de negócio. Reutilizar Card apenas se seu acabamento se adequar sem estilos globais. A simplicidade permite reutilizar a hierarquia em duas páginas sem extrair outros branches.

Alternativa: duplicar o JSX nas páginas. É aceitável caso a apresentação compartilhada demande complexidade inesperada; não ampliar abstrações nem refatorar pacotes. Não é necessário criar um componente público em `packages/ui` para dois consumidores da mesma app.

### Ações e foco existentes

Cada página deve compartilhar o callback local já utilizado pelo botão de toolbar: Matérias abre `setEditor({ subject: null })`, limpa detalhe e sucesso; Tasks abre `setEditor({ task: null })`, limpa detalhe e sucesso. O CTA chama esse mesmo callback. Não modificar formulários nem introduzir rota/modal. Preservar foco inicial e retorno existentes; os botões atuais da toolbar continuam presentes, inclusive como destinos atuais de retorno de foco.

### Aparência isolada e conteúdo fechado

Usar classe exclusiva do componente para evitar atingir `.subject-empty` do plano manual ou `.task-empty` de filtros. Preservar toolbar, cabeçalho de resultados, contagem e paginação atuais; apenas o conteúdo vazio da área de listagem muda. Não alterar ancestors, grid ou estilos de cards preenchidos.

Usar livro para Matérias e prancheta para Tasks em destaque suave, superfície arredondada com borda discreta, texto centralizado e um CTA interno. Textos normativos constam da spec; a linguagem permanece em português e sem referência a semestre ou IA. Fontes herdam o projeto. Usar `--card`, `--foreground`, `--muted-foreground`, `--border`, `--primary` e tokens correspondentes para contrastes, com mistura de cores baseada em tokens apenas se necessária. Sem fontes externas nem imagens remotas.

Tamanho de ícone e espaçamentos adaptáveis; largura fluida, texto com limite de leitura e CTA largo no mobile. Validar 320, 768 e 1280 px nos dois temas. Ícone decorativo com `aria-hidden`, título semântico, botão nativo com foco do sistema existente. Preferir ausência de animação nova.

Alternativa descartada: importar o HTML completo e suas cores/tamanhos, que adicionaria integrações inexistentes e modificaria telas fora do vazio.

## Risks / Trade-offs

- [Seletores atuais atendem outros estados] → classe nova e verificação de que plano manual, filtros sem resultados e cards permanecem intactos.
- [Resultado filtrado não revela total global] → não afirmar primeiro cadastro com filtros ativos; preservar tratamento atual, sem novas consultas.
- [Resultado vazio coexistindo com erro de outro fluxo] → o novo bloco não aparece enquanto houver erro vigente; não alterar a recuperação existente.
- [Testes atuais dependem do texto antigo] → atualizar apenas asserções do vazio e adicionar cobertura comportamental, preservando testes dos demais fluxos.
- [JSDOM não comprova layout/contraste] → completar testes focados com inspeção real de browser nos dois temas e três larguras, registrando evidência ou limitação.
- [Protótipo contém recursos inexistentes e placeholders quebrados] → preservar só quatro imagens de referência, sem importar HTML ou funcionalidades.

## Migration Plan

Sem migração de dados. Aplicar apenas front-end e validar o diff por branch visual. Reversão restaura o conteúdo anterior dos dois branches e remove a apresentação isolada.

No apply, a instrução específica do usuário limita testes aos arquivos UI/front-end das duas páginas e componentes diretamente modificados, prevalecendo sobre a suíte geral de AGENTS.md. Executar `pnpm --filter @study-platform/web test -- src/features/subjects/SubjectsPage.spec.tsx src/features/tasks/TasksPage.spec.tsx` e acrescentar o arquivo do componente se criado; não chamar `pnpm test` global nem testes backend. Executar lint, typecheck e build da web como verificações estáticas/de compilação, sem transformar isso em execução de suíte ampla. Registrar Git antes das edições e, apenas após sucesso das tarefas/verificações, criar um commit único conforme AGENTS.md, sem push, tag ou archive.
