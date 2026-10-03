# Spec Delta

## Purpose

Oferecer à pessoa autenticada uma página inicial que reúne resumos e ações dos módulos de estudo habilitados, usando os resultados oficiais de cada módulo e orientando primeiros passos.

## ADDED Requirements

### Requirement: Dashboard como entrada autenticada
A EduTrack SHALL apresentar o dashboard em `/app` após cadastro/login e em acesso direto com sessão válida. Antes de confirmar a sessão, SHALL mostrar carregamento sem conteúdo privado; sem sessão, SHALL encaminhar ao fluxo de acesso. O dashboard SHALL conter somente dados do usuário autenticado.

#### Scenario: Entrada após login
- **WHEN** a pessoa conclui o login e chega a `/app`
- **THEN** vê seu dashboard, sem dados de outra conta.

#### Scenario: Acesso direto sem sessão
- **WHEN** alguém abre `/app` sem sessão válida
- **THEN** não vê resumos privados e recebe o fluxo de entrada.

### Requirement: Resumir tarefas próximas e progresso
Com tarefas habilitadas, o dashboard SHALL mostrar até cinco tarefas próprias não concluídas com prazo, ordenadas por prazo crescente, incluindo atrasadas antes das futuras, e um resumo de tarefas por status. O progresso individual SHALL usar o valor fornecido pelo módulo de tarefas quando houver subtarefas; uma tarefa sem subtarefas SHALL mostrar seu status sem percentual inventado. Tarefas sem prazo SHALL permanecer acessíveis no módulo de tarefas, ainda que não entrem na lista de próximas.

#### Scenario: Tarefa atrasada e progresso derivado
- **GIVEN** uma tarefa atrasada com subtarefas e outra com prazo futuro
- **WHEN** a pessoa abre o dashboard
- **THEN** a atrasada aparece primeiro e seu progresso corresponde ao informado por tarefas.

#### Scenario: Nenhuma tarefa com prazo
- **WHEN** há tarefas ativas mas nenhuma com prazo
- **THEN** o cartão explica que não há próximas tarefas com prazo e oferece acesso a tarefas.

### Requirement: Destacar automaticamente matéria e roadmap
Com matérias habilitadas, o dashboard SHALL destacar uma matéria própria. Entre matérias com item de plano manual ou passo de roadmap pendente, SHALL escolher a de prazo mais próximo, inclusive vencido; empate SHALL ter ordem estável. Se a escolhida tiver roadmap ativo, SHALL mostrar o resumo e progresso fornecidos pelo módulo de roadmaps; caso contrário SHALL mostrar seu plano manual. Se nenhuma matéria tiver estudo pendente, SHALL destacar a matéria própria mais recentemente atualizada, identificando que não há pendências. Um link SHALL abrir a matéria ou roadmap correspondente.

#### Scenario: Duas matérias pendentes
- **GIVEN** duas matérias próprias com estudo pendente e prazos diferentes
- **WHEN** o dashboard é aberto
- **THEN** destaca a de prazo mais próximo e permite abrir seu estudo.

#### Scenario: Matéria sem roadmap
- **GIVEN** uma matéria destacada sem roadmap ativo e com plano manual
- **WHEN** o dashboard é aberto
- **THEN** mostra o resumo do plano manual sem exigir IA.

### Requirement: Resumir Pomodoro e oferecer ação segura
O dashboard SHALL mostrar o número de sessões Pomodoro concluídas fornecido pelo módulo e um botão para iniciar foco quando não houver sessão aberta. Se já houver sessão aberta, SHALL oferecer retomada da sessão existente em vez de iniciar outra. A ação SHALL usar as regras e respostas do módulo Pomodoro, sem alterar contagem de tempo ou blocos no dashboard.

#### Scenario: Nenhuma sessão aberta
- **WHEN** a pessoa aciona **Iniciar Pomodoro**
- **THEN** uma sessão é iniciada pelo módulo Pomodoro e a pessoa chega à sua página de sessão.

#### Scenario: Sessão aberta em outra aba
- **GIVEN** uma sessão própria aberta
- **WHEN** a pessoa abre o dashboard ou tenta iniciar foco novamente
- **THEN** vê ação para retomar a sessão existente e nenhuma segunda sessão é criada.

### Requirement: Mostrar sequência, pendências de flashcards e semana
O dashboard SHALL mostrar a sequência atual de dias recebida do módulo de sequências, sem recalcular seus critérios; com flashcards habilitados SHALL mostrar quantidade de cartões pendentes de revisão recebida da repetição espaçada; e SHALL mostrar o resumo da semana ISO atual recebido das estatísticas, incluindo tempo estudado e progresso disponível dos módulos ativos. Cada resumo SHALL ter acesso ao módulo de origem.

#### Scenario: Sem cartões pendentes
- **GIVEN** flashcards habilitados e nenhuma revisão pendente
- **WHEN** a pessoa abre o dashboard
- **THEN** vê zero pendentes com orientação para abrir flashcards, sem criar revisões fictícias.

#### Scenario: Semana em outro fuso
- **GIVEN** fuso de estudo configurado
- **WHEN** a pessoa abre o resumo semanal
- **THEN** os dias e totais seguem a semana e o fuso informados pelas estatísticas.

### Requirement: Respeitar disponibilidade e preferências
O dashboard SHALL omitir resumos e links de tarefas, matérias e flashcards desativados por preferência, inclusive na resposta da API, sem consultar ou expor seus dados. Pomodoro, sequência e estatísticas SHALL continuar disponíveis conforme seus próprios contratos; o progresso semanal SHALL refletir apenas fontes habilitadas. A preferência de IA SHALL NOT bloquear resumos manuais. Reativar um módulo SHALL restaurar seu resumo com os dados preservados. Mudanças de preferência em outra aba SHALL valer na próxima leitura.

#### Scenario: Matérias desativadas
- **GIVEN** matérias desativadas e tarefas ativas
- **WHEN** a pessoa abre o dashboard
- **THEN** não vê resumo nem link de matérias, mas vê tarefas.

#### Scenario: Todos os módulos opcionais desativados
- **GIVEN** tarefas, matérias e flashcards desativados
- **WHEN** a pessoa abre o dashboard
- **THEN** vê apenas resumos ainda disponíveis e orientação para ajustar preferências, sem cartões vazios dos módulos desativados.

### Requirement: Navegação e estados compreensíveis
Cada resumo disponível SHALL ter link ou ação para seu módulo. Falha de um resumo SHALL mostrar erro recuperável nesse resumo sem transformar a falha em zero e sem impedir os demais resumos. Ausência de dados SHALL oferecer orientação adequada ao módulo. A página SHALL funcionar por teclado, ter rótulos e foco visível, respeitar movimento reduzido e caber desde 320 px sem rolagem horizontal causada pelo layout.

#### Scenario: Falha apenas nas estatísticas
- **WHEN** o resumo semanal não puder ser carregado e tarefas estiverem disponíveis
- **THEN** o dashboard informa erro recuperável no resumo semanal e continua mostrando as tarefas.

#### Scenario: Conta nova
- **WHEN** uma pessoa sem atividades acessa o dashboard
- **THEN** encontra ações para começar nos módulos habilitados, sem valores inventados.
