# Proposal

## Why

O cadastro por e-mail planejado para a EduTrack não confirma que a pessoa controla o endereço informado e não oferece saída segura quando ela esquece a senha. A recuperação também precisa distinguir contas com senha local de contas que dependem exclusivamente do Google.

## What Changes

- Exigir confirmação do endereço no cadastro com e-mail e senha por código enviado por e-mail antes de liberar o acesso à área autenticada, com reenvio, expiração e limite de tentativas.
- Oferecer **Esqueci minha senha** para contas com senha local, com código temporário de uso único e redefinição que invalida sessões anteriores.
- Tratar contas exclusivas do Google pelo fluxo de entrada com Google e, caso a pessoa tenha perdido acesso à conta Google, orientá-la a usar a recuperação do próprio Google. A EduTrack não enviará redefinição de uma senha local inexistente.
- Aplicar respostas de recuperação que não revelem a existência ou o tipo de conta, limites de emissão e tentativa, armazenamento seguro de códigos e estados claros nas telas.

## Capabilities

### New Capabilities

- `email-verification`: confirmação do endereço de contas locais por código, reenvio e política para identidades Google.
- `account-recovery`: solicitação de recuperação, validação de código, redefinição de senha local e orientação para contas exclusivas do Google.

### Modified Capabilities

- `user-authentication`: alterar cadastro, login, sessão e proteção de áreas privadas para exigir confirmação do endereço de contas locais. O delta `MODIFIED` preserva os cenários existentes e substitui a regra anterior de acesso imediato após cadastro local.

## Impact

- `apps/api`: emissão de e-mails, códigos temporários, endpoints de verificação e recuperação, controles de abuso, invalidação de sessões e migration versionada.
- `packages/contracts`: schemas de solicitação, validação e resposta sem exposição de existência ou tipo de conta.
- `apps/web`: confirmação após cadastro, reenvio, **Esqueci minha senha**, redefinição e orientação de acesso Google.
- Configuração validada do provedor de e-mail e testes de integração com MySQL isolado; fluxo de autenticação da mudança `add-user-authentication` como pré-requisito.
