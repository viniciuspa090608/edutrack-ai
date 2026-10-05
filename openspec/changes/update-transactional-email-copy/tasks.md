# Tasks

## 1. Preparação e dados de apresentação

- [x] 1.1 Registrar branch, HEAD e estado Git antes do apply, identificando alterações preexistentes; verificar o registro e preservar esses arquivos/hunks.
- [x] 1.2 Disponibilizar nome de apresentação e indicador explícito de reenvio no payload criptografado e callback interno existentes, mantendo `EmailPurpose` e os demais argumentos/regras; verificar o diff e fixtures de conteúdo para cadastro e reenvio distintos.
- [x] 1.3 Disponibilizar nome e novo endereço confirmado ao aviso existente de `notifyChanged`, a partir do chamador em `profile.service.ts`; verificar no diff que o destino continua sendo o endereço anterior e que transações, sessões e regras não mudaram.
- [x] 1.4 Preservar leitura dos payloads anteriores, com enriquecimento apenas dos dados de apresentação ausentes conforme design; verificar casos locais restritos à interpolação, sem banco, e revisar que código, destino e purpose permanecem intactos.

## 2. Conteúdos e testes específicos

- [x] 2.1 Substituir somente os assuntos e corpos nos ramos existentes de `email-delivery.ts` pelos cinco blocos da spec; verificar correspondência integral, mantendo texto simples, validade de 10 minutos e assinatura EduTrack.
- [x] 2.2 Criar `apps/api/test/email-delivery.spec.ts`, interceptando o transporte SMTP, com comparação dos cinco assuntos e corpos completos; verificar nome, código com zeros iniciais, duração, assinatura, novo endereço distinto do destinatário e ausência de placeholders não interpolados ou valores ausentes. Cobrir solicitação e reenvio de troca de e-mail com o mesmo conteúdo.
- [x] 2.3 Executar somente `pnpm --filter @study-platform/api exec vitest run test/email-delivery.spec.ts` e quaisquer testes adicionais estritamente de interpolação criados para esta mudança; registrar resultado. Por instrução explícita do usuário, não executar suíte completa, testes de autenticação, banco, APIs, frontend ou demais módulos, nem comandos globais de qualidade.

## 3. Revisão e conclusão

- [x] 3.1 Revisar o diff para confirmar escopo restrito a textos, três dados mínimos de apresentação, compatibilidade de conteúdo e testes específicos; verificar ausência de mudanças visuais, públicas, de schema, regras ou refatorações e executar `git diff --check`.
- [x] 3.2 Após concluir tarefas e verificações, atualizar este `tasks.md`, adicionar somente arquivos/hunks da mudança, revisar o staged e executar `git diff --cached --check`; criar exatamente um commit `[update] atualizar textos dos e-mails transacionais`, confirmar hash e arquivos incluídos e informar o resultado, sem push, tag ou arquivamento.
