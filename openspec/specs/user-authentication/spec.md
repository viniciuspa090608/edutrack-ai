# user-authentication Specification

## Purpose

Permitir que cada pessoa crie e acesse sua conta EduTrack por senha ou Google, mantenha uma sessão controlável e use áreas pessoais somente quando autenticada.

## Requirements

### Requirement: Cadastro com e-mail e senha
A EduTrack SHALL oferecer cadastro em `/acesso` com e-mail e senha. A API SHALL validar os dados, tratar o e-mail de forma canônica para unicidade, impedir duplicidade e armazenar somente uma representação resistente a ataques da senha, nunca a senha em claro. O cadastro bem-sucedido SHALL criar uma conta pendente, enviar código de confirmação e fornecer apenas um contexto restrito de confirmação. A conta local SHALL NOT acessar a área privada antes da confirmação do endereço.

#### Scenario: Criar conta local
- **GIVEN** um e-mail ainda não cadastrado e uma senha válida
- **WHEN** a pessoa conclui o cadastro
- **THEN** uma conta local pendente é criada e um código de confirmação é enviado
- **AND** a pessoa recebe apenas o fluxo de confirmação, sem acesso à área privada.

#### Scenario: Dados inválidos ou e-mail já usado
- **GIVEN** um e-mail inválido, senha fora da política ou e-mail já cadastrado
- **WHEN** a pessoa tenta concluir o cadastro
- **THEN** a API rejeita a operação sem criar outra conta
- **AND** a interface informa que o cadastro não pôde ser concluído sem expor senha ou detalhes internos.

### Requirement: Login local e resistência a tentativas abusivas
A EduTrack SHALL permitir login com e-mail e senha válidos. Uma conta local confirmada SHALL receber sessão de acesso; uma conta pendente SHALL receber apenas contexto restrito para confirmar o endereço. Credenciais incorretas SHALL receber uma resposta genérica, sem confirmar se o e-mail existe. Tentativas repetidas de cadastro ou login SHALL ser limitadas e resultar em resposta temporária de excesso de tentativas.

#### Scenario: Login válido
- **GIVEN** uma conta local com endereço confirmado
- **WHEN** a pessoa informa e-mail e senha corretos
- **THEN** recebe uma nova sessão e é direcionada à área autenticada.

#### Scenario: Login local pendente
- **GIVEN** uma conta local com endereço ainda não confirmado
- **WHEN** a pessoa informa e-mail e senha corretos
- **THEN** recebe somente contexto para confirmação do endereço
- **AND** não acessa a área privada antes de confirmar.

#### Scenario: Credenciais incorretas
- **WHEN** a pessoa informa um e-mail inexistente ou uma senha incorreta
- **THEN** não recebe sessão
- **AND** vê a mesma mensagem genérica para ambos os casos.

#### Scenario: Muitas tentativas
- **GIVEN** tentativas repetidas acima do limite configurado
- **WHEN** ocorre nova tentativa de cadastro ou login
- **THEN** a API responde com limitação temporária e mensagem segura
- **AND** não cria conta nem sessão nessa tentativa.

### Requirement: Entrada com Google por identidade do provedor
A EduTrack SHALL oferecer entrada com Google. A API SHALL aceitar somente uma resposta OAuth/OIDC válida para a aplicação e associar a identidade ao identificador estável `sub` fornecido pelo Google. Uma identidade Google já vinculada SHALL entrar na mesma conta mesmo que o e-mail apresentado pelo Google mude. Para uma identidade ainda desconhecida, a API SHALL criar conta somente se o e-mail Google estiver verificado e não conflitar com uma conta existente; coincidência de e-mail SHALL NOT mesclar ou vincular contas automaticamente.

#### Scenario: Primeira entrada com Google
- **GIVEN** uma identidade Google válida, com e-mail verificado, `sub` não conhecido e e-mail sem conflito
- **WHEN** a pessoa conclui a entrada com Google
- **THEN** uma conta é criada com a identidade Google vinculada pelo `sub`
- **AND** uma sessão EduTrack é iniciada.

#### Scenario: Retorno com e-mail Google alterado
- **GIVEN** um `sub` Google já vinculado a uma conta
- **WHEN** a pessoa entra com esse Google apresentando outro e-mail
- **THEN** entra na conta já vinculada ao `sub`
- **AND** nenhuma outra conta é associada pelo endereço de e-mail.

#### Scenario: E-mail coincidente com conta local
- **GIVEN** uma conta local com o mesmo e-mail da identidade Google ainda não vinculada
- **WHEN** a pessoa tenta entrar com Google
- **THEN** nenhuma conta é mesclada, criada ou autenticada automaticamente
- **AND** a interface orienta a entrar na conta existente e vincular Google explicitamente.

#### Scenario: Resposta Google inválida
- **GIVEN** resposta Google com estado inválido, expirada, reutilizada ou sem validação OIDC necessária
- **WHEN** o retorno OAuth é processado
- **THEN** nenhuma sessão ou vínculo é criado
- **AND** a pessoa recebe um erro recuperável sem detalhes sensíveis.

### Requirement: Vínculo explícito da conta Google
Uma pessoa autenticada SHALL poder iniciar o vínculo de uma identidade Google à própria conta. A API SHALL exigir uma sessão válida e uma ação explícita de vínculo; SHALL recusar um `sub` já vinculado a outra conta, sem transferir ou mesclar dados. A conta local SHALL continuar acessível por sua senha após um vínculo bem-sucedido.

#### Scenario: Vincular Google à conta local
- **GIVEN** uma pessoa autenticada por senha e uma identidade Google ainda livre
- **WHEN** ela escolhe vincular Google e conclui a autorização do provedor
- **THEN** o `sub` Google passa a apontar para a mesma conta EduTrack
- **AND** os dois meios de entrada passam a acessar essa conta.

#### Scenario: Google já pertence a outra conta
- **GIVEN** um `sub` Google vinculado a outra conta EduTrack
- **WHEN** a pessoa autenticada tenta vinculá-lo
- **THEN** a operação é recusada sem transferir a identidade ou dados entre contas
- **AND** a sessão atual permanece na própria conta.

### Requirement: Sessão persistida e revogável
Após login de conta com endereço confirmado, a EduTrack SHALL manter uma sessão de servidor identificada por um cookie opaco, `HttpOnly`, `SameSite=Lax`, `Secure` em HTTPS e sem acesso por JavaScript. O contexto restrito de confirmação de uma conta pendente SHALL NOT ser aceito como sessão privada. A sessão SHALL sobreviver à recarga e a novas abas até 24 horas de inatividade ou 7 dias desde sua criação, o que ocorrer primeiro. A API SHALL armazenar somente o hash do segredo de sessão, renovar a validade por atividade sem ultrapassar o limite absoluto, e revogar a sessão atual na saída. Credenciais de sessão SHALL NOT ser colocadas em URL ou armazenamento do navegador acessível por JavaScript.

#### Scenario: Recarregar uma área autenticada
- **GIVEN** uma sessão válida e ainda dentro dos dois limites de duração
- **WHEN** a pessoa recarrega a página ou abre uma nova aba
- **THEN** continua autenticada sem novo login.

#### Scenario: Sessão expirada
- **GIVEN** uma sessão sem atividade por 24 horas ou criada há 7 dias
- **WHEN** a pessoa tenta acessar um recurso privado
- **THEN** a API nega acesso e a web apresenta o caminho de login
- **AND** a sessão expirada não é renovada.

#### Scenario: Sair da conta
- **GIVEN** uma sessão válida
- **WHEN** a pessoa seleciona **Sair**
- **THEN** a sessão atual é revogada no servidor e o cookie é removido
- **AND** uma nova tentativa de usar essa sessão é negada.

### Requirement: Proteção de áreas e operações privadas
A área inicial autenticada, a página de conta e os endpoints privados SHALL exigir sessão válida e conta com endereço confirmado. A API SHALL validar autenticação, confirmação e autorização no servidor, independentemente do estado da web, inclusive para sessões emitidas antes desta mudança; consultas futuras de dados de usuário SHALL usar a identidade autenticada como escopo. A web SHALL distinguir verificação de sessão, acesso autorizado, confirmação pendente e sessão ausente ou expirada; uma URL privada aberta diretamente sem acesso SHALL levar a `/acesso` e permitir retorno apenas a um caminho interno permitido após login.

#### Scenario: Abrir área privada sem sessão
- **WHEN** uma pessoa sem sessão abre `/app` diretamente
- **THEN** não vê conteúdo privado e recebe o fluxo de login
- **AND** uma chamada direta ao endpoint privado retorna acesso negado.

#### Scenario: Sessão válida em área privada
- **GIVEN** uma sessão válida de conta com endereço confirmado
- **WHEN** a pessoa abre `/app` ou `/conta`
- **THEN** vê somente informações da própria conta.

#### Scenario: Sessão antiga de conta pendente
- **GIVEN** uma sessão emitida antes da confirmação obrigatória para conta local ainda pendente
- **WHEN** a pessoa tenta abrir `/app` ou chamar um endpoint privado
- **THEN** a API nega acesso e apresenta o caminho de confirmação
- **AND** não mostra dados privados.

#### Scenario: Destino de retorno externo
- **GIVEN** uma URL de retorno externa ou malformada
- **WHEN** a pessoa conclui o login
- **THEN** a web ignora esse destino e abre a área inicial interna.

### Requirement: Proteção das operações de autenticação
Operações autenticadas que alteram estado SHALL recusar requisições de origens não autorizadas. O fluxo Google SHALL validar estado de uso único e vinculação à tentativa iniciada pelo navegador, impedindo que um retorno forjado autentique ou vincule uma identidade. Respostas e logs SHALL excluir senha, segredo de sessão, tokens do Google, código OAuth, hashes e stacks.

#### Scenario: Origem não autorizada
- **GIVEN** uma requisição de alteração de estado com origem diferente da web configurada
- **WHEN** a API a recebe
- **THEN** a operação é recusada antes de alterar conta, vínculo ou sessão.

#### Scenario: Retorno Google forjado
- **GIVEN** um retorno Google sem a tentativa correspondente ou com estado já consumido
- **WHEN** a API o processa
- **THEN** nenhuma identidade é vinculada e nenhuma sessão é iniciada.

### Requirement: Interface acessível e estados de autenticação
Cadastro, login, entrada com Google, vínculo e saída SHALL ser operáveis por teclado, ter rótulos e foco visíveis e permanecer utilizáveis a partir de 320 px sem rolagem horizontal causada pelo layout. A interface SHALL mostrar estados de carregamento, erro e sucesso aplicáveis sem revelar dados sensíveis.

#### Scenario: Formulário em tela estreita
- **GIVEN** uma viewport de 320 px
- **WHEN** a pessoa percorre cadastro ou login por teclado
- **THEN** todos os campos e ações permanecem visíveis, rotulados e operáveis
- **AND** não há rolagem horizontal causada pelo layout.

#### Scenario: Falha de rede durante entrada
- **WHEN** cadastro, login ou retorno de Google falha por indisponibilidade
- **THEN** a interface apresenta erro e caminho para tentar novamente
- **AND** não indica sucesso nem mostra conteúdo privado.
