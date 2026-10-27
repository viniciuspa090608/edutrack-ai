# Proposal

## Why

Os e-mails transacionais atuais possuem mensagens resumidas e compartilham o texto de cadastro e reenvio. Atualizar seus assuntos e corpos para os cinco conteúdos solicitados torna as orientações e avisos de segurança consistentes.

## What Changes

- Substituir os assuntos e corpos de cadastro, reenvio de confirmação, recuperação de senha, solicitação/reenvio de troca de e-mail e aviso de troca concluída pelos textos integrais definidos na especificação desta mudança.
- Disponibilizar apenas os dados de apresentação ausentes: nome do usuário, novo endereço no aviso e indicação de reenvio de confirmação. Esta ampliação mínima foi autorizada explicitamente pelo usuário.
- Preservar códigos, validade atual de 10 minutos, destinatários, momentos de envio, autenticação, invalidação, sessões, APIs e tratamento de erros.
- Manter mensagens em texto simples, sem novo template, HTML/CSS, layout, provider, refatoração ou alterações de arquitetura.
- Executar somente testes unitários diretamente relacionados ao conteúdo e à interpolação dos e-mails.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `user-authentication`: acrescentar requisitos de conteúdo dos cinco e-mails transacionais existentes, sem mudar regras dos fluxos.

## Impact

Conteúdo em `apps/api/src/modules/auth/email-delivery.ts`; transporte interno mínimo dos dados de apresentação em `email.repository.ts`, `email-crypto.ts` se necessário e nos chamadores existentes de emissão/notificação em autenticação e perfil. Nenhuma mudança de contrato HTTP, schema de banco, migration ou dependência. Criar teste unitário isolado de conteúdo, pois os testes atuais de e-mail são de integração com MySQL e não validam `sendMail`. A implementação deve preservar compatibilidade com mensagens já enfileiradas.
