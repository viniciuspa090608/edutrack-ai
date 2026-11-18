# Proposal

## Why

Os filtros, detalhes e cards do Dashboard apresentam distribuição de espaço e rolagem que dificultam consultar os estudos. As impressões separadas de Progresso e Estatísticas também impedem obter uma visão completa em um único documento.

## What Changes

- Alinhar busca e botões de Disciplinas em uma linha; organizar Tarefas com status, importância e duas datas na primeira linha e busca maior com botões na segunda, adaptando em telas estreitas.
- Mostrar o percentual oficial dos estudos em cada card de disciplina, distinguindo zero de progresso não calculável.
- Exibir somente a entidade selecionada e seus registros relacionados nos detalhes; ocultar filtros e listagens gerais e alinhar Voltar à direita do título.
- Corrigir rolagem interna de Disciplinas no Dashboard; compactar Pomodoro e transferir o espaço liberado para a lista de Flashcards.
- Mostrar conquistas obtidas no card Progresso, com gap de 4 px, rolagem vertical localizada e cor própria por conquista, compartilhada com a aba Progresso.
- Fazer ambos os botões de impressão gerarem o mesmo relatório: primeiro todo o conteúdo de Progresso, depois Estatísticas. Usar o PDF fornecido como referência visual, com cores do tema claro e favicon oficial como logo.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `subjects-visual-experience`: filtros alinhados, percentual nos cards e detalhes exclusivos.
- `tasks-visual-experience`: filtros em duas linhas e detalhes exclusivos.
- `study-subjects`: resumo oficial de progresso por disciplina disponível na listagem.
- `dashboard-presentation`: rolagem, redistribuição de espaço e prévia de conquistas.
- `progress-and-achievements-visual-experience`: identidade de cor por conquista compartilhada.
- `study-report-printing`: impressão unificada, identidade clara e composição baseada na referência.

## Impact

Afeta SubjectsPage, TasksPage, DashboardPage, DashboardPomodoro, StudyProgressPage, AnalyticsPage, ProgressPresentation e seus estilos/testes. A listagem de disciplinas precisará expor progresso em contracts e API reutilizando a regra oficial já usada por SubjectsService.dashboardSummary; Dashboard já recebe conquistas em streak. Preservar isolamento por usuário, preferências, rotas e regras de progresso. Sem nova biblioteca de PDF prevista: manter impressão do navegador com composição única. Somente artefatos de planejamento nesta etapa.
