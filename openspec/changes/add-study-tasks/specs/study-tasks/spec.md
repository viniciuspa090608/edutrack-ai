# Spec Delta

## Purpose

Permitir que cada usuário autenticado organize e acompanhe suas próprias tarefas de estudo, com edição manual, prazos, importância e filtros, sem depender de IA ou de outros módulos.

## ADDED Requirements

### Requirement: Criar tarefa de estudo
A EduTrack SHALL permitir que um usuário autenticado crie uma tarefa com título obrigatório, descrição opcional, importância `LOW`, `MEDIUM` ou `HIGH` e prazo opcional como data de calendário. A importância SHALL iniciar em `MEDIUM` e o status em `PENDING` quando não informados. Título vazio, dados excessivos, data inválida e valores fora das enumerações SHALL ser rejeitados antes da persistência.

#### Scenario: Criação mínima
- **GIVEN** um usuário autenticado
- **WHEN** ele cria uma tarefa com título válido e sem campos opcionais
- **THEN** a tarefa é salva para esse usuário com status `PENDING`, importância `MEDIUM` e sem prazo
- **AND** aparece na sua lista.

#### Scenario: Criação com importância e prazo
- **GIVEN** um usuário autenticado
- **WHEN** ele cria uma tarefa com descrição, importância `HIGH` e prazo válido
- **THEN** a tarefa retorna com esses valores e a mesma data de calendário informada.

#### Scenario: Entrada inválida
- **WHEN** o usuário envia título em branco, status ou importância desconhecidos, prazo inválido ou campo além do limite permitido
- **THEN** a API rejeita a criação com erro de validação
- **AND** nenhuma tarefa parcial é salva.

### Requirement: Visualizar tarefas próprias
A EduTrack SHALL apresentar a lista paginada e o detalhe das tarefas do usuário autenticado, incluindo título, descrição, importância, prazo, status e datas de criação/alteração. A lista sem filtro SHALL incluir somente suas tarefas, em ordem estável da criação mais recente para a mais antiga. A navegação entre páginas SHALL preservar filtros ativos.

#### Scenario: Lista e detalhe
- **GIVEN** um usuário com tarefas próprias
- **WHEN** ele abre a lista e seleciona uma tarefa
- **THEN** vê os campos salvos dessa tarefa
- **AND** não vê tarefas de outros usuários.

#### Scenario: Sem tarefas
- **GIVEN** um usuário que ainda não criou tarefas
- **WHEN** ele abre a lista
- **THEN** vê um estado vazio com ação para criar a primeira tarefa.

#### Scenario: Próxima página
- **GIVEN** mais tarefas do que o tamanho de uma página
- **WHEN** o usuário avança na lista
- **THEN** vê a página seguinte sem duplicar tarefas da página anterior
- **AND** os filtros escolhidos permanecem aplicados.

### Requirement: Editar campos e alterar status manualmente
O proprietário SHALL poder editar título, descrição, importância e prazo e alterar o status somente entre `PENDING`, `IN_PROGRESS` e `COMPLETED`. Uma atualização SHALL preservar os campos não enviados; descrição e prazo SHALL poder ser removidos explicitamente. A alteração de status SHALL ser manual e não depender de subtarefas ou de percentual de progresso.

#### Scenario: Editar tarefa
- **GIVEN** uma tarefa própria existente
- **WHEN** o usuário altera título e prazo
- **THEN** os novos valores ficam visíveis
- **AND** descrição, importância e status não enviados permanecem iguais.

#### Scenario: Transições de status
- **GIVEN** uma tarefa própria em `PENDING`
- **WHEN** o usuário muda para `IN_PROGRESS`, depois `COMPLETED` e depois `PENDING`
- **THEN** cada estado solicitado é persistido e exibido
- **AND** nenhuma transição exige IA, subtarefa ou progresso calculado.

#### Scenario: Limpar campos opcionais
- **GIVEN** uma tarefa própria com descrição e prazo
- **WHEN** o usuário remove esses dois campos
- **THEN** a tarefa permanece sem descrição e sem prazo.

### Requirement: Excluir tarefa própria
O proprietário SHALL poder excluir uma tarefa após confirmação na interface. A exclusão SHALL remover a tarefa da lista e impedir sua recuperação pelas rotas de detalhe; falha na operação SHALL ser informada sem apresentar sucesso indevido.

#### Scenario: Exclusão confirmada
- **GIVEN** uma tarefa própria
- **WHEN** o usuário confirma a exclusão
- **THEN** a tarefa deixa de aparecer na lista
- **AND** a consulta posterior pelo ID não a encontra.

#### Scenario: Exclusão cancelada
- **GIVEN** uma tarefa própria
- **WHEN** o usuário cancela a confirmação
- **THEN** a tarefa permanece intacta.

### Requirement: Filtrar lista de tarefas
A lista SHALL permitir filtros combináveis por status, importância e intervalo inclusivo de prazo (`de` e `até`), além de uma ação para limpar os filtros. Uma tarefa sem prazo SHALL ficar fora de um filtro de intervalo de prazo. Filtros inválidos SHALL ser rejeitados e não SHALL alterar dados.

#### Scenario: Combinar filtros
- **GIVEN** tarefas do usuário com status, importância e prazos diferentes
- **WHEN** ele filtra por `IN_PROGRESS`, `HIGH` e um intervalo de datas
- **THEN** a lista contém somente suas tarefas que satisfazem todos os critérios.

#### Scenario: Nenhum resultado
- **WHEN** filtros válidos não encontram tarefas próprias
- **THEN** a interface informa que não há resultados
- **AND** permite limpar os filtros sem perder tarefas.

#### Scenario: Limites do prazo
- **GIVEN** tarefas com prazo exatamente nas datas inicial e final do filtro
- **WHEN** o usuário aplica o intervalo
- **THEN** ambas são incluídas se satisfizerem os demais critérios
- **AND** tarefas sem prazo ficam fora do resultado.

### Requirement: Isolamento e autenticação em todas as operações
Todas as rotas de tarefas SHALL exigir sessão válida. A API SHALL derivar o proprietário da sessão autenticada, filtrar por esse usuário em toda consulta e mutação e nunca aceitar um `userId` enviado pelo cliente como autorização. Um ID válido pertencente a outro usuário SHALL responder como não encontrado, sem revelar a existência da tarefa. A web SHALL proteger a página de tarefas e não exibir dados privados antes de confirmar a sessão.

#### Scenario: Acesso sem sessão
- **WHEN** uma pessoa sem sessão abre a página ou chama a API de tarefas
- **THEN** a página oferece o fluxo de entrada sem mostrar tarefas
- **AND** a API nega acesso.

#### Scenario: ID de outro usuário
- **GIVEN** uma tarefa de outro usuário
- **WHEN** o usuário autenticado tenta ler, editar ou excluir a tarefa pelo ID
- **THEN** cada operação responde como tarefa não encontrada
- **AND** o registro original permanece inalterado.

#### Scenario: Listagem isolada
- **GIVEN** tarefas pertencentes a dois usuários
- **WHEN** cada um lista ou filtra tarefas
- **THEN** recebe apenas registros próprios, mesmo com filtros idênticos.

### Requirement: Fluxo manual independente
Criar, consultar, editar, filtrar e excluir tarefas SHALL funcionar sem serviço de IA e sem dados dos módulos de matérias, flashcards ou outros módulos de estudo. Esta etapa SHALL NOT exigir ou oferecer subtarefas, percentual de progresso ou associação com matéria.

#### Scenario: IA e demais módulos indisponíveis
- **GIVEN** autenticação e banco de tarefas disponíveis, mas IA e módulos de matérias/flashcards indisponíveis
- **WHEN** o usuário executa o ciclo completo de uma tarefa
- **THEN** todas as operações de tarefas funcionam normalmente.

### Requirement: Interface de tarefas acessível
A página de tarefas SHALL ser utilizável por teclado, com campos e ações rotulados, foco visível e layout legível a partir de 320 px sem rolagem horizontal causada pelo layout. A interface SHALL distinguir carregamento, erro, lista vazia, filtro sem resultados e sucesso de mutação.

#### Scenario: Uso por teclado em tela estreita
- **GIVEN** uma viewport de 320 px
- **WHEN** o usuário cria, filtra, edita e confirma ou cancela a exclusão pelo teclado
- **THEN** todos os controles permanecem alcançáveis, identificáveis e operáveis
- **AND** o layout não causa rolagem horizontal.

#### Scenario: Falha ao salvar
- **WHEN** uma mutação falha por indisponibilidade da API
- **THEN** a interface apresenta erro e caminho para tentar novamente
- **AND** não afirma que a alteração foi salva.
