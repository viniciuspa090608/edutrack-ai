# Spec Delta

## MODIFIED Requirements

### Requirement: Destacar automaticamente matéria e roadmap
Com disciplinas habilitadas, o dashboard SHALL apresentar uma coleção paginada que permita acessar todas as disciplinas próprias dentro do card. Disciplinas com estudo pendente SHALL aparecer primeiro por prazo crescente, inclusive vencido; as demais SHALL seguir atualização decrescente, com desempate estável por identificador. Cada item SHALL mostrar resumo e progresso oficiais de seu roadmap ativo ou, na ausência dele, plano manual, indicar pendência e permitir abrir a disciplina ou roadmap correspondente. Nenhuma disciplina SHALL ser excluída por estar concluída ou sem plano. A API SHALL filtrar pelo usuário autenticado e omitir os dados quando o módulo estiver desativado.

#### Scenario: Duas matérias pendentes
- **GIVEN** duas matérias próprias com estudo pendente e prazos diferentes
- **WHEN** o dashboard é aberto
- **THEN** ambas ficam acessíveis e a de prazo mais próximo aparece primeiro.

#### Scenario: Matéria sem roadmap
- **GIVEN** uma disciplina sem roadmap ativo e com plano manual
- **WHEN** o dashboard é aberto
- **THEN** mostra seu plano manual sem exigir IA.

#### Scenario: Mais de uma página
- **WHEN** existem mais disciplinas que o tamanho de uma página
- **THEN** todas podem ser alcançadas no card, inclusive concluídas e sem plano, com links corretos e sem duplicação.

#### Scenario: Falha na próxima página
- **WHEN** carregar mais disciplinas falha
- **THEN** os itens confirmados permanecem e há nova tentativa, sem representar erro como vazio.

#### Scenario: Atualização e isolamento
- **WHEN** a Home é consultada novamente após cadastrar ou alterar disciplinas
- **THEN** reflete os dados atuais da conta autenticada, sem dados de outras contas ou módulos desativados.
