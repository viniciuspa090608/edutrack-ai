# Spec Delta

## ADDED Requirements

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
