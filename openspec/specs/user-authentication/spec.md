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

### Requirement: Seleção do modo de acesso por URL
A tela `/acesso` SHALL abrir login com `mode=login` e cadastro com `mode=register`, incluindo acesso direto, recarga e navegação para outro modo na mesma rota. Ausência ou valor não reconhecido SHALL usar login. A pessoa SHALL continuar podendo alternar pelas abas existentes. O parâmetro mode SHALL controlar somente a apresentação inicial, sem alterar regras de autenticação, confirmação de e-mail, recuperação, entrada com Google ou validação de returnTo. Troca de modo SHALL preservar returnTo, submetido à allowlist existente, e não SHALL permitir destinos externos.

#### Scenario: Cadastro direto
- **WHEN** a pessoa abre ou recarrega `/acesso?mode=register&returnTo=/app/materias`
- **THEN** encontra cadastro selecionado e mantém o retorno interno permitido
- **AND** cadastro local pendente continua no fluxo de confirmação antes de acessar área privada.

#### Scenario: Modo padrão seguro
- **WHEN** a pessoa abre `/acesso` com mode ausente ou inválido
- **THEN** encontra login selecionado e pode escolher cadastro pelas abas.

#### Scenario: Troca na mesma rota
- **WHEN** a pessoa navega de um modo de `/acesso` para outro sem mudar pathname, inclusive por histórico do navegador
- **THEN** o modo visível acompanha a URL sem perder o parâmetro de retorno.

#### Scenario: Retorno externo rejeitado
- **WHEN** a pessoa abre login ou cadastro com returnTo externo ou malformado
- **THEN** o destino é reduzido ao padrão interno permitido, sem afrouxar a segurança por causa do mode
- **AND** o fluxo Google continua usando a mesma validação de retorno.

### Requirement: Apresentação visual consistente dos fluxos existentes
A interface SHALL aplicar uma linguagem visual coerente inspirada no Stitch a login, cadastro, confirmação de e-mail e todas as etapas de recuperação, usando hierarquia legível, espaçamento consistente, superfícies, inputs e ações distinguíveis. A apresentação SHALL respeitar o tema claro ou escuro escolhido, funcionar desde 320 px sem rolagem horizontal de layout e preservar rótulos, foco, teclado, anúncios de feedback e preferência por movimento reduzido.

#### Scenario: Desktop e mobile
- **WHEN** a pessoa abre qualquer tela ou etapa de autenticação em 320 px ou desktop
- **THEN** o formulário e suas ações permanecem legíveis e alcançáveis, sem corte vertical ou rolagem horizontal causada pelo layout
- **AND** o painel decorativo se adapta sem impedir o uso do formulário.

#### Scenario: Tema e teclado
- **WHEN** a pessoa navega entre as telas nos temas claro e escuro usando teclado
- **THEN** a escolha de tema permanece e campos, links e botões apresentam rótulos e foco visíveis
- **AND** feedback mantém anúncio acessível e animações respeitam movimento reduzido.

### Requirement: Referência visual subordinada ao fluxo real
O redesign SHALL manter os campos, regras, integrações, rotas e destinos permitidos existentes. SHALL NOT adicionar recursos sem integração atual, restrição institucional de e-mail, alegações de segurança ou benefícios inexistentes. Login e cadastro SHALL continuar com e-mail e senha e Google existente; confirmação SHALL continuar por código de seis dígitos; recuperação SHALL manter solicitação, código, nova senha e sucesso na rota existente. Senhas novas SHALL preservar a política de 12–128 caracteres.

#### Scenario: Cadastro e Google
- **WHEN** a pessoa abre cadastro
- **THEN** somente e-mail e senha são exigidos pelo cadastro local e Google continua disponível com o destino permitido
- **AND** campos acadêmicos, Microsoft, consentimentos novos e lembrar dispositivo não são apresentados.

#### Scenario: Recuperação adaptada
- **WHEN** a solicitação de recuperação é aceita
- **THEN** a interface mostra a mensagem genérica real e permite informar o código no fluxo atual
- **AND** não afirma que a conta existe nem orienta um link de redefinição inexistente.

#### Scenario: Navegação preservada
- **WHEN** a pessoa alterna login e cadastro, solicita recuperação ou conclui uma operação
- **THEN** a navegação usa as rotas existentes, preservando query e retorno permitido conforme o fluxo atual
- **AND** cadastro/login pendente vai à confirmação, confirmação bem-sucedida orienta login e somente autenticação ativa leva à área privada.

### Requirement: Feedback visual fiel aos resultados de autenticação
A apresentação SHALL preservar loading, validação de campos, bloqueios durante envio, mensagens reais da API, erros de rede e sucesso apenas após resultado confirmado. SHALL manter mensagens genéricas contra enumeração, erros OAuth, códigos inválidos/expirados, contexto de redefinição expirado e espera real de reenvio na confirmação, sem simular resultados para reproduzir o protótipo. Códigos, senhas e segredos SHALL NOT ser introduzidos em URLs ou armazenamento acessível por JavaScript pelo redesign.

#### Scenario: Erro e nova tentativa
- **WHEN** ocorre credencial inválida, conflito de cadastro, erro OAuth, falha de rede ou erro inesperado já tratado
- **THEN** a mensagem existente aparece de modo legível e acessível e permite o caminho atual de recuperação ou nova tentativa
- **AND** nenhuma sessão ou sucesso é simulado.

#### Scenario: Código e espera
- **WHEN** confirmação recebe código inválido/expirado ou reenvio limitado por 429
- **THEN** mostra o erro real e respeita o contador existente e Retry-After
- **AND** não anuncia confirmação nem libera ações antes das condições atuais.

#### Scenario: Submissão e resultado incerto
- **WHEN** uma submissão está pendente ou a redefinição falha por indisponibilidade sem confirmar resultado
- **THEN** os bloqueios e mensagens existentes são preservados
- **AND** o estado done só aparece após resposta bem-sucedida de redefinição.

### Requirement: Conteúdo textual dos e-mails transacionais

A EduTrack SHALL utilizar os assuntos e corpos abaixo nos cinco casos existentes, substituindo somente as variáveis conceituais pelos valores reais. Os nomes internos existentes SHALL ser preservados; o nome SHALL corresponder ao nome de apresentação da conta, a plataforma SHALL ser EduTrack e a duração SHALL continuar sendo 10 minutos. Os corpos SHALL continuar em texto simples, sem marcadores Markdown de negrito nem introdução de HTML ou alterações visuais. Os blocos abaixo são o conteúdo normativo completo; quebras de parágrafo SHALL ser preservadas.

#### Scenario: Cadastro com e-mail e senha
- **WHEN** o e-mail de confirmação do cadastro é enviado
- **THEN** o assunto SHALL ser `Confirme seu endereço de e-mail` e o corpo SHALL ser:

```text
Olá, {{nome_usuario}},

Seu cadastro foi realizado com sucesso.

Para confirmar seu endereço de e-mail e ativar sua conta, utilize o código abaixo:

{{codigo_confirmacao}}

Esse código é válido por {{tempo_expiracao}} minutos.

Volte para a plataforma e informe o código no campo de confirmação para concluir seu cadastro.

Se você não realizou esse cadastro, ignore este e-mail.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe {{nome_plataforma}}

Este é um e-mail automático. Por favor, não responda.
```

#### Scenario: Reenvio do código de confirmação
- **WHEN** um novo código de confirmação é solicitado pelo fluxo de reenvio existente
- **THEN** o assunto SHALL ser `Novo código de confirmação` e o corpo SHALL ser:

```text
Olá, {{nome_usuario}},

Você solicitou um novo código para confirmar seu endereço de e-mail.

Use o código abaixo para continuar:

{{codigo_confirmacao}}

Esse código é válido por {{tempo_expiracao}} minutos.

O código de confirmação enviado anteriormente não é mais válido.

Volte para a plataforma e informe o novo código no campo de confirmação.

Se você não solicitou um novo código, ignore este e-mail.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe {{nome_plataforma}}

Este é um e-mail automático. Por favor, não responda.
```

#### Scenario: Recuperação de senha
- **WHEN** o código de recuperação de senha é enviado
- **THEN** o assunto SHALL ser `Código para redefinição de senha` e o corpo SHALL ser:

```text
Olá, {{nome_usuario}},

Recebemos uma solicitação para redefinir a senha da sua conta.

Use o código abaixo para continuar o processo:

{{codigo_redefinicao}}

Esse código é válido por {{tempo_expiracao}} minutos.

Volte para a plataforma, informe o código e escolha uma nova senha.

Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha atual continuará funcionando normalmente.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe {{nome_plataforma}}

Este é um e-mail automático. Por favor, não responda.
```

#### Scenario: Solicitação ou reenvio de troca de e-mail
- **WHEN** um código para confirmar o novo endereço é enviado, na solicitação ou no reenvio
- **THEN** o assunto SHALL ser `Confirme seu novo endereço de e-mail` e o corpo SHALL ser:

```text
Olá, {{nome_usuario}},

Recebemos uma solicitação para alterar o endereço de e-mail associado à sua conta para este endereço.

Para confirmar a alteração, utilize o código abaixo:

{{codigo_confirmacao}}

Esse código é válido por {{tempo_expiracao}} minutos.

Volte para a plataforma e informe o código no campo de confirmação para concluir a alteração.

Se você não reconhece essa solicitação, não utilize o código e ignore este e-mail.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe {{nome_plataforma}}

Este é um e-mail automático. Por favor, não responda.
```

#### Scenario: Troca de e-mail concluída
- **WHEN** o aviso existente de alteração concluída é enviado
- **THEN** o assunto SHALL ser `O e-mail da sua conta foi alterado` e o corpo SHALL ser:

```text
Olá, {{nome_usuario}},

O endereço de e-mail associado à sua conta foi alterado com sucesso.

Novo endereço: {{novo_email}}

Como medida de segurança, as sessões anteriormente conectadas à sua conta foram encerradas.

Para continuar utilizando a plataforma, será necessário entrar novamente usando seu novo endereço de e-mail.

Se você realizou essa alteração, nenhuma ação adicional é necessária.

Se você não reconhece essa alteração, entre em contato com o suporte o mais rápido possível para proteger sua conta.

Atenciosamente,
Equipe {{nome_plataforma}}

Este é um e-mail automático. Por favor, não responda.
```

### Requirement: Preservação dos fluxos e interpolação

A alteração SHALL preservar quando e para quem cada mensagem é enviada, geração e invalidação de códigos, validade, encerramento de sessões, autenticação, APIs, tratamento de erros e persistência. A única ampliação interna SHALL transportar nome, novo endereço e distinção de reenvio necessários ao conteúdo. Nenhuma mensagem SHALL apresentar placeholders conceituais não interpolados nem valores ausentes como `undefined` ou `null`.

#### Scenario: Código e duração existentes
- **WHEN** qualquer mensagem com código é renderizada
- **THEN** ela SHALL apresentar exatamente o código gerado, incluindo zeros iniciais, e a duração atual de 10 minutos, sem alterar sua validade real.

#### Scenario: Aviso para o endereço anterior
- **WHEN** a troca de e-mail é concluída
- **THEN** o aviso SHALL continuar destinado ao endereço anterior e SHALL apresentar no corpo o novo endereço confirmado.

#### Scenario: Dados personalizados
- **WHEN** uma mensagem dos cinco casos é renderizada para uma conta
- **THEN** a saudação SHALL apresentar seu nome e a assinatura SHALL apresentar EduTrack, sem placeholders pendentes.

### Requirement: Visibilidade opcional de senhas digitadas
Campos existentes destinados explicitamente à senha da conta SHALL iniciar ocultos e oferecer controle de mostrar/ocultar com ícones de olho e olho riscado e nomes acessíveis `Mostrar senha` e `Ocultar senha`. A alternância SHALL preservar valor, validações, envio, autocomplete e atributos relacionados à senha, preservando foco e cursor sempre que suportado pelo navegador. Controles de campos desabilitados SHALL permanecer desabilitados e visualmente identificáveis.

#### Scenario: Mostrar e ocultar
- **WHEN** a pessoa digita uma senha oculta e ativa o controle de visibilidade duas vezes
- **THEN** o campo alterna de password para text e retorna a password, com ícone e nome acessível correspondentes
- **AND** o valor e as validações permanecem preservados, sem submeter o formulário, e foco e cursor são preservados quando suportado.

#### Scenario: Cobertura dos campos existentes
- **WHEN** a pessoa usa login, cadastro, redefinição de senha, alteração de senha ou confirmação de identidade por senha na Conta
- **THEN** cada campo existente de senha da conta apresenta o controle; confirmações de senha são contempladas apenas se existirem
- **AND** a mudança não acrescenta campos ou altera os fluxos de autenticação.

#### Scenario: Exclusão de campos comuns e códigos
- **WHEN** a pessoa visualiza códigos de confirmação de e-mail, recuperação ou troca de e-mail, OTPs, tokens, PINs que não sejam senhas, e-mail, texto, busca ou selects
- **THEN** nenhum desses campos recebe controle de olho nem é convertido para password.

#### Scenario: Senha desabilitada
- **WHEN** um campo de senha está desabilitado pelo fluxo existente
- **THEN** seu controle de visibilidade também está indisponível e a apresentação mantém o estado disabled perceptível.

### Requirement: Retorno seguro para Flashcards
O fluxo de autenticação SHALL reconhecer `/app/flashcards` como destino interno permitido na web e no login Google da API. Ao solicitar login a partir dessa rota, a aplicação SHALL preservá-la e retornar a ela após autenticação bem-sucedida de conta confirmada. Destinos externos, malformados ou não permitidos SHALL continuar usando `/app` como retorno seguro. Permissões de módulo e validação de sessão SHALL continuar obrigatórias.

#### Scenario: Login local após acesso direto
- **WHEN** uma pessoa sem sessão abre `/app/flashcards` e conclui login local com conta confirmada
- **THEN** retorna a `/app/flashcards`
- **AND** a tela respeita a preferência atual de habilitação do módulo.

#### Scenario: Login Google após acesso direto
- **WHEN** uma pessoa inicia a entrada Google com retorno permitido para `/app/flashcards` e conclui o fluxo com sucesso
- **THEN** o destino é preservado durante a tentativa OAuth e no redirecionamento final.

#### Scenario: Destino não permitido
- **WHEN** a autenticação recebe destino externo, malformado ou caminho interno não permitido
- **THEN** o retorno é `/app`, sem redirecionamento para o destino rejeitado.

#### Scenario: Preservar destinos já permitidos
- **WHEN** a pessoa conclui autenticação com outro destino interno já permitido
- **THEN** o comportamento de retorno existente é preservado.
