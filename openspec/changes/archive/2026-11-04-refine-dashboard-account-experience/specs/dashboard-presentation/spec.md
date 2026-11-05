## MODIFIED Requirements

### Requirement: Gráfico semanal de dados reais
O dashboard SHALL apresentar graficamente a série diária de tempo de foco recebida, com datas, unidade e período, usando o fuso correto sem identificá-lo por texto informativo, mantendo todas as métricas semanais atualmente disponíveis e uma alternativa textual acessível. SHALL NOT substituir os totais oficiais por cálculo a partir do gráfico, preencher valores ausentes com zero ou misturar unidades em uma série.

#### Scenario: Série válida
- **WHEN** recebe observações diárias de tempo de foco
- **THEN** barras e valores textuais representam as mesmas observações, convertidas somente para unidade legível
- **AND** mantém período parcial, frequência, limites de cobertura e instante da consulta quando aplicáveis.

#### Scenario: Zero e indisponibilidade
- **WHEN** uma observação é zero e outra não contém tempo de foco
- **THEN** representa zero como ausência de atividade conhecida e a outra como indisponível, sem fabricar altura ou valor.

#### Scenario: Semana sem atividade
- **WHEN** a semana está vazia ou a série não contém observações
- **THEN** apresenta orientação adequada e não cria pontos fictícios.

### Requirement: Data e hora compactas da consulta
O card principal de boas-vindas SHALL conter a saudação e o subtítulo São DD/MM/AA HH:mm, escolha seu próximo passo de aprendizado., usando o instante real da consulta, sem segundos e com atributo temporal acessível. SHALL remover a linha externa duplicada e preservar o fuso de apresentação já usado, sem mudar o fuso de estudo ou períodos das métricas. Antes de existir instante válido SHALL mostrar somente a orientação, sem data fictícia.

#### Scenario: Consulta recebida
- **WHEN** a Home recebe uma consulta de 04/11/2026 às 21:36 no fuso de apresentação vigente
- **THEN** o card mostra São 04/11/26 21:36, escolha seu próximo passo de aprendizado. e não há linha temporal externa.

## ADDED Requirements

### Requirement: Pomodoro vivo no resumo da Home
Com sessão aberta o card Pomodoro SHALL mostrar cronômetro MM:ss e estado reais da mesma sessão acessível no módulo. Durante RUNNING SHALL atualizar o tempo sem recarga; PAUSED SHALL manter o tempo parado e BETWEEN_BLOCKS SHALL indicar o estado sem iniciar novo bloco. Ao atingir zero SHALL limitar a contagem e reconciliar com o servidor sem duplicar conclusões. Retorno à Home, foco e visibilidade SHALL atualizar a sessão; falha SHALL ser identificada sem simular tempo confirmado ou iniciar outra sessão.

#### Scenario: Sessão em andamento
- **WHEN** a pessoa inicia Pomodoro e volta à Home
- **THEN** o card mostra a sessão existente e a contagem avança com o mesmo significado do módulo.

#### Scenario: Pausa e retomada
- **WHEN** a sessão é pausada ou retomada e a Home reconcilia seu estado
- **THEN** o cronômetro para ou volta a contar a partir do estado confirmado.

#### Scenario: Limite do bloco e indisponibilidade
- **WHEN** a contagem chega a zero e a consulta de reconciliação falha
- **THEN** não aparece tempo negativo, conclusão duplicada ou novo bloco automático, e a indisponibilidade permite tentar novamente.

### Requirement: Cards vazios com altura e ações úteis
Sem tarefas cadastradas o card Tarefas SHALL preencher a altura conjunta de Pomodoro e Flashcards na composição desktop, com ícone, Nenhuma tarefa cadastrada, orientação e ação Adicionar tarefa para o fluxo real. Sem matérias o card Matérias SHALL ter altura equivalente ao card Progresso adjacente, com ícone, Nenhuma matéria cadastrada, orientação e Adicionar matéria para o fluxo real. Módulo desabilitado SHALL continuar omitido e falha SHALL NOT ser tratada como vazio. Em mobile ou sem card adjacente SHALL usar altura natural sem espaços artificiais.

#### Scenario: Home vazia em desktop
- **WHEN** os módulos habilitados estão sem cadastros e os cards adjacentes estão visíveis
- **THEN** Tarefas preenche as duas linhas da direita e Matérias acompanha Progresso, com estados vazios e ações funcionais.

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
