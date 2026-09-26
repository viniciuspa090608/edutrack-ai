# Spec Delta

## Purpose

Permitir que cada pessoa autenticada mantenha os dados da própria conta EduTrack, com alterações sensíveis protegidas pelos meios de autenticação e confirmação de endereço já definidos.

## ADDED Requirements

### Requirement: Página e dados do próprio perfil

A EduTrack SHALL disponibilizar a página privada `/conta` com foto, nome exibido, e-mail, estado de verificação e meios de entrada cadastrados. Toda leitura ou alteração SHALL ser restrita à conta da sessão autenticada; o cliente SHALL NOT escolher o ID de outra conta. O ID da conta SHALL permanecer estável. O nome exibido SHALL aceitar de 2 a 60 caracteres Unicode após aparar espaços nas extremidades, rejeitar caracteres de controle e SHALL NOT precisar ser único.

#### Scenario: Atualizar nome exibido

- **GIVEN** uma pessoa autenticada com nome válido
- **WHEN** ela salva o novo nome em `/conta`
- **THEN** o perfil e as próximas telas autenticadas exibem esse nome
- **AND** o ID da conta e os dados de outras pessoas permanecem inalterados.

#### Scenario: Nome inválido

- **GIVEN** um nome vazio, longo demais ou com caractere de controle
- **WHEN** a pessoa tenta salvá-lo
- **THEN** a alteração é recusada com erro de campo.

#### Scenario: Nome repetido

- **GIVEN** outra conta usa o mesmo nome exibido
- **WHEN** a pessoa salva um nome válido igual
- **THEN** a alteração é aceita sem fundir as contas.

### Requirement: Foto armazenada na conta

A EduTrack SHALL aceitar uma foto de perfil JPEG, PNG ou WebP de até 2 MiB, com dimensões entre 64 e 4096 pixels por eixo e no máximo 16 milhões de pixels. SHALL validar os bytes reais da imagem, rejeitar arquivo corrompido, animação, tipo incompatível, excesso de tamanho ou dimensões e impedir que conteúdo ativo seja servido como imagem de perfil. A foto processada SHALL ficar no banco de dados, na própria linha da tabela `users`, junto ao nome e ao e-mail. A pessoa SHALL poder substituir e remover a foto; sem foto, a interface SHALL mostrar um avatar padrão.

#### Scenario: Enviar foto válida

- **GIVEN** uma pessoa autenticada e imagem válida dentro dos limites
- **WHEN** ela envia a foto
- **THEN** a nova foto passa a ser exibida no próprio perfil
- **AND** a imagem anterior é substituída na própria conta.

#### Scenario: Enviar arquivo inválido

- **GIVEN** arquivo SVG, animado, corrompido, maior que 2 MiB ou fora das dimensões permitidas
- **WHEN** a pessoa tenta usá-lo como foto
- **THEN** a API rejeita o envio sem mudar a foto existente
- **AND** a interface informa o formato ou limite aplicável.

#### Scenario: Remover foto

- **GIVEN** uma conta com foto
- **WHEN** a pessoa a remove
- **THEN** os bytes da foto deixam de estar associados à conta
- **AND** o avatar padrão aparece.

### Requirement: Alteração verificada de e-mail

A pessoa autenticada SHALL poder pedir a troca do e-mail da conta após provar novamente sua identidade: senha atual para conta com credencial local ou nova autenticação com a identidade Google já vinculada. A EduTrack SHALL enviar um código ao novo endereço e manter o e-mail atual como endereço de login e recuperação até a confirmação. O código SHALL expirar em 10 minutos, aceitar no máximo 5 tentativas e ter uso único; reenvio SHALL invalidar o anterior, respeitar 60 segundos e no máximo 3 emissões por hora. A troca SHALL recusar endereço canônico já usado ou reservado por outra conta. Ao confirmar, SHALL atualizar o e-mail da própria conta de forma atômica, invalidar recuperações e trocas pendentes, revogar sessões e exigir novo login. A identidade Google SHALL continuar vinculada pelo `sub`, ainda que o e-mail da conta mude.

#### Scenario: Solicitar e confirmar novo e-mail

- **GIVEN** uma pessoa reautenticada e endereço novo disponível
- **WHEN** ela pede a troca e confirma o código recebido no endereço novo
- **THEN** o novo endereço passa a ser usado para login e recuperação
- **AND** o endereço anterior deixa de ser usado, as sessões anteriores são revogadas e é exigido novo login.

#### Scenario: Troca pendente ou código inválido

- **GIVEN** uma solicitação pendente e código incorreto, vencido, substituído ou bloqueado
- **WHEN** a pessoa tenta concluir a troca
- **THEN** o e-mail atual permanece ativo
- **AND** nenhuma sessão ou identidade Google é transferida.

#### Scenario: Conta exclusiva do Google muda e-mail

- **GIVEN** uma conta sem senha local
- **WHEN** a pessoa reautentica com o mesmo `sub` Google e confirma o código no novo e-mail
- **THEN** o e-mail da conta é atualizado sem criar senha local
- **AND** a próxima entrada com o mesmo `sub` continua acessando a mesma conta.

#### Scenario: Novo e-mail já usado

- **GIVEN** um endereço pertencente a outra conta ou reservado por troca pendente
- **WHEN** a pessoa tenta escolhê-lo
- **THEN** a troca é recusada sem mesclar contas nem alterar o e-mail atual.

### Requirement: Alteração de senha local

Uma conta com senha local SHALL poder alterá-la fornecendo a senha atual e uma nova senha que cumpra a política da autenticação. A alteração bem-sucedida SHALL revogar todas as sessões e autorizações de recuperação e exigir novo login. Se a senha atual foi esquecida, a interface SHALL apontar para **Esqueci minha senha**. Conta exclusiva do Google SHALL NOT receber formulário para alterar senha local inexistente nem ganhar uma senha por esse caminho; a interface SHALL orientar o gerenciamento do acesso Google.

#### Scenario: Alterar senha local

- **GIVEN** conta com senha local, senha atual correta e nova senha válida
- **WHEN** a pessoa salva a nova senha
- **THEN** a senha anterior e as sessões antigas deixam de funcionar
- **AND** a nova senha funciona após novo login.

#### Scenario: Conta exclusiva do Google

- **GIVEN** conta sem credencial local
- **WHEN** a pessoa abre as opções de segurança do perfil
- **THEN** não vê ação de alteração de senha da EduTrack
- **AND** encontra orientação para gerenciar ou recuperar sua conta Google.

### Requirement: Interface de perfil acessível e segura

Os formulários SHALL apresentar estados de carregamento, validação, erro, espera por código e sucesso sem divulgar senha, código ou segredo em URL, logs ou resposta. A página SHALL funcionar por teclado, com foco visível e mensagens anunciadas, e caber desde 320 px sem rolagem horizontal causada pelo layout. Uma falha de rede SHALL preservar o estado anterior confirmado até que a operação seja verificada.

#### Scenario: Falha durante atualização

- **GIVEN** uma pessoa editando o perfil
- **WHEN** a requisição falha por indisponibilidade
- **THEN** a interface informa a falha e oferece nova tentativa
- **AND** não apresenta o dado editado como salvo sem confirmação do servidor.
