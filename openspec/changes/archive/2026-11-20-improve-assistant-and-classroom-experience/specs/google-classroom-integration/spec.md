## MODIFIED Requirements

### Requirement: Seleção explícita e módulos independentes
O sistema SHALL listar somente turmas acessíveis ativas de forma paginada e permitir selecionar e alterar apenas as próprias turmas autorizadas, sem importar turmas não selecionadas. Matérias habilitadas SHALL permitir associar cada turma a uma matéria própria existente ou criar uma após revisão dos dados obrigatórios. Tarefas habilitadas SHALL permitir importar atividades; com matérias desligadas, SHALL criar tarefas sem vínculo, preservando a origem. Com tarefas desligadas, SHALL importar somente matérias; com ambos desligados, SHALL explicar a indisponibilidade sem ativar módulos. Preferências SHALL ser verificadas também durante processamento.

#### Scenario: Somente tarefas habilitadas
- **WHEN** a pessoa importa atividades de duas turmas selecionadas com matérias desligadas
- **THEN** recebe tarefas sem matéria com identificação e link da origem e nenhuma matéria é criada ou alterada.

#### Scenario: Módulo desativado durante operação
- **WHEN** o usuário desativa tarefas enquanto uma importação está em execução
- **THEN** itens ainda não confirmados desse módulo são ignorados com motivo, sem novas escritas no módulo desativado.

#### Scenario: Turmas arquivadas e seleção antiga

- **WHEN** a conta possui turmas ativas e arquivadas ou uma turma selecionada passa a arquivada
- **THEN** somente ativas aparecem na seleção e a API impede importar a turma arquivada com motivo seguro, preservando conteúdo local já importado.

## ADDED Requirements

### Requirement: Seleção em lote com controles padronizados

A seleção de matérias SHALL usar checkboxes quadrados e proporcionais aos controles da plataforma, com rótulo acionável e foco visível. A ação textual “Selecionar todas as matérias” SHALL selecionar todas as turmas ativas acessíveis, incluindo páginas ainda não carregadas, sem iniciar importação nem descartar destinos já configurados. Durante a busca SHALL informar carregamento e impedir comandos concorrentes. Falha de paginação SHALL ser explicada e SHALL NOT apresentar seleção parcial como completa. O usuário SHALL poder desmarcar individualmente após a seleção em lote.

#### Scenario: Selecionar além da primeira página

- **WHEN** há turmas ativas distribuídas em mais de uma página e a pessoa aciona “Selecionar todas as matérias”
- **THEN** todas as ativas acessíveis são selecionadas uma única vez, preservando destinos e sem importar automaticamente.

#### Scenario: Falha e teclado

- **WHEN** ocorre falha ao buscar uma página ou a pessoa usa somente teclado
- **THEN** a interface informa a falha sem declarar seleção completa e os checkboxes quadrados permanecem operáveis com foco visível.

### Requirement: Resumo visual e detalhes em modal

O resultado SHALL exibir estado e contagens reais em badges com texto e cores coerentes com a plataforma, distinguindo adições, atualizações, itens sem alteração, ignorados, conflitos e erros nos dois temas. “Mais detalhes” SHALL abrir um modal com itens separados em Disciplinas e Tarefas, com seção adicional para pendências de turmas quando houver. O modal SHALL preservar identificação, motivo seguro, revisão de conflitos e acesso paginado a todos os itens. SHALL ter título acessível, fechamento por teclado, foco contido enquanto aberto e retorno de foco ao acionador. Conteúdo extenso SHALL rolar dentro do modal e funcionar desde 320 px. A lista detalhada SHALL permanecer oculta até a abertura explícita.

#### Scenario: Importação parcial

- **WHEN** há 91 tarefas adicionadas, 12 disciplinas ignoradas e 3 tarefas com erro
- **THEN** o resumo informa resultado parcial e essas contagens com badges; os motivos ficam disponíveis em “Mais detalhes”, nas categorias corretas.

#### Scenario: Paginação e falha de turma

- **WHEN** existem mais itens que a página atual e uma turma falhou antes de gerar uma disciplina
- **THEN** o modal permite percorrer todos os resultados, mantém a falha de turma identificável e não apresenta ausência na página como ausência em toda a operação.

### Requirement: Seleção recolhida após processamento

Após uma operação terminar, inclusive parcial ou falha, a lista de matérias e seus formulários SHALL ficar recolhida, mantendo o resumo visível e a ação “Alterar seleção de matérias”. Reabrir SHALL preservar seleções e destinos da conta atual. Recarregar SHALL recuperar esse estado de resultado sem iniciar nova operação. Recolher SHALL NOT excluir disciplinas, tarefas ou associações persistidas.

#### Scenario: Resultado recuperado após recarga

- **WHEN** a pessoa recarrega a conta após uma importação parcial e depois altera a seleção
- **THEN** vê primeiro o resumo com seleção recolhida e pode reabrir os destinos salvos sem importar automaticamente.

### Requirement: Orientação para pendências sem perda silenciosa

Quando o módulo de disciplinas estiver ativo e faltar destino, o sistema SHALL orientar a escolher uma disciplina existente ou revisar os campos obrigatórios de uma nova antes de iniciar a operação, permitindo escolher explicitamente importar apenas tarefas da turma quando habilitado. Uma disciplina ignorada por falta de destino SHALL ser explicada como ausência de configuração e SHALL NOT parecer erro de comunicação com Google. Descrições acima do limite vigente de 2.000 caracteres SHALL indicar o limite e orientar a revisar o conteúdo na origem; SHALL NOT ser truncadas silenciosamente. Itens válidos SHALL continuar sendo importados. Após correção da origem, uma nova tentativa SHALL permitir processar o item preservando sucessos e idempotência. Alterar destino SHALL exigir salvar a seleção e iniciar nova solicitação, sem reutilizar silenciosamente o destino antigo de uma operação.

#### Scenario: Destino não configurado

- **WHEN** uma turma está selecionada sem destino e disciplinas estão habilitadas
- **THEN** a interface explica o que falta e oferece configurar o destino ou a escolha explícita de somente tarefas, quando tarefas estiverem habilitadas.

#### Scenario: Descrição extensa e recuperação

- **WHEN** uma atividade possui descrição acima de 2.000 caracteres e outras são válidas
- **THEN** as válidas são preservadas, a atividade extensa recebe motivo e orientação claros e pode ser importada após correção e nova tentativa sem duplicar os sucessos.

#### Scenario: Destino corrigido após resultado

- **WHEN** a pessoa reabre a seleção para configurar uma disciplina antes ignorada
- **THEN** a interface salva o novo destino e inicia uma nova solicitação explícita que o utiliza, preservando as tarefas já importadas.
