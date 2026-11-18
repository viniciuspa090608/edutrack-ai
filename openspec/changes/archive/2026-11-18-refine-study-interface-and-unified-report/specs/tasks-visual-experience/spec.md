## ADDED Requirements

### Requirement: Filtros de tarefas organizados em duas linhas
Em largura suficiente, os filtros SHALL apresentar status, importância, Prazo de e Prazo até na primeira linha. Buscar por título, Aplicar filtros e Limpar filtros SHALL ocupar a segunda linha, com o input mais largo que cada botão. SHALL preservar validações, consulta explícita, limpeza e paginação e adaptar as linhas desde 320 px sem overflow.

#### Scenario: Organização em desktop
- **WHEN** a pessoa abre Filtros de Tarefas em desktop
- **THEN** encontra os dois selects e as duas datas na primeira linha e busca com botões na segunda.

#### Scenario: Aplicação em tela estreita
- **WHEN** aplica ou limpa os critérios por teclado em 320 px
- **THEN** todos os controles permanecem acessíveis e os filtros mantêm seu comportamento.

### Requirement: Detalhes exclusivos da tarefa selecionada
A tela de detalhes SHALL apresentar somente a tarefa selecionada, suas subtarefas e informações relacionadas, sem filtros, cards de outras tarefas ou paginação da listagem. Voltar SHALL aparecer à direita na mesma linha do título quando houver espaço, com quebra acessível em telas estreitas. O retorno SHALL preservar filtros, página e foco de origem quando disponível.

#### Scenario: Detalhar uma tarefa
- **WHEN** a pessoa abre Ver detalhes em uma lista filtrada
- **THEN** vê somente o conteúdo da tarefa selecionada e pode voltar à mesma listagem.

#### Scenario: Troca rápida de seleção
- **WHEN** respostas de detalhes de duas tarefas chegam fora de ordem
- **THEN** somente a seleção mais recente pode preencher o detalhe, sem misturar subtarefas ou disciplina vinculada.
