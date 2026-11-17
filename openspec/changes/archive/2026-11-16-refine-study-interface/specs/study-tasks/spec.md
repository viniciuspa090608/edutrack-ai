## MODIFIED Requirements

### Requirement: Filtrar lista de tarefas
A lista SHALL permitir filtros combináveis por trecho do título, status, importância e intervalo inclusivo de prazo (`de` e `até`), além de uma ação para limpar os filtros. Uma tarefa sem prazo SHALL ficar fora de um filtro de intervalo de prazo. Filtros inválidos SHALL ser rejeitados e não SHALL alterar dados.

O filtro de título SHALL ignorar maiúsculas e minúsculas e espaços externos. Um campo em branco SHALL equivaler à ausência desse critério. A busca SHALL abranger todas as tarefas do usuário antes da paginação.

#### Scenario: Combinar filtros
- **GIVEN** tarefas do usuário com status, importância e prazos diferentes
- **WHEN** ele aplica um trecho do título, `IN_PROGRESS`, `HIGH` e um intervalo de datas
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

#### Scenario: Aplicar e limpar busca
- **WHEN** a pessoa preenche o título e aciona Aplicar filtros
- **THEN** a lista volta à primeira página dos resultados correspondentes
- **AND** Limpar filtros restaura os critérios padrão e volta à primeira página.
