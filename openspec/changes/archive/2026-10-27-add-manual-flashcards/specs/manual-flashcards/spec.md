# Spec Delta

## Purpose

Permitir que cada pessoa mantenha baralhos e cartões de pergunta e resposta e revele respostas durante uma consulta manual, sem depender de IA ou revisão programada.

## ADDED Requirements

### Requirement: Criar e consultar baralhos próprios

A EduTrack SHALL permitir criar baralhos com nome obrigatório, descrição opcional e associação opcional a uma matéria própria. A pessoa SHALL poder listar seus baralhos e consultar o detalhe de cada um, inclusive quando estiver vazio. Nome vazio ou inválido SHALL ser rejeitado sem criar baralho parcial. A listagem SHALL ter ordem estável e paginação.

#### Scenario: Baralho sem matéria
- **WHEN** a pessoa autenticada cria um baralho válido sem selecionar matéria
- **THEN** o baralho aparece em sua lista com associação ausente
- **AND** pode receber cartões normalmente.

#### Scenario: Lista vazia
- **WHEN** a pessoa sem baralhos abre o módulo
- **THEN** vê um estado vazio com ação para criar o primeiro baralho.

### Requirement: Editar e excluir baralhos

O proprietário SHALL poder alterar nome, descrição e matéria opcional de um baralho sem perder seus cartões. Excluir um baralho SHALL exigir confirmação na interface e remover seus cartões; cancelar SHALL preservar tudo. Uma falha de edição ou exclusão SHALL manter o estado anterior confirmado e ser comunicada.

#### Scenario: Trocar matéria do baralho
- **GIVEN** um baralho próprio com cartões
- **WHEN** o proprietário associa ou remove uma matéria própria
- **THEN** a nova associação aparece após recarga e os cartões permanecem.

#### Scenario: Exclusão cancelada ou confirmada
- **GIVEN** um baralho com cartões
- **WHEN** a pessoa cancela a confirmação de exclusão
- **THEN** baralho e cartões permanecem
- **AND** quando confirma a exclusão, ambos deixam de estar disponíveis.

### Requirement: Criar e consultar cartões manuais

Dentro de um baralho próprio, a pessoa SHALL poder criar cartões com frente e verso textuais obrigatórios, respectivamente pergunta ou conceito e resposta. A pessoa SHALL poder listar os cartões do baralho e abrir um cartão individual. Frente ou verso vazio após remover espaços SHALL ser rejeitado sem cartão parcial. Um baralho vazio SHALL exibir ação para adicionar seu primeiro cartão.

#### Scenario: Cartão válido
- **WHEN** o proprietário cria um cartão com frente e verso válidos
- **THEN** o cartão aparece no baralho e ambos os lados estão disponíveis para consulta.

#### Scenario: Conteúdo inválido
- **WHEN** o proprietário envia frente ou verso vazio
- **THEN** recebe erro no campo correspondente e nenhum cartão é criado.

### Requirement: Editar e excluir cartões

O proprietário SHALL poder alterar frente e verso de um cartão e excluí-lo sem modificar os outros cartões. A exclusão SHALL exigir confirmação na interface; falha SHALL preservar o cartão e permitir nova tentativa. Um ID de cartão de outro baralho SHALL NOT ser aceito como filho do baralho informado.

#### Scenario: Editar somente a resposta
- **WHEN** o proprietário muda o verso de um cartão próprio
- **THEN** a nova resposta aparece ao reabrir o cartão e a frente permanece.

#### Scenario: Excluir um cartão
- **GIVEN** dois cartões em um baralho
- **WHEN** o proprietário confirma excluir um deles
- **THEN** apenas o cartão escolhido deixa de aparecer.

### Requirement: Revelar resposta por ação explícita

Ao abrir um cartão para consulta, a interface SHALL mostrar primeiro a frente e ocultar visualmente o verso até a ação **Revelar resposta**. Após a ação, SHALL mostrar o verso e oferecer retorno à frente ou navegação para outro cartão; ao abrir outro cartão, sua resposta SHALL iniciar oculta. Revelar SHALL NOT registrar avaliação, alterar status, criar agendamento ou depender de repetição espaçada.

#### Scenario: Revelação manual
- **GIVEN** um cartão com pergunta e resposta
- **WHEN** a pessoa abre o cartão e depois aciona **Revelar resposta**
- **THEN** primeiro vê apenas a pergunta e depois vê a resposta
- **AND** a consulta não muda os dados do cartão.

### Requirement: Vínculo opcional e seguro com matéria

Uma associação nova ou alterada SHALL aceitar somente matéria própria existente e com módulo de matérias habilitado. ID inexistente ou de outra pessoa SHALL ser tratado como não encontrado e não SHALL modificar o baralho. Desativar matérias SHALL preservar vínculos existentes, mas impedir novos vínculos; baralhos e cartões SHALL continuar utilizáveis sem expor conteúdo de matérias bloqueadas. Excluir uma matéria SHALL remover apenas a associação dos baralhos e SHALL preservar baralhos e cartões.

#### Scenario: Matéria alheia
- **WHEN** a pessoa tenta associar seu baralho a uma matéria de outra conta
- **THEN** a operação é rejeitada como matéria não encontrada e o vínculo anterior permanece.

#### Scenario: Matéria excluída ou desativada
- **GIVEN** um baralho associado a matéria própria
- **WHEN** a matéria é excluída
- **THEN** o baralho e seus cartões permanecem sem matéria
- **AND** com matérias apenas desativadas, o vínculo armazenado é preservado e o baralho continua consultável.

### Requirement: Isolamento por usuário e preferência do módulo

Toda operação de baralho ou cartão SHALL exigir sessão válida e limitar leituras e mutações ao usuário autenticado. IDs alheios ou inexistentes SHALL produzir a mesma resposta de não encontrado, sem revelar conteúdo. O servidor SHALL ignorar `userId` fornecido pelo cliente como fonte de autorização. Quando flashcards estiverem desativados nas preferências da pessoa, navegação e páginas do módulo SHALL ficar indisponíveis e a API SHALL recusar suas operações sem apagar dados; ao reativar, os dados SHALL reaparecer. IA desativada SHALL NOT bloquear o CRUD ou a consulta manual.

#### Scenario: Acesso cruzado
- **GIVEN** baralhos e cartões de duas contas
- **WHEN** uma conta tenta consultar, editar ou excluir IDs da outra
- **THEN** recebe não encontrado e nenhum dado da outra conta é alterado.

#### Scenario: IA e flashcards desativados separadamente
- **GIVEN** IA desativada e flashcards ativos
- **WHEN** a pessoa cria, consulta ou revela um cartão
- **THEN** o fluxo manual funciona sem chamada de IA
- **AND** se desativar flashcards, suas páginas e operações ficam bloqueadas até reativação, preservando os cartões.

### Requirement: Interface manual acessível

Listas, formulários e visualização do cartão SHALL distinguir carregamento, erro, vazio e sucesso quando aplicáveis, ter rótulos e foco visível, operar por teclado e ser legíveis desde 320 px sem rolagem horizontal do layout. A resposta revelada SHALL ser identificável sem depender somente de animação, e preferências de movimento reduzido SHALL ser respeitadas.

#### Scenario: Revelar por teclado
- **GIVEN** uma tela de 320 px e navegação por teclado
- **WHEN** a pessoa abre um cartão e revela a resposta
- **THEN** os controles e o conteúdo permanecem acessíveis e a resposta é identificada claramente.
