# Spec Delta

## Purpose

Permitir dividir tarefas próprias em passos ordenados e acompanhar sua conclusão, calculando o progresso a partir das subtarefas e mantendo o status da tarefa principal coerente sem armazenar percentuais.

## ADDED Requirements

### Requirement: Gerenciar subtarefas próprias
Um usuário autenticado SHALL poder criar, visualizar, editar o título, excluir, concluir e reabrir subtarefas de uma tarefa própria. Cada subtarefa SHALL ter título não vazio, estado concluído ou pendente e posição dentro da tarefa; novas subtarefas SHALL ser acrescentadas ao fim como pendentes. A exclusão da tarefa principal SHALL remover suas subtarefas. Nenhuma operação SHALL exigir IA ou outros módulos.

#### Scenario: Criar e editar subtarefa
- **GIVEN** uma tarefa própria sem subtarefas
- **WHEN** o usuário cria uma subtarefa válida e depois altera seu título
- **THEN** ela aparece ao fim da lista como pendente com o novo título.

#### Scenario: Concluir e reabrir
- **GIVEN** uma subtarefa própria pendente
- **WHEN** o usuário a conclui e depois a reabre
- **THEN** o estado da subtarefa muda em cada ação
- **AND** a tarefa principal reflete o novo conjunto de subtarefas concluídas.

#### Scenario: Excluir subtarefa
- **GIVEN** uma subtarefa própria
- **WHEN** o usuário confirma sua exclusão
- **THEN** ela deixa de aparecer e não pode ser consultada novamente
- **AND** a ordem e o progresso das restantes são atualizados.

#### Scenario: Título inválido
- **WHEN** o usuário cria ou edita uma subtarefa com título em branco ou além do limite permitido
- **THEN** a operação é rejeitada sem alterar a lista.

### Requirement: Reordenar subtarefas
O proprietário SHALL poder alterar a ordem das subtarefas de uma tarefa. A ordem salva SHALL ser devolvida de forma estável nas leituras; uma solicitação com ID duplicado, ausente ou pertencente a outra tarefa SHALL ser rejeitada integralmente, sem reordenar parcialmente.

#### Scenario: Mover subtarefa
- **GIVEN** três subtarefas próprias em uma ordem definida
- **WHEN** o usuário move a última para o início
- **THEN** as três aparecem na nova ordem após recarregar a página
- **AND** seus estados de conclusão não mudam.

#### Scenario: Ordem inválida
- **WHEN** a solicitação de reordenação omite uma subtarefa ou contém ID repetido ou estranho à tarefa
- **THEN** a API rejeita a operação
- **AND** mantém a ordem anterior de todas elas.

### Requirement: Progresso calculado e status derivado
Quando uma tarefa tiver ao menos uma subtarefa, a EduTrack SHALL calcular seu progresso como **quantidade concluída ÷ quantidade total × 100**, sem persistir o percentual. A tarefa principal SHALL estar em `PENDING` quando nenhuma subtarefa estiver concluída, em `IN_PROGRESS` quando houver conclusão parcial e em `COMPLETED` quando todas estiverem concluídas. Criação, conclusão, reabertura e exclusão de subtarefas SHALL atualizar imediatamente o status observado na lista, no detalhe e nos filtros de tarefas.

#### Scenario: Nenhuma concluída
- **GIVEN** uma tarefa com duas subtarefas pendentes
- **WHEN** o usuário consulta a tarefa
- **THEN** o progresso é 0% e o status é `PENDING`.

#### Scenario: Conclusão parcial
- **GIVEN** uma tarefa com quatro subtarefas e uma concluída
- **WHEN** o usuário consulta a tarefa ou filtra tarefas por status
- **THEN** o progresso é 25% e o status é `IN_PROGRESS`
- **AND** a tarefa aparece no filtro `IN_PROGRESS`.

#### Scenario: Todas concluídas e reabertura
- **GIVEN** uma tarefa com duas subtarefas concluídas
- **WHEN** o usuário reabre uma delas
- **THEN** o progresso muda de 100% para 50%
- **AND** o status da tarefa principal muda de `COMPLETED` para `IN_PROGRESS`.

#### Scenario: Primeira subtarefa em tarefa concluída manualmente
- **GIVEN** uma tarefa sem subtarefas com status manual `COMPLETED`
- **WHEN** o usuário cria sua primeira subtarefa pendente
- **THEN** o progresso passa a 0% e o status da tarefa principal passa a `PENDING`.

### Requirement: Status manual somente sem subtarefas
Uma tarefa sem subtarefas SHALL continuar permitindo status manual nos três valores existentes e não SHALL apresentar percentual calculado. Enquanto houver subtarefas, o status SHALL ser derivado delas: pedidos manuais para `PENDING` ou `IN_PROGRESS` SHALL ser recusados, e a conclusão manual SHALL seguir a confirmação específica. Quando a última subtarefa for excluída, a tarefa SHALL conservar seu status naquele momento como novo status manual.

#### Scenario: Tarefa sem subtarefas
- **GIVEN** uma tarefa sem subtarefas
- **WHEN** o usuário altera manualmente o status para `IN_PROGRESS`
- **THEN** o status é salvo
- **AND** não há percentual calculado para mostrar.

#### Scenario: Remover a última subtarefa
- **GIVEN** uma tarefa com uma subtarefa concluída e status `COMPLETED`
- **WHEN** o usuário exclui essa última subtarefa
- **THEN** a tarefa continua `COMPLETED` e volta a aceitar mudanças manuais de status
- **AND** o percentual deixa de ser exibido.

#### Scenario: Pedido manual incompatível
- **GIVEN** uma tarefa com subtarefas
- **WHEN** o usuário tenta definir manualmente `PENDING` ou `IN_PROGRESS`
- **THEN** a API recusa a alteração e mantém o status derivado.

### Requirement: Confirmação para concluir subtarefas pendentes
Ao tentar concluir manualmente uma tarefa com subtarefas pendentes, a interface SHALL informar que todas as pendentes serão concluídas e pedir confirmação explícita. Sem confirmação, a API SHALL recusar a tentativa sem alterar subtarefas ou tarefa. Após confirmação, a API SHALL concluir todas as subtarefas pendentes e atualizar a tarefa principal para `COMPLETED` como uma única operação; repetir a confirmação SHALL ter o mesmo resultado sem efeitos adicionais.

#### Scenario: Cancelar confirmação
- **GIVEN** uma tarefa com subtarefas pendentes
- **WHEN** o usuário tenta concluí-la e cancela a confirmação
- **THEN** nenhuma subtarefa muda
- **AND** o status da tarefa permanece derivado do estado anterior.

#### Scenario: Tentar conclusão sem confirmação na API
- **GIVEN** uma tarefa com subtarefas pendentes
- **WHEN** uma chamada direta tenta definir `COMPLETED` sem a confirmação explícita
- **THEN** a API responde que a confirmação é necessária
- **AND** não altera tarefa nem subtarefas.

#### Scenario: Confirmar conclusão de todas
- **GIVEN** uma tarefa com subtarefas concluídas e pendentes
- **WHEN** o usuário confirma a conclusão de todas
- **THEN** todas ficam concluídas e o progresso se torna 100%
- **AND** a tarefa principal se torna `COMPLETED` sem estado parcial visível.

### Requirement: Isolamento e interface acessível
Todas as rotas de subtarefas SHALL exigir sessão válida e verificar a propriedade da tarefa principal em cada leitura e mutação. Um ID de tarefa ou subtarefa alheia SHALL responder como não encontrado, sem alterar dados. A interface SHALL oferecer ações de conclusão, reabertura e reordenação por teclado, foco visível, mensagens de erro e layout utilizável a partir de 320 px.

#### Scenario: Acesso a tarefa alheia
- **GIVEN** uma tarefa e subtarefas de outro usuário
- **WHEN** o usuário autenticado tenta consultar, editar, excluir, concluir ou reordenar esses IDs
- **THEN** a API não revela os dados e não altera nenhum registro alheio.

#### Scenario: Reordenação por teclado
- **GIVEN** uma viewport de 320 px e foco em uma subtarefa própria
- **WHEN** o usuário usa os controles de mover para cima ou para baixo pelo teclado
- **THEN** a ordem pode ser alterada com foco perceptível e resultado anunciado
- **AND** o layout não causa rolagem horizontal.

#### Scenario: Falha de operação
- **WHEN** uma alteração de subtarefa falha por indisponibilidade da API
- **THEN** a interface informa o erro e permite tentar novamente
- **AND** não anuncia uma alteração não confirmada.
