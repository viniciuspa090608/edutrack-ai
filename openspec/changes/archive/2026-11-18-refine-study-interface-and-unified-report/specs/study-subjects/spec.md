## ADDED Requirements

### Requirement: Resumo de progresso por disciplina na listagem
A consulta paginada de disciplinas SHALL fornecer progresso individual oficial para cada disciplina própria retornada, com origem, total de itens, concluídos e percentual nulo quando o total for zero. SHALL usar a mesma seleção de fonte do resumo oficial: roadmap ativo escolhido pelo módulo quando existente, senão plano manual; percentual SHALL corresponder a concluídos dividido pelo total vezes cem. SHALL preservar filtros, ordenação, paginação, preferências e isolamento por usuário, sem contabilizar itens de outras disciplinas ou contas.

#### Scenario: Roadmap e plano manual
- **WHEN** a listagem inclui uma disciplina com roadmap e outra somente com plano manual
- **THEN** cada resumo usa sua própria fonte oficial e seus próprios totais.

#### Scenario: Zero e ausência de base
- **WHEN** uma disciplina tem itens pendentes e outra não tem itens
- **THEN** a primeira informa 0% e a segunda percentual nulo.

#### Scenario: Consulta autenticada e mutação
- **WHEN** a pessoa conclui um item próprio e atualiza sua lista
- **THEN** o progresso correspondente reflete a confirmação e dados de outra conta permanecem inacessíveis.
