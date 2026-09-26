# Spec Delta

## Purpose

Permitir que uma pessoa gere e revise um roadmap de estudo para uma matéria existente, mantendo o conteúdo da IA sob seu controle antes da persistência.

## ADDED Requirements

### Requirement: CRUD manual de roadmaps pertencentes à matéria

A EduTrack SHALL permitir criar, listar, consultar, editar e excluir múltiplos roadmaps da matéria própria sem depender de IA. Cada roadmap SHALL conter título e descrição não vazios e de 1 a 20 blocos ordenados; cada bloco SHALL conter título e descrição e de 1 a 20 passos ordenados com título e descrição. Títulos SHALL ter até 120 caracteres e descrições até 1000, aparados. A edição completa SHALL ser atômica e preservar roadmaps distintos e o plano simples existente. A lista SHALL ser paginada e ordenada estavelmente; IDs alheios ou fora da matéria SHALL retornar não encontrado. A web SHALL exigir confirmação de exclusão e permitir edição e reordenação por teclado, inclusive com IA desativada ou sem provedor.

#### Scenario: Roadmap manual sem IA
- **GIVEN** uma matéria própria com plano simples e IA desativada
- **WHEN** a pessoa cria, edita e reordena blocos e passos manualmente
- **THEN** a consulta posterior apresenta a versão e a ordem salvas, sem chamada ao provedor
- **AND** o plano simples e os outros roadmaps permanecem intactos.

#### Scenario: Edição inválida ou de outra conta
- **WHEN** a pessoa envia edição com bloco sem passos ou identifica roadmap alheio
- **THEN** a API rejeita a alteração e nenhum conteúdo parcial é salvo.

#### Scenario: Exclusão explícita
- **WHEN** a pessoa cancela a confirmação de exclusão de um roadmap
- **THEN** seus dados permanecem disponíveis
- **AND** ao confirmar a exclusão, somente esse roadmap e seus blocos/passos são removidos.

### Requirement: Geração disponível somente para matéria própria com IA habilitada

A EduTrack SHALL oferecer **Aprimorar com IA** apenas em matéria existente da conta autenticada quando o módulo de matérias e os recursos de IA estiverem habilitados. A API SHALL conferir essas condições em toda solicitação de geração e salvamento; identificadores de matéria alheia ou inexistente SHALL ser tratados como não encontrados, sem revelar dados de outra conta. Quando a IA estiver desabilitada, a API SHALL recusar a geração antes de contatar o provedor.

#### Scenario: IA desabilitada
- **GIVEN** uma matéria própria e recursos de IA desabilitados
- **WHEN** a pessoa abre a matéria ou tenta gerar um roadmap por chamada direta
- **THEN** **Aprimorar com IA** não aparece e a API recusa a chamada sem contatar o provedor
- **AND** a organização manual da matéria continua disponível.

#### Scenario: Matéria de outra pessoa
- **GIVEN** um identificador de matéria pertencente a outra conta
- **WHEN** a pessoa solicita geração ou tenta salvar um roadmap para esse identificador
- **THEN** a API responde como matéria não encontrada e não apresenta nem altera dados da outra conta.

### Requirement: Parâmetros suficientes e validados para geração

A geração SHALL solicitar nível atual, objetivo de estudo, prazo futuro, quantidade positiva de horas disponíveis por semana e lista de assuntos já conhecidos, que pode estar vazia. A EduTrack SHALL validar esses dados antes de solicitar a IA e SHALL deixar claro a qual matéria o roadmap pertencerá. A resposta gerada SHALL organizar blocos ordenados, cada qual com passos ordenados, de modo coerente com os dados fornecidos; a interface SHALL exibir os parâmetros usados junto da prévia.

#### Scenario: Parâmetros inválidos
- **WHEN** a pessoa informa prazo vencido ou horas semanais não positivas
- **THEN** recebe erro associado ao campo e nenhuma geração é iniciada.

#### Scenario: Assuntos conhecidos
- **GIVEN** assuntos já conhecidos informados
- **WHEN** a geração é solicitada
- **THEN** esses assuntos compõem o contexto enviado para a geração
- **AND** os parâmetros permanecem visíveis na prévia para revisão.

### Requirement: Resposta da IA validada antes da prévia

A API SHALL tratar a saída do provedor como não confiável, validar sua estrutura e limites antes de devolvê-la à interface, e SHALL recusar respostas inválidas, vazias ou excessivas com mensagem recuperável. A prévia SHALL exibir somente blocos e passos aprovados pela validação. Uma falha ou interrupção do provedor SHALL permitir nova tentativa sem criar ou alterar roadmap persistido.

#### Scenario: Resposta inválida
- **WHEN** o provedor retorna um bloco sem passos, campos obrigatórios ausentes ou conteúdo acima dos limites aceitos
- **THEN** a API rejeita a geração e a interface informa a falha e oferece nova tentativa
- **AND** nenhum conteúdo gerado é salvo.

### Requirement: Prévia editável e confirmação explícita

Após gerar, a pessoa SHALL ver todos os blocos e passos antes do salvamento e SHALL poder editar, adicionar, excluir e reordenar blocos e passos. A interface SHALL oferecer ações distintas para salvar a versão visível ou cancelar. O servidor SHALL validar novamente a versão enviada ao salvar, exigir confirmação explícita da pessoa e persistir o roadmap na matéria própria apenas após essa ação; geração, prévia, edição local, cancelamento ou fechamento da página SHALL NOT persistir conteúdo gerado. O salvamento SHALL ser atômico e devolver o roadmap persistido. Um roadmap existente SHALL NOT ser substituído implicitamente por essa geração.

#### Scenario: Salvar sem edição
- **GIVEN** uma prévia válida
- **WHEN** a pessoa confirma salvar sem mudar o conteúdo
- **THEN** o roadmap exibido é persistido para a matéria própria e aparece na consulta posterior.

#### Scenario: Editar antes de salvar
- **GIVEN** uma prévia válida
- **WHEN** a pessoa modifica e reordena os passos e confirma salvar
- **THEN** a versão revisada é validada e persistida, preservando a ordem mostrada.

#### Scenario: Cancelar ou sair
- **GIVEN** uma prévia gerada
- **WHEN** a pessoa cancela ou sai da página sem confirmar o salvamento
- **THEN** nenhum conteúdo gerado é persistido e os roadmaps anteriores permanecem intactos.

#### Scenario: Versão editada inválida
- **GIVEN** uma prévia cuja edição removeu todos os passos de um bloco
- **WHEN** a pessoa tenta salvar
- **THEN** o salvamento é recusado com erro editável e nenhum conteúdo parcial é persistido.

### Requirement: Continuidade do fluxo manual e limites de experiência

Criar, consultar e editar manualmente matérias e roadmaps SHALL continuar funcionando quando a IA ou seu provedor estiver indisponível. A prévia SHALL expor estados de carregamento, erro e sucesso, funcionar por teclado, manter foco e mensagens acessíveis e ser utilizável a partir de 320 px. A geração SHALL NOT alterar tarefas, sessões Pomodoro ou outros módulos.

#### Scenario: Provedor indisponível
- **GIVEN** matérias habilitadas e provedor de IA indisponível
- **WHEN** a pessoa usa a organização manual da matéria
- **THEN** a ação manual é concluída sem depender do provedor
- **AND** a eventual falha da geração é mostrada apenas no seu próprio fluxo.
