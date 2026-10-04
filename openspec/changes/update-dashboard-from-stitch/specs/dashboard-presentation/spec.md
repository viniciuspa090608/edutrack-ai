# Spec Delta

## Purpose

Definir a apresentação visual responsiva do dashboard autenticado da EduTrack, usando os resumos e séries reais já disponíveis sem alterar contratos ou fluxos dos módulos.

## ADDED Requirements

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
O dashboard SHALL apresentar graficamente a série diária de tempo de foco recebida, com datas, unidade, período e fuso, mantendo todas as métricas semanais atualmente disponíveis e uma alternativa textual acessível. SHALL NOT substituir os totais oficiais por cálculo a partir do gráfico, preencher valores ausentes com zero ou misturar unidades em uma série.

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
