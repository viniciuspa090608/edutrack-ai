# Spec Delta

## Purpose

Registrar sessões de foco próprias com um ou mais blocos de 25 minutos ativos, excluindo pausas do tempo estudado e preservando dados confiáveis para estatísticas futuras.

## ADDED Requirements

### Requirement: Iniciar sessão própria de foco

Uma pessoa autenticada SHALL poder iniciar uma sessão Pomodoro que admite vários blocos, opcionalmente associada a uma tarefa própria existente. A sessão SHALL começar em execução com zero tempo ativo e alvo de 25 minutos ativos para o primeiro bloco. Cada pessoa SHALL ter no máximo uma sessão não encerrada por vez, inclusive em abas diferentes. Iniciar outra enquanto uma estiver em execução, pausa ou entre blocos SHALL retornar conflito sem criar sessão adicional.

#### Scenario: Iniciar sem tarefa

- **GIVEN** uma pessoa sem sessão Pomodoro aberta
- **WHEN** ela inicia uma sessão sem tarefa
- **THEN** a sessão começa em execução com tempo ativo zero
- **AND** pode ser concluída sem usar os módulos de tarefas ou matérias.

#### Scenario: Segunda sessão em outra aba

- **GIVEN** uma sessão própria ainda não encerrada
- **WHEN** a pessoa tenta iniciar outra em outra aba
- **THEN** a API recusa a nova criação e devolve a sessão existente para recuperação
- **AND** não passa a contar dois cronômetros simultâneos.

### Requirement: Pausar e continuar preservando tempo ativo

O tempo ativo SHALL acumular apenas enquanto um bloco da sessão estiver em execução. Pausar SHALL preservar o tempo já acumulado no bloco e na sessão e interromper a contagem; continuar SHALL retomá-la desse valor, sem incluir o período pausado. O tempo SHALL ser calculado pelo servidor a partir das transições persistidas, sem aceitar duração informada pelo cliente. Leituras após recarga ou em outra aba SHALL recuperar o mesmo estado, tempo ativo e blocos concluídos.

#### Scenario: Dez minutos, pausa e quinze minutos

- **GIVEN** uma sessão com 10 minutos ativos
- **WHEN** a pessoa pausa por 5 minutos, continua e estuda mais 15 minutos
- **THEN** a sessão atinge 25 minutos ativos
- **AND** os 5 minutos pausados não entram no tempo estudado.

#### Scenario: Recarga durante pausa

- **GIVEN** uma sessão pausada com tempo acumulado
- **WHEN** a página é recarregada após alguns minutos
- **THEN** o tempo ativo continua igual ao registrado no início da pausa
- **AND** a pessoa pode continuar sem perder esse tempo.

### Requirement: Contar vários blocos sem incluir pausas

Cada bloco SHALL ser creditado uma única vez ao alcançar 25 minutos ativos desde o início desse bloco. Ao atingir o limite, a contagem SHALL parar e a sessão SHALL esperar a decisão da pessoa: iniciar o próximo bloco, concluir ou cancelar a sessão. Iniciar o próximo bloco SHALL retomar a contagem na mesma sessão com zero tempo no novo bloco e preservar os blocos e o tempo anteriores. A pessoa SHALL poder repetir esse ciclo sem criar nova sessão; uma pausa dentro de qualquer bloco SHALL NOT entrar nos 25 minutos exigidos.

#### Scenario: Primeiro bloco após pausa

- **GIVEN** uma sessão que acumulou 10 minutos, pausou por 5 e depois acumulou mais 15 minutos
- **WHEN** a pessoa consulta a sessão
- **THEN** encontra 25 minutos ativos, um bloco concluído e o cronômetro parado entre blocos
- **AND** os 5 minutos pausados não entram no resultado.

#### Scenario: Segundo bloco na mesma sessão

- **GIVEN** uma sessão com um bloco concluído e 25 minutos ativos
- **WHEN** a pessoa inicia o próximo bloco e estuda mais 25 minutos ativos
- **THEN** a mesma sessão registra 50 minutos ativos e dois blocos concluídos
- **AND** nenhuma segunda sessão foi criada.

#### Scenario: Repetição no limite do bloco

- **GIVEN** um bloco já creditado e o cronômetro parado entre blocos
- **WHEN** duas abas consultam ou repetem a ação no mesmo limite
- **THEN** o bloco continua contado uma única vez
- **AND** o tempo ativo não cresce enquanto o próximo bloco não for iniciado.

### Requirement: Concluir sessão com blocos completos

A pessoa SHALL poder concluir uma sessão depois de completar ao menos um bloco. A conclusão SHALL preservar todos os blocos já creditados e todo o tempo ativo, inclusive eventual trecho parcial do último bloco, sem somar período pausado. Antes do primeiro bloco completo, a conclusão SHALL ser recusada sem alterar a sessão; a pessoa poderá cancelar e preservar o tempo parcial. Repetir conclusão de sessão já concluída SHALL devolver o mesmo resultado, sem acrescentar tempo ou bloco.

#### Scenario: Concluir após dois blocos

- **GIVEN** uma sessão com 50 minutos ativos e dois blocos concluídos
- **WHEN** a pessoa a conclui
- **THEN** o histórico registra 50 minutos estudados e dois blocos
- **AND** a sessão deixa de aceitar novas transições.

#### Scenario: Concluir com trecho parcial após um bloco

- **GIVEN** uma sessão com um bloco completo e mais 10 minutos ativos no bloco seguinte
- **WHEN** a pessoa a conclui
- **THEN** o histórico registra 35 minutos estudados e um bloco concluído.

#### Scenario: Conclusão antes do primeiro bloco

- **GIVEN** uma sessão com menos de 25 minutos ativos e nenhum bloco completo
- **WHEN** a pessoa pede conclusão
- **THEN** a API recusa a operação e mantém a sessão aberta
- **AND** nenhum bloco é contabilizado.

### Requirement: Cancelar sem perder tempo parcial

Uma sessão em execução, pausa ou entre blocos SHALL poder ser cancelada. O cancelamento SHALL registrar todo o tempo ativo acumulado e preservar blocos já completados; se ocorrer antes de 25 minutos ativos, SHALL registrar zero blocos. O tempo pausado não entra. A sessão cancelada SHALL aparecer no histórico, não poderá ser continuada ou concluída e SHALL permitir iniciar uma nova sessão. Repetir cancelamento SHALL NOT acrescentar tempo ou bloco.

#### Scenario: Cancelar após foco parcial

- **GIVEN** uma sessão com 10 minutos ativos e 5 minutos em pausa
- **WHEN** a pessoa a cancela
- **THEN** o histórico registra 10 minutos estudados e zero blocos concluídos
- **AND** uma nova sessão pode ser iniciada.

#### Scenario: Cancelar depois de um bloco e trecho parcial

- **GIVEN** uma sessão com um bloco completo e mais 10 minutos ativos no próximo bloco
- **WHEN** a pessoa a cancela
- **THEN** o histórico registra 35 minutos estudados e um bloco concluído
- **AND** nenhum tempo pausado é adicionado.

#### Scenario: Repetir cancelamento

- **GIVEN** uma sessão já cancelada
- **WHEN** a chamada de cancelamento é repetida
- **THEN** o tempo e a quantidade de blocos permanecem iguais
- **AND** a sessão não volta a executar.

### Requirement: Associação opcional e segura com tarefa

Ao iniciar a sessão, a pessoa SHALL poder selecionar somente tarefa existente da própria conta; ID alheio ou inexistente SHALL ser tratado como não encontrado sem criar a sessão. A associação SHALL ser opcional e não SHALL alterar status ou progresso da tarefa. Se a tarefa for excluída posteriormente, a sessão e seus totais SHALL permanecer, sem vínculo ativo com a tarefa removida. Se o módulo de tarefas estiver desativado por preferência, iniciar Pomodoro sem tarefa SHALL continuar possível e nova associação a tarefa SHALL ficar indisponível. Associação com matéria SHALL NOT ser exigida nem criada nesta mudança.

#### Scenario: Associar tarefa própria

- **GIVEN** uma tarefa existente da própria conta
- **WHEN** a pessoa a seleciona ao iniciar o Pomodoro
- **THEN** o histórico da sessão mantém a referência à tarefa
- **AND** o status da tarefa não muda ao concluir o foco.

#### Scenario: Tarefa alheia ou inexistente

- **GIVEN** ID de tarefa de outra pessoa ou inexistente
- **WHEN** a pessoa tenta iniciar sessão associada a esse ID
- **THEN** a API responde como tarefa não encontrada e não cria sessão.

#### Scenario: Tarefa associada excluída

- **GIVEN** uma tarefa associada é excluída depois de criada a sessão
- **WHEN** a pessoa consulta seu histórico
- **THEN** a sessão e seus totais permanecem e o vínculo removido não dá acesso à tarefa excluída.

### Requirement: Histórico e totais para estatísticas

A EduTrack SHALL manter histórico próprio de sessões concluídas e canceladas, com estado final, tempo ativo efetivamente registrado, número de blocos concluídos (zero ou mais), datas e associação opcional. SHALL disponibilizar totais por usuário de tempo ativo e blocos a partir de sessões encerradas, sem contar duas vezes uma sessão ou incluir períodos pausados. Sessões ainda abertas SHALL ser apresentadas separadamente e não entrar nesses totais até seu encerramento. Uma pessoa SHALL ver somente suas sessões e totais; esta mudança não exige dashboard de estatísticas.

#### Scenario: Total com conclusão e cancelamento

- **GIVEN** uma sessão concluída com 25 minutos e uma cancelada com 10 minutos ativos
- **WHEN** a pessoa consulta seus totais
- **THEN** encontra 35 minutos estudados e um bloco concluído
- **AND** pausas e sessões ainda abertas não entram no total.

#### Scenario: Isolamento entre pessoas

- **GIVEN** sessões pertencentes a duas pessoas
- **WHEN** cada uma consulta histórico, detalhe ou totais
- **THEN** vê somente seus próprios registros
- **AND** um ID de sessão alheia não revela seus dados.

### Requirement: Interface de sessão acessível e resiliente

A página Pomodoro SHALL oferecer controles de iniciar, pausar, continuar, iniciar o próximo bloco, cancelar e concluir conforme o estado, mostrar tempo ativo total, blocos concluídos e tempo restante no bloco atual. SHALL apresentar carregamento, erro, vazio e sucesso aplicáveis, funcionar por teclado e tecnologias assistivas, respeitar movimento reduzido e caber desde 320 px sem rolagem horizontal causada pelo layout. Falha de rede SHALL levar a uma nova leitura do estado no servidor antes de repetir uma transição, sem somar tempo local como autoridade.

#### Scenario: Falha de rede ao pausar

- **GIVEN** sessão em execução
- **WHEN** a chamada de pausa falha ou sua resposta se perde
- **THEN** a interface consulta o estado persistido e apresenta o tempo correto
- **AND** não assume pausa bem-sucedida nem cria segunda sessão.
