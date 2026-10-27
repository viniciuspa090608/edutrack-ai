# Spec Delta

## Purpose

Restabelecer o acesso de quem possui senha local mediante prova temporária de controle do e-mail e orientar quem depende exclusivamente do Google ao método de recuperação apropriado.

## ADDED Requirements

### Requirement: Solicitação de recuperação sem enumeração de contas

A página de acesso SHALL oferecer **Esqueci minha senha**. A solicitação de recuperação por e-mail SHALL devolver a mesma confirmação pública para endereço inexistente, conta com senha local e conta exclusiva do Google, sem revelar se existe conta ou senha cadastrada. Somente uma conta com senha local SHALL receber código de redefinição da EduTrack. A interface SHALL mostrar, para todas as pessoas, que contas criadas apenas com Google devem usar **Entrar com Google** ou recuperar primeiro a conta junto ao Google.

#### Scenario: Solicitação para conta local

- **GIVEN** uma conta com senha local
- **WHEN** a pessoa solicita recuperação para seu e-mail
- **THEN** recebe confirmação pública genérica e um código de redefinição no endereço cadastrado.

#### Scenario: Solicitação para conta exclusiva do Google

- **GIVEN** uma conta sem senha local, vinculada apenas ao Google
- **WHEN** a pessoa solicita recuperação para seu e-mail
- **THEN** recebe a mesma confirmação pública genérica
- **AND** a EduTrack não envia código para redefinir senha inexistente nem cria uma senha local.

#### Scenario: Endereço não cadastrado

- **GIVEN** um endereço sem conta EduTrack
- **WHEN** a pessoa solicita recuperação
- **THEN** recebe a mesma confirmação pública genérica
- **AND** nenhum código de redefinição é enviado.

### Requirement: Redefinição por código temporário

Uma conta com senha local SHALL poder validar um código de recuperação recebido por e-mail e, após essa validação, definir nova senha conforme a política de senha da autenticação. O código SHALL expirar em 10 minutos, ter uso único e no máximo 5 tentativas de validação. A validação SHALL conceder apenas uma autorização de redefinição de uso único, válida por 5 minutos, sem criar sessão de acesso à conta. A conclusão SHALL substituir a senha, confirmar o endereço se ainda estiver pendente, invalidar todos os demais códigos e autorizações de recuperação da conta, revogar todas as sessões EduTrack da conta e exigir novo login. Código ou autorização vencido, substituído, consumido ou bloqueado SHALL NOT alterar a senha.

#### Scenario: Recuperação concluída

- **GIVEN** código válido recebido por uma conta com senha local
- **WHEN** a pessoa valida o código e define uma nova senha válida dentro do prazo
- **THEN** a senha anterior deixa de autenticar, as sessões anteriores são revogadas e a nova senha pode ser usada no login
- **AND** o código e a autorização não podem ser reutilizados.

#### Scenario: Conta local ainda pendente

- **GIVEN** conta com senha local e e-mail ainda não confirmado
- **WHEN** a pessoa valida o código de recuperação e conclui a redefinição
- **THEN** o e-mail fica confirmado, pois o código provou o controle do endereço
- **AND** a pessoa ainda precisa fazer novo login para acessar a área privada.

#### Scenario: Código inválido ou expirado

- **GIVEN** código incorreto, expirado, substituído ou usado
- **WHEN** a pessoa tenta validá-lo
- **THEN** não recebe autorização de redefinição
- **AND** a senha e as sessões permanecem inalteradas.

#### Scenario: Autorização inválida ou senha fora da política

- **GIVEN** autorização de redefinição inválida ou uma nova senha fora da política
- **WHEN** a pessoa tenta concluir a redefinição
- **THEN** a senha não é alterada e nenhuma sessão é iniciada
- **AND** a interface mostra o erro aplicável sem expor dados internos.

### Requirement: Reenvio e proteção contra abuso na recuperação

Nova solicitação para o mesmo endereço SHALL invalidar o código e a autorização anteriores quando houver conta com senha local, exigir pelo menos 60 segundos entre emissões e limitar a 3 códigos por endereço em uma hora. Emissão e validação SHALL ter limites adicionais por origem da requisição; as respostas públicas da solicitação SHALL preservar a mesma informação sobre existência e tipo de conta, inclusive quando limitadas. Os limites SHALL sobreviver a reinício da API e a requisições em instâncias diferentes.

#### Scenario: Solicitar novo código

- **GIVEN** conta com senha local dentro dos limites de emissão
- **WHEN** a pessoa solicita outro código após o intervalo mínimo
- **THEN** o novo código substitui o anterior
- **AND** somente o novo código pode iniciar uma redefinição.

#### Scenario: Tentativas excessivas

- **GIVEN** o código atingiu o limite de validações ou a origem atingiu o limite de requisições
- **WHEN** ocorre nova tentativa
- **THEN** nenhuma autorização ou alteração de senha é concedida
- **AND** a interface informa a restrição temporária sem identificar o tipo de conta.

### Requirement: Recuperação de conta exclusiva do Google

Uma conta sem senha local SHALL recuperar o acesso à EduTrack pela autenticação com a mesma identidade Google vinculada à conta. Se a pessoa perdeu o acesso a essa identidade, a EduTrack SHALL orientá-la a usar a recuperação de conta do Google e então retornar a **Entrar com Google**. A EduTrack SHALL NOT aceitar apenas controle do endereço de e-mail como prova para vincular outro Google ou criar senha local na conta existente.

#### Scenario: Acesso Google recuperado

- **GIVEN** conta EduTrack exclusiva do Google e acesso restabelecido à identidade Google vinculada
- **WHEN** a pessoa conclui **Entrar com Google** usando essa identidade
- **THEN** entra na mesma conta EduTrack sem redefinição de senha local.

#### Scenario: Outra identidade com mesmo e-mail

- **GIVEN** conta exclusiva do Google e outra identidade Google que apresenta o mesmo e-mail
- **WHEN** a pessoa tenta usá-la para recuperar a conta EduTrack
- **THEN** a EduTrack não transfere a conta nem seus dados para essa identidade
- **AND** orienta a recuperar a identidade Google originalmente vinculada.

### Requirement: Interface de recuperação acessível e segura

Solicitação, validação do código e nova senha SHALL oferecer estados de carregamento, erro, sucesso e expiração, ser operáveis por teclado e tecnologias assistivas e permanecer utilizáveis desde 320 px sem rolagem horizontal causada pelo layout. Senhas, códigos e autorizações SHALL NOT aparecer em URLs, respostas de erro ou logs. Falha de rede SHALL permitir nova tentativa sem indicar conclusão falsa.

#### Scenario: Falha de rede ao definir senha

- **GIVEN** a pessoa informou nova senha
- **WHEN** a requisição falha por indisponibilidade
- **THEN** a interface indica que o resultado precisa ser verificado e oferece caminho seguro para tentar login ou solicitar novo código
- **AND** não mostra a redefinição como concluída sem confirmação do servidor.
