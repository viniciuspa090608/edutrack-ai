# Spec Delta

## MODIFIED Requirements

### Requirement: Cards vazios com altura e ações úteis
Sem tarefas cadastradas o card Tarefas SHALL preencher a altura conjunta de Pomodoro e Flashcards na composição desktop, com ícone, Nenhuma tarefa cadastrada, orientação e ação Adicionar tarefa para o fluxo real. Sem matérias o card Matérias SHALL usar altura mínima compacta independente do card Progresso adjacente, com ícone, Nenhuma matéria cadastrada, orientação e Adicionar matéria para o fluxo real. Módulo desabilitado SHALL continuar omitido e falha SHALL NOT ser tratada como vazio. Em mobile ou sem card adjacente SHALL usar altura natural sem espaços artificiais.

#### Scenario: Home vazia em desktop
- **WHEN** os módulos habilitados estão sem cadastros e os cards adjacentes estão visíveis
- **THEN** Tarefas preenche as duas linhas da direita e Matérias usa sua altura mínima compacta, com estados vazios e ações funcionais.

#### Scenario: Resumo sem próximas tarefas
- **WHEN** há tarefas cadastradas mas nenhuma aparece na lista limitada de próximas tarefas
- **THEN** a Home não afirma Nenhuma tarefa cadastrada.

#### Scenario: Mobile e módulo desativado
- **WHEN** a Home é vista em 320 px ou Flashcards está desativado
- **THEN** o layout se adapta sem overflow ou espaço reservado a card ausente.

#### Scenario: Matérias sem destaque
- **WHEN** não há matéria destacada mas existem matérias cadastradas
- **THEN** a Home mantém orientação neutra e acesso ao módulo, sem afirmar Nenhuma matéria cadastrada.

#### Scenario: Ações de cadastro
- **WHEN** a pessoa ativa Adicionar tarefa ou Adicionar matéria
- **THEN** o fluxo real de criação do módulo correspondente abre, respeita seus gates e não reabre automaticamente após fechar e recarregar.

### Requirement: Dimensões estáveis dos cards da Home
Matérias e Progresso SHALL ter altura mínima compacta e ajustar suas alturas ao próprio conteúdo. Estatísticas SHALL crescer para exibir integralmente o gráfico e os indicadores, sem rolagem interna. Tarefas SHALL ocupar a altura conjunta de Pomodoro e Flashcards quando ambos estiverem presentes e sua lista SHALL rolar internamente se exceder o espaço reservado, mantendo Abrir tarefas visível. A lista de Tarefas SHALL usar barra vertical fina e discreta e mostrar um desfoque suave no tom do card em cada extremidade com conteúdo fora da área visível. O card SHALL omitir o aviso sobre tarefas ativas sem prazo. Em telas estreitas ou com cartões adjacentes omitidos, a composição SHALL se adaptar e manter todas as ações alcançáveis.

#### Scenario: Tarefas preenchem o espaço reservado
- **WHEN** a lista de próximas tarefas é maior do que o espaço interno
- **THEN** é possível rolar até o último item com teclado ou ponteiro e o card de Flashcards mantém sua posição.

#### Scenario: Limites da lista e conteúdo dos cards
- **WHEN** a pessoa chega ao fim da lista de Tarefas ou consulta os demais cards
- **THEN** o efeito inferior some ao chegar ao fim, a área de Estatísticas fica completa e Matérias e Progresso crescem ou encolhem conforme o conteúdo.

### Requirement: Estado inicial legível do card Progresso
Quando os dados confirmarem ausência de dias ativos registrados, o card SHALL exibir Nenhuma atividade registrada e orientar a concluir uma atividade de estudo para registrar o primeiro dia ativo. A data inicial do histórico SHALL aparecer como informação secundária quando disponível e Abrir progresso SHALL ficar no rodapé. Dados indisponíveis e falhas SHALL manter seu tratamento próprio. Com histórico de atividade, sequência atual, recorde, início do histórico e dias ativos SHALL aparecer em linhas separadas com 5 px entre elas. Os valores da sequência atual, do recorde e dos dias ativos SHALL receber destaque visual.

#### Scenario: Histórico válido sem dias ativos
- **WHEN** o resumo confirma que o usuário ainda não registrou um dia ativo
- **THEN** a orientação substitui os contadores zerados e o acesso a Progresso continua visível.

#### Scenario: Histórico com atividade
- **WHEN** o resumo contém atividade registrada
- **THEN** os indicadores aparecem separados com destaque para seus valores principais.
