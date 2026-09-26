# Spec Delta

## Purpose

Permitir que a pessoa reorganize passos ainda pendentes de um roadmap próprio, revise uma continuação sugerida por IA e recupere planos confirmados anteriores sem perder o progresso já concluído.

## ADDED Requirements

### Requirement: Identidade estável e progresso explícito
A EduTrack SHALL expor identidade estável e conclusão dos passos e permitir concluir ou reabrir um passo próprio explicitamente, sem exigir IA. Passos existentes SHALL começar pendentes, mantendo conteúdo e ordem. Edições manuais SHALL conservar identidades e o prefixo protegido; edições e mudanças de progresso SHALL criar revisões confirmadas e invalidar prévias antigas. Conflitos SHALL recusar alterações sem escrita parcial.

#### Scenario: Concluir e reabrir
- **WHEN** a pessoa conclui um passo próprio e depois o reabre explicitamente
- **THEN** cada ação cria uma revisão manual e a identidade do passo permanece estável.

#### Scenario: Roadmap preexistente
- **GIVEN** um roadmap anterior à base de progresso
- **WHEN** a versão nova é aplicada
- **THEN** todos os passos e sua ordem permanecem disponíveis como revisão inicial, com conclusão inicialmente falsa.

### Requirement: Reordenação com limite de progresso
A EduTrack SHALL permitir iniciar a reordenação apenas de passos pendentes após o último passo concluído do roadmap ativo. A posição de inserção do passo movido SHALL definir o ponto de alteração; o passo movido e todos os passos anteriores a ele na nova ordem SHALL permanecer na prévia, e somente os passos posteriores a esse ponto poderão ser regenerados. Passos concluídos SHALL manter identidade, conteúdo, ordem e estado de conclusão.

#### Scenario: Mover um passo pendente
- **GIVEN** o roadmap ativo contém `DDL → DQL → DML → TCL`, apenas `DDL` está concluído
- **WHEN** a pessoa move `DML` para depois de `DDL` e solicita a regeneração
- **THEN** a prévia começa com `DDL → DML`
- **AND** `DDL` conserva conteúdo e conclusão
- **AND** a IA propõe somente a sequência posterior a `DML`.

#### Scenario: Tentar alterar progresso concluído
- **GIVEN** um roadmap com passos concluídos
- **WHEN** a pessoa tenta mover um passo concluído ou inserir um passo antes do último passo concluído
- **THEN** a ação é impedida com uma explicação
- **AND** o roadmap ativo permanece igual.

### Requirement: Prévia revisável antes da substituição
A EduTrack SHALL mostrar a sequência candidata completa, distinguindo o trecho preservado do trecho sugerido, antes de alterar o roadmap ativo. A pessoa SHALL poder editar, remover e reordenar passos sugeridos, confirmar ou cancelar. O cancelamento e a falha de geração SHALL manter o roadmap ativo inalterado. A prévia SHALL expor estados de carregamento e erro.

#### Scenario: Revisar e confirmar
- **WHEN** a IA retorna uma continuação válida
- **THEN** a pessoa vê a prévia e pode corrigir seus passos antes de confirmar
- **AND** nenhuma mudança aparece no roadmap ativo antes da confirmação.

#### Scenario: Cancelar a prévia
- **WHEN** a pessoa cancela a prévia
- **THEN** o roadmap ativo permanece como estava
- **AND** a prévia cancelada não entra no histórico de versões.

#### Scenario: Geração indisponível
- **WHEN** a IA falha ou devolve uma resposta inválida
- **THEN** a pessoa vê um erro com possibilidade de tentar novamente ou cancelar
- **AND** a versão ativa não é substituída.

### Requirement: Confirmação íntegra e sem duplicatas
A EduTrack SHALL validar a sequência editada no servidor antes de confirmá-la, rejeitando identificadores repetidos, títulos equivalentes após normalização e violação do trecho preservado. A confirmação SHALL ser atômica e exigir a mesma revisão do roadmap que originou a prévia. Exatamente uma versão confirmada SHALL ser ativa por roadmap.

#### Scenario: Duplicata na prévia
- **WHEN** a pessoa tenta confirmar uma prévia com um passo repetido por identificador ou título normalizado
- **THEN** a confirmação é recusada e indica quais passos precisam de correção
- **AND** a versão ativa permanece igual.

#### Scenario: Roadmap mudou durante a revisão
- **GIVEN** uma prévia baseada em uma revisão anterior
- **WHEN** outra edição do mesmo roadmap é confirmada antes dela
- **THEN** a confirmação antiga é recusada como desatualizada
- **AND** a pessoa pode gerar nova prévia a partir da versão atual.

#### Scenario: Confirmar alteração
- **WHEN** a pessoa confirma uma prévia válida e atual
- **THEN** a nova sequência torna-se a única versão ativa
- **AND** a versão substituída fica disponível no histórico.

### Requirement: Histórico de versões confirmadas e restauração
A EduTrack SHALL guardar as versões confirmadas substituídas do roadmap, incluindo ordem, conteúdo, estados de conclusão, data e origem da alteração, enquanto o roadmap existir. A pessoa SHALL poder consultar o histórico e iniciar a restauração de uma versão anterior. A restauração SHALL mostrar prévia e preservar todos os passos atualmente concluídos; ao confirmar, SHALL criar uma nova versão ativa e manter as versões anteriores no histórico. Excluir o roadmap SHALL excluir seu histórico conforme a política de exclusão de matérias.

#### Scenario: Consultar versão anterior
- **WHEN** a pessoa abre o histórico do próprio roadmap
- **THEN** vê as versões confirmadas anteriores com data e origem
- **AND** pode consultar a sequência de uma versão sem alterar a ativa.

#### Scenario: Restaurar uma versão
- **GIVEN** uma versão anterior disponível
- **WHEN** a pessoa solicita restauração, revisa a sequência conciliada com os passos atualmente concluídos e confirma
- **THEN** a sequência revisada vira a única versão ativa
- **AND** a versão antes ativa e a versão histórica continuam recuperáveis.

#### Scenario: Cancelar restauração
- **WHEN** a pessoa cancela a prévia de restauração
- **THEN** o roadmap ativo e o histórico permanecem inalterados.

### Requirement: Acesso próprio e IA opcional
A EduTrack SHALL restringir geração, confirmação, consulta e restauração aos roadmaps do usuário autenticado. A geração com IA SHALL exigir que a preferência de IA e o módulo de matérias estejam habilitados. A indisponibilidade ou desativação da IA SHALL manter o roadmap manual e o histórico acessíveis conforme as permissões do módulo.

#### Scenario: Acesso a roadmap de outra pessoa
- **WHEN** uma pessoa tenta gerar, confirmar ou recuperar uma versão de roadmap que não lhe pertence
- **THEN** a operação é negada sem revelar conteúdo do roadmap ou das versões.

#### Scenario: IA desativada
- **WHEN** a preferência de IA está desativada
- **THEN** a ação de regeneração com IA não fica disponível
- **AND** a edição manual e a consulta ao histórico continuam disponíveis.

### Requirement: Operação acessível
A interface de reordenação, prévia e histórico SHALL ser utilizável por teclado, oferecer foco visível, instruções compreensíveis e estados acessíveis em viewport de 320 px. Movimento decorativo SHALL respeitar a preferência por movimento reduzido.

#### Scenario: Reordenação por teclado
- **WHEN** a pessoa navega pelos controles de reordenação usando apenas o teclado
- **THEN** consegue mover um passo pendente, abrir a prévia, editá-la e confirmar ou cancelar com indicação de foco e resultado.
