# Spec Delta

## Purpose

Confirmar que a pessoa controla o endereço usado por uma conta local antes de permitir acesso privado e manter um caminho seguro para reenviar a confirmação.

## ADDED Requirements

### Requirement: Confirmação obrigatória de conta local

Após cadastrar e-mail e senha, a EduTrack SHALL criar a conta com endereço não confirmado e enviar um código de confirmação ao endereço informado. Até a confirmação, a API SHALL impedir acesso à área privada e aos endpoints privados, inclusive com uma sessão emitida antes desta mudança. Um login local com credenciais válidas, mas endereço não confirmado, SHALL levar ao fluxo de confirmação sem conceder acesso privado. Após confirmação válida, a pessoa SHALL poder entrar na conta.

#### Scenario: Cadastro local aguarda confirmação

- **GIVEN** um e-mail ainda não cadastrado e uma senha válida
- **WHEN** a pessoa conclui o cadastro
- **THEN** recebe instrução para inserir o código enviado por e-mail
- **AND** não obtém acesso à área privada antes de confirmar o endereço.

#### Scenario: Login local de conta pendente

- **GIVEN** uma conta local com e-mail não confirmado
- **WHEN** a pessoa informa suas credenciais válidas
- **THEN** é direcionada à confirmação ou recebe meios para solicitar novo código
- **AND** não acessa conteúdo privado.

#### Scenario: Código válido confirma a conta

- **GIVEN** um código vigente para a conta local pendente
- **WHEN** a pessoa o apresenta corretamente
- **THEN** o endereço é marcado como confirmado e o código não pode ser reutilizado
- **AND** a pessoa pode concluir a entrada na área privada.

### Requirement: Validade, reenvio e limite de tentativas da confirmação

Cada código de confirmação SHALL ser de uso único, expirar em 10 minutos e aceitar no máximo 5 tentativas de validação. Um reenvio SHALL invalidar o código anterior, exigir intervalo mínimo de 60 segundos e limitar a emissão a 3 códigos por endereço em uma hora. Código vencido, substituído, já usado ou bloqueado SHALL NOT confirmar a conta. Os limites SHALL ser aplicados no servidor e uma conta já confirmada SHALL NOT receber novo código de confirmação.

#### Scenario: Reenviar código

- **GIVEN** uma conta local pendente e elegível para reenvio
- **WHEN** a pessoa solicita outro código
- **THEN** recebe novo código no endereço cadastrado
- **AND** o código anterior deixa de funcionar.

#### Scenario: Código inválido ou expirado

- **GIVEN** código incorreto, expirado ou substituído
- **WHEN** a pessoa tenta confirmar o endereço
- **THEN** a conta permanece não confirmada
- **AND** a interface informa como tentar novamente ou solicitar novo código, sem mostrar o código correto.

#### Scenario: Limite de emissão ou validação

- **GIVEN** o limite de reenvios ou tentativas foi atingido
- **WHEN** ocorre nova solicitação ou validação
- **THEN** a operação é recusada temporariamente sem confirmar a conta
- **AND** a interface informa quando uma nova tentativa será permitida.

### Requirement: Identidade Google e estado do endereço

Uma conta criada exclusivamente por Google SHALL ter seu endereço considerado confirmado somente após a EduTrack validar a identidade Google e a declaração `email_verified` do provedor. Essa conta SHALL NOT depender de um código de confirmação da EduTrack para entrar. Um endereço local pendente SHALL NOT ser confirmado apenas por coincidência com o e-mail de uma identidade Google nem permitir vínculo automático de contas.

#### Scenario: Primeira entrada Google com e-mail verificado

- **GIVEN** identidade Google nova e válida com `email_verified` verdadeiro e sem conflito de endereço
- **WHEN** a pessoa conclui a entrada com Google
- **THEN** a conta Google é criada com endereço confirmado e pode acessar a área privada
- **AND** nenhum código de confirmação da EduTrack é enviado.

#### Scenario: Coincidência com conta local pendente

- **GIVEN** uma conta local pendente com o mesmo e-mail apresentado por identidade Google ainda não vinculada
- **WHEN** a pessoa tenta entrar com Google
- **THEN** a EduTrack não confirma, mescla ou vincula automaticamente a conta local
- **AND** segue a regra de conflito de identidade da autenticação.

### Requirement: Interface de confirmação acessível e resiliente

O fluxo SHALL apresentar estados de envio, erro, sucesso, expiração e espera para reenvio; permitir correção do código, operação por teclado e leitura por tecnologias assistivas; e permanecer utilizável desde 320 px sem rolagem horizontal causada pelo layout. Uma falha de rede SHALL manter uma opção de nova tentativa sem aparentar confirmação bem-sucedida.

#### Scenario: Falha de rede na confirmação

- **GIVEN** a pessoa informou um código
- **WHEN** a requisição falha por indisponibilidade
- **THEN** a interface indica a falha e permite tentar novamente
- **AND** não apresenta a conta como confirmada.
