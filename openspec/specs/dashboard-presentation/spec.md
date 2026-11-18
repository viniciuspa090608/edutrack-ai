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
Com sessão aberta o card Pomodoro SHALL mostrar somente o cronômetro MM:ss no resumo de uma sessão disponível, mantendo cabeçalho, contagem de sessões e link Abrir pomodoro. O resumo normal SHALL dispensar controles de sessão, texto de status e rolagem interna. Durante RUNNING SHALL atualizar o tempo sem recarga; PAUSED SHALL manter o tempo parado e BETWEEN_BLOCKS SHALL manter o tempo sem iniciar novo bloco. Ao atingir zero SHALL limitar a contagem e reconciliar com o servidor sem duplicar conclusões. Retorno à Home, foco e visibilidade SHALL atualizar a sessão; falha SHALL ser identificada sem simular tempo confirmado ou iniciar outra sessão.

#### Scenario: Sessão em andamento
- **WHEN** a pessoa inicia Pomodoro e volta à Home
- **THEN** o card mostra a sessão existente e a contagem avança com o mesmo significado do módulo.

#### Scenario: Pausa e retomada
- **WHEN** a sessão é pausada ou retomada e a Home reconcilia seu estado
- **THEN** o cronômetro para ou volta a contar a partir do estado confirmado.

#### Scenario: Limite do bloco e indisponibilidade
- **WHEN** a contagem chega a zero e a consulta de reconciliação falha
- **THEN** não aparece tempo negativo, conclusão duplicada ou novo bloco automático, e a indisponibilidade permite tentar novamente.

#### Scenario: Resumo com sessão disponível
- **WHEN** a Home tem uma sessão de Pomodoro disponível
- **THEN** o corpo apresenta apenas o tempo, sem rolagem interna, e o rodapé continua oferecendo Abrir pomodoro.

### Requirement: Cards vazios com altura e ações úteis
Sem tarefas cadastradas o card Tarefas SHALL preencher a altura conjunta de Pomodoro e Flashcards na composição desktop, com ícone, Nenhuma tarefa cadastrada, orientação e ação Adicionar tarefa para o fluxo real. Sem matérias o card Matérias SHALL usar a mesma altura de Progresso quando ambos estiverem lado a lado, com ícone, Nenhuma matéria cadastrada, orientação e Adicionar matéria para o fluxo real. Os estados vazios de Tarefas e Matérias na Home SHALL omitir a borda pontilhada interna e preservar a borda externa. Módulo desabilitado SHALL continuar omitido e falha SHALL NOT ser tratada como vazio. Em mobile ou sem card adjacente SHALL usar altura natural sem espaços artificiais.

#### Scenario: Home vazia em desktop
- **WHEN** os módulos habilitados estão sem cadastros e os cards adjacentes estão visíveis
- **THEN** Tarefas preenche as duas linhas da direita e Matérias tem a mesma altura de Progresso, com estados vazios e ações funcionais.

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
Matérias e Progresso SHALL ter a mesma largura e altura quando lado a lado, com os links de rodapé alinhados. Empilhados ou exibidos sem o card adjacente, SHALL ajustar a altura ao próprio conteúdo. Estatísticas SHALL crescer para exibir integralmente o gráfico e os indicadores, sem rolagem interna. Tarefas SHALL ocupar a altura conjunta de Pomodoro e Flashcards quando ambos estiverem presentes e sua lista SHALL rolar internamente se exceder o espaço reservado, mantendo Abrir tarefas visível. A lista de Tarefas SHALL usar barra vertical fina e discreta e mostrar um desfoque suave no tom do card em cada extremidade com conteúdo fora da área visível. O card SHALL omitir o aviso sobre tarefas ativas sem prazo. Em telas estreitas ou com cartões adjacentes omitidos, a composição SHALL se adaptar e manter todas as ações alcançáveis.

#### Scenario: Tarefas preenchem o espaço reservado
- **WHEN** a lista de próximas tarefas é maior do que o espaço interno
- **THEN** é possível rolar até o último item com teclado ou ponteiro e o card de Flashcards mantém sua posição.

#### Scenario: Limites da lista e conteúdo dos cards
- **WHEN** a pessoa chega ao fim da lista de Tarefas ou consulta os demais cards
- **THEN** o efeito inferior some ao chegar ao fim, a área de Estatísticas fica completa e Matérias e Progresso acompanham o maior conteúdo quando lado a lado.

### Requirement: Resumo alinhado ao título dos cards
Quando houver resumo em Tarefas, Pomodoro, Flashcards e Estatísticas, o texto secundário SHALL aparecer abaixo do título, alinhado à margem esquerda dele com 3 px de distância vertical, com o ícone à esquerda do bloco.

#### Scenario: Resumo longo
- **WHEN** o resumo precisa de mais de uma linha
- **THEN** as linhas quebram na coluna do título com contraste legível.

### Requirement: Estado inicial legível do card Progresso
Quando os dados confirmarem ausência de dias ativos registrados, o card SHALL exibir Nenhuma atividade registrada e orientar a concluir uma atividade de estudo para registrar o primeiro dia ativo. A data inicial do histórico SHALL aparecer como informação secundária quando disponível, no formato compacto “Histórico desde DD/MM/AAAA”, em uma linha quando houver espaço e com quebra em larguras estreitas e Abrir progresso SHALL ficar no rodapé. Dados indisponíveis e falhas SHALL manter seu tratamento próprio. Com histórico de atividade, sequência atual, recorde, início do histórico e dias ativos SHALL aparecer em linhas separadas com 5 px entre elas. Os valores da sequência atual, do recorde e dos dias ativos SHALL receber destaque visual.

#### Scenario: Histórico válido sem dias ativos
- **WHEN** o resumo confirma que o usuário ainda não registrou um dia ativo
- **THEN** a orientação substitui os contadores zerados e o acesso a Progresso continua visível.

#### Scenario: Histórico com atividade
- **WHEN** o resumo contém atividade registrada
- **THEN** os indicadores aparecem separados com destaque para seus valores principais.

### Requirement: Prévia de baralhos e rolagem de matérias

O card Flashcards SHALL manter o total de cartões pendentes e mostrar os nomes dos baralhos da conta em ordem decrescente pelo total de cartões, com desempate estável. A lista SHALL reutilizar a rolagem interna e o desfoque de bordas de Tarefas quando houver conteúdo fora da área visível. O corpo de Matérias SHALL reutilizar a rolagem interna quando necessário, preservando o destaque e o acesso pelo rodapé.

#### Scenario: Prévia de baralhos e rolagem de matérias

- **WHEN** as prévias excedem a altura dos cards
- **THEN** é possível rolar o conteúdo de Flashcards e Matérias com os links de rodapé visíveis, e Flashcards aplica desfoque nas bordas com conteúdo oculto.

### Requirement: Centralização vertical da ação inicial de Pomodoro
O card Pomodoro da Home SHALL apresentar Iniciar Pomodoro próximo ao texto introdutório, em área compacta com espaçamento legível, sem expandir espaço vazio para centralizar o botão. SHALL preservar cabeçalho, contagem de sessões e link Abrir pomodoro.

#### Scenario: Pomodoro disponível para iniciar
- **WHEN** o card exibe a ação Iniciar Pomodoro
- **THEN** texto e botão formam um grupo compacto e permanecem legíveis em telas estreitas.

### Requirement: Rolagem funcional no resumo de disciplinas
A área interna de conteúdo de Disciplinas SHALL permitir acesso integral ao resumo quando exceder a altura disponível, com rolagem vertical por ponteiro, toque e teclado, sem cortar texto ou barra de progresso. Cabeçalho e link Abrir disciplinas SHALL permanecer fora da área rolável. Sem excesso SHALL dispensar rolagem artificial.

#### Scenario: Resumo extenso
- **WHEN** nome, plano e indicadores excedem a área interna
- **THEN** é possível alcançar o último conteúdo e o link do rodapé continua visível.

### Requirement: Conquistas obtidas no resumo de progresso
O espaço abaixo dos indicadores do card Progresso SHALL exibir ícones das conquistas realmente obtidas, com gap de 4 px entre cards. Cada conquista SHALL manter ícone, nome acessível e cor de destaque próprios, iguais aos da aba Progresso. Havendo excesso, somente a div das conquistas SHALL rolar verticalmente, mantendo indicadores e rodapé fixos na composição. Sem concessões SHALL mostrar estado neutro sem simular conquista.

#### Scenario: Muitas conquistas
- **WHEN** as conquistas obtidas excedem a área reservada
- **THEN** todas ficam alcançáveis na rolagem local sem mover indicadores ou Abrir progresso.

#### Scenario: Concessão e identidade
- **WHEN** uma conquista possui earnedAt e outra está pendente
- **THEN** somente a obtida aparece na prévia e usa a mesma identidade visual do mural.

### Requirement: Redistribuir altura entre Pomodoro e Flashcards
Na composição desktop em que Pomodoro fica acima de Flashcards, o card Pomodoro SHALL ser compacto tanto com Iniciar Pomodoro quanto com cronômetro, reduzindo espaços vazios entre conteúdo e ação. A altura liberada SHALL aumentar na mesma proporção a área útil da lista de baralhos, preservando a altura conjunta dos cards e o alinhamento com Tarefas. Flashcards SHALL mostrar mais baralhos antes de ativar sua rolagem interna, preservando totais, ordem e rodapé. Sem os cards adjacentes ou em telas estreitas SHALL adotar altura natural.

#### Scenario: Transferência de espaço
- **WHEN** ambos os cards são apresentados no desktop com vários baralhos
- **THEN** a redução de altura de Pomodoro corresponde ao aumento da área útil de Flashcards e mais baralhos ficam visíveis.

#### Scenario: Cronômetro e preferências
- **WHEN** o cronômetro está ativo ou um módulo adjacente é desabilitado
- **THEN** a sessão mantém seu comportamento e a composição se adapta sem espaço artificial.
