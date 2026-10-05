# Design

## Context

Ver `proposal.md` para a motivação. O conteúdo atual está em `email-delivery.ts`, no campo `text` de `sendMail`; não existe HTML. O sender recebe `email`, `code` e `purpose`. Cadastro e reenvio usam `verify_email`. O payload criptografado da outbox contém esses três campos. O banco já possui `users.display_name`; a validade começa após o envio e é fixada em 10 minutos. `ProfileService.confirmEmailChange` notifica o endereço anterior por `notifyChanged`, sem disponibilizar o novo endereço ao sender. Os testes existentes cobrem HTTP/repositório com MySQL, sem teste específico de conteúdo.

## Goals / Non-Goals

**Goals:** reproduzir os cinco textos normativos com o mínimo de dados adicionais de apresentação, mantendo os pontos de emissão existentes.

**Non-Goals:** modificar transporte SMTP, regras, schema de banco, contratos públicos, HTML/CSS, arquitetura ou organizar/refatorar os fluxos.

## Decisions

1. Editar os ramos de assunto e texto existentes em `email-delivery.ts`. Preservar texto simples e não transformar o negrito do prompt em HTML ou asteriscos literais; o conteúdo verbal completo permanece conforme a spec. Não criar sistema de templates, componentes nem renderer paralelo.
2. Acrescentar metadados opcionais de apresentação ao payload criptografado existente e ao callback interno de entrega. Transportar nome de apresentação, indicador de reenvio e novo endereço, usando nomes internos coerentes com o projeto. Aproveitar a consulta de usuário existente em `issue` para ler `display_name`; em `notifyChanged`, obter o nome pela identidade já disponível e receber o novo endereço confirmado do chamador existente. Não alterar colunas nem `EmailPurpose`: usar outro purpose para reenvio afetaria invalidação, consumo e limites. Marcar reenvio explicitamente em `AuthService.resendConfirmation`, sem inferir pela quantidade de desafios anteriores. Os demais pontos existentes de confirmação preservam o caso de cadastro.
3. Passar o novo endereço de `ProfileService.confirmEmailChange` a `notifyChanged`, mantendo o destinatário anterior. Não confundir destino SMTP com o valor exibido. Nenhuma mudança em sessões, transação ou validação.
4. Manter 10 minutos e EduTrack conforme o conteúdo/configuração atual, sem introduzir novas variáveis de ambiente ou alterar contratos para os nomes conceituais do prompt.
5. Compatibilidade de fila: campos adicionais opcionais permitem ler payloads antigos. Para mensagens antigas sem nome/novo endereço, enriquecer apenas metadados de apresentação por identidade do desafio já reservado, preservando destinatário, código e purpose. Nesses payloads legados, nome e endereço só podem refletir os dados disponíveis na entrega; os novos payloads capturam os dados na emissão. Payload antigo sem indicador usa o caso de confirmação padrão; não há informação histórica confiável para diferenciar cadastro e reenvio. Novas emissões distinguem os casos explicitamente. Não descartar, reenfileirar nem invalidar mensagens por essa atualização. O nome de apresentação já possui padrão `Estudante` no banco; preservá-lo sem introduzir uma nova política de nomes.
6. Criar `apps/api/test/email-delivery.spec.ts` isolado, interceptando `sendMail` com mock do transporte SMTP. Isso verifica o conteúdo real produzido sem envio de e-mail, banco ou autenticação. Exercitar os metadados encaminhados com fixtures locais somente quando necessário à interpolação; não incluir teste de fluxo ou repositório de banco.

## Risks / Trade-offs

- [Metadados interferirem na finalidade do desafio] → manter `EmailPurpose`, código, limites e persistência do desafio intactos; indicador existe somente no payload de apresentação.
- [Payloads anteriores sem dados] → campos opcionais e enriquecimento de apresentação compatível; a ausência histórica de indicador de reenvio mantém o texto padrão apenas nessas mensagens antigas.
- [Novo endereço substituído pelo destinatário anterior] → teste dedicado com dois endereços distintos.
- [Expansão de escopo] → revisão do diff restrita a conteúdo, transporte mínimo dos três metadados e teste específico.

## Migration Plan

Sem migration ou alteração de schema. Publicar as mudanças internas em conjunto no processo atual, mantendo leitura dos payloads anteriores. Reverter o commit restaura os textos anteriores; metadados extras no JSON criptografado não exigem alteração de banco. Publicação e rollback não fazem parte deste planejamento.
