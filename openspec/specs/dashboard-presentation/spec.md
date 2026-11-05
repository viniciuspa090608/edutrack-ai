# dashboard-presentation Specification

## Purpose

Definir a apresentação visual responsiva do dashboard autenticado da EduTrack, usando os resumos e séries reais já disponíveis sem alterar contratos ou fluxos dos módulos.

## Requirements

### Requirement: Organização visual com equivalência funcional
O dashboard SHALL apresentar saudação, indicadores e resumos em hierarquia visual inspirada no Stitch, preservando as informações e ações atuais. SHALL mostrar somente campos existentes na resposta e SHALL NOT criar funcionalidades, metas ou números fictícios para reproduzir o design.

#### Scenario: Dashboard preenchido
- **WHEN** os resumos reais são recebidos
- **THEN** a apresentação exibe tarefas, matéria destacada, foco, revisões, progresso e métricas semanais disponíveis
- **AND** todos os acessos existentes aos módulos permanecem funcionais, incluindo o link contextual do roadmap.

#### Scenario: Elementos sem dados correspondentes
- **WHEN** o design contém XP, nível, nota prevista, retenção estimada ou meta de horas sem fonte real
- **THEN** esses elementos são omitidos ou substituídos por resumo verificável, sem novos campos ou contratos.

### Requirement: Progresso e prazos oficiais
O dashboard SHALL representar progresso de tarefas e matéria com os percentuais oficiais, manter status, prazo e informação de tarefas sem prazo, e SHALL distinguir progresso indisponível de zero. SHALL manter a ordem de tarefas e a matéria destacada recebidas, sem sugerir uma lista completa ou tarefas exclusivamente de hoje.

#### Scenario: Plano manual e progresso ausente
- **WHEN** a matéria tem plano manual e percentual nulo
- **THEN** exibe o plano e contagens oficiais sem uma barra que represente zero por suposição.

#### Scenario: Lista limitada
- **WHEN** recebe próximas tarefas com prazo e um total de tarefas sem prazo
- **THEN** apresenta a lista como próximas tarefas, mantém o aviso de tarefas sem prazo e não simula filtros globais.

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

### Requirement: Estados preservados na nova composição
A apresentação SHALL distinguir loading, empty, error e módulo desabilitado, preservar recarga global e por seção, manter dados das outras seções em falha parcial e não converter falhas em zero. SHALL preservar atualização por foco, visibilidade e preferências, proteção contra respostas antigas e ações de iniciar/retomar Pomodoro com reconciliação existente.

#### Scenario: Falha parcial
- **WHEN** estatísticas falham mas tarefas estão disponíveis
- **THEN** mantém tarefas e suas ações, mostra indisponibilidade no resumo semanal e permite tentar novamente sem substituir os demais valores.

#### Scenario: Módulo desabilitado
- **WHEN** a resposta omite um módulo por preferência
- **THEN** não mostra seus indicadores, cards ou atalhos e mantém o acesso às preferências.

#### Scenario: Atualização em andamento
- **WHEN** uma atualização ocorre após dados válidos
- **THEN** mantém os resumos existentes com indicação de carregamento, sem substituí-los por números de exemplo.

#### Scenario: Retomar foco
- **WHEN** existe sessão Pomodoro aberta ou o início tem resposta incerta
- **THEN** preserva retomada ou consulta de reconciliação e não inicia uma segunda sessão por causa da nova interface.

### Requirement: Responsividade e temas acessíveis
O dashboard SHALL adaptar a composição à largura útil desde 320 px, sem rolagem horizontal causada pelo layout, manter leitura equivalente nos temas claro e escuro e permanecer operável por teclado com foco visível. SHALL respeitar movimento reduzido e identificar gráficos por texto, sem depender somente de cor.

#### Scenario: Mobile e desktop
- **WHEN** a viewport alterna entre 320 px e desktop
- **THEN** cards, gráfico e ações reorganizam-se sem esconder informação essencial ou duplicar a navegação existente.

#### Scenario: Tema e teclado
- **WHEN** a pessoa usa tema escuro, teclado e movimento reduzido
- **THEN** os dados permanecem legíveis, ações têm foco visível e nenhuma animação é necessária para acessar informação.

### Requirement: Data e hora compactas da consulta
O card principal de boas-vindas SHALL conter a saudação e o subtítulo São DD/MM/AA HH:mm, escolha seu próximo passo de aprendizado., usando o instante real da consulta, sem segundos e com atributo temporal acessível. SHALL remover a linha externa duplicada e preservar o fuso de apresentação já usado, sem mudar o fuso de estudo ou períodos das métricas. Antes de existir instante válido SHALL mostrar somente a orientação, sem data fictícia.

#### Scenario: Consulta recebida
- **WHEN** a Home recebe uma consulta de 04/11/2026 às 21:36 no fuso de apresentação vigente
- **THEN** o card mostra São 04/11/26 21:36, escolha seu próximo passo de aprendizado. e não há linha temporal externa.

### Requirement: Hierarquia dos indicadores da Dashboard
Cada indicador SHALL exibir sua descrição em cinza legível no topo e, abaixo, o ícone e o valor com sua unidade na mesma linha. SHALL preservar os valores reais, indisponibilidade e omissão de módulos desativados.

#### Scenario: Indicadores disponíveis e indisponíveis
- **WHEN** indicadores são apresentados em ambos os temas
- **THEN** descrição antecede a linha de ícone e valor, com contraste acessível e sem transformar indisponibilidade em zero.

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
