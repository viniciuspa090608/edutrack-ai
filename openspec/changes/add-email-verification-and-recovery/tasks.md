# Tasks

## 1. Dependência e persistência

- [x] 1.1 Confirmar que `add-user-authentication` foi aplicado e que contas, credenciais locais, identidades Google e sessões existem; verificar migrations e `openspec status` da mudança anterior antes de alterar a autenticação.
- [x] 1.2 Reconciliar o requisito publicado de cadastro/login em `user-authentication` com a exigência de confirmação, incluindo o delta `MODIFIED` e a lista de capacidades desta mudança quando a spec principal existir; verificar que a validação OpenSpec não deixa acesso privado imediato para conta local pendente.
- [x] 1.3 Criar migration versionada para `email_verified_at`, desafios, autorizações, limites e itens de e-mail; verificar `migration:run`, reexecução idempotente e `synchronize: false` em MySQL de teste isolado.
- [x] 1.4 Definir a transição de contas existentes: locais pendentes e Google exclusivo confirmado apenas quando a identidade prévia satisfazia OIDC; verificar em teste MySQL que sessões antigas não acessam recursos privados enquanto a conta estiver pendente.

## 2. Códigos, entrega e limites

- [x] 2.1 Acrescentar configuração validada para SMTP e chaves de HMAC/cifra, com `.env.example` e documentação operacional; verificar falha de inicialização para variável inválida sem registrar segredo.
- [x] 2.2 Implementar geração criptográfica, HMAC e consumo transacional de códigos de seis dígitos por finalidade; verificar com MySQL código válido, expiração, uso único, reenvio, cinco erros e concorrência.
- [x] 2.3 Persistir limites por e-mail canônico e origem, inclusive para endereço inexistente; verificar intervalo de 60 segundos, máximo de três emissões por hora e continuidade dos limites após nova instância da API.
- [x] 2.4 Implementar fila transacional cifrada, adaptador SMTP e worker com reserva, repetição, descarte de desafio revogado e limpeza de payload; verificar entrega controlada, falha do provedor, atraso e ausência de código/destinatário em claro no banco e nos logs.

## 3. API de confirmação e recuperação

- [x] 3.1 Integrar cadastro e login locais ao contexto restrito de confirmação e bloquear endpoints privados de contas pendentes no servidor; verificar cadastro, login e tentativa com sessão antiga em testes HTTP/MySQL.
- [x] 3.2 Implementar solicitação, reenvio e validação de confirmação com schemas públicos e proteção de origem; verificar conta local pendente, código substituído, conta já confirmada e entrada após confirmação.
- [x] 3.3 Implementar solicitação de **Esqueci minha senha** com resposta indistinguível para conta local, Google exclusivo e e-mail inexistente; verificar que somente conta com senha local gera código e que o limite não revela o tipo de conta.
- [x] 3.4 Implementar validação do código de recuperação e autorização opaca de cinco minutos em cookie protegido; verificar que código usado, vencido ou bloqueado não concede autorização nem sessão.
- [x] 3.5 Implementar redefinição transacional com política de senha, confirmação do e-mail pendente, consumo da autorização e revogação de todas as sessões; verificar login com senha nova, falha da antiga, sessões revogadas e recuperação concorrente de uso único.
- [x] 3.6 Preservar identidade Google por `sub` e o requisito `email_verified`, sem criar senha ou vínculo por coincidência de e-mail; verificar primeira entrada Google, conflito com conta local pendente e tentativa de outra identidade com o mesmo endereço.

## 4. Interface e operação

- [x] 4.1 Criar tela de confirmação pós-cadastro e pós-login pendente com campo de código, reenvio e estados de envio, espera, expiração, erro e sucesso; verificar navegação por teclado, foco, leitor de tela e largura de 320 px.
- [x] 4.2 Criar **Esqueci minha senha**, validação do código e nova senha, com orientação universal para acesso e recuperação do Google; verificar estados de rede, respostas genéricas, sucesso e ausência de código/token na URL.
- [x] 4.3 Documentar configuração do provedor, execução do worker, observabilidade segura e procedimento de deploy/rollback; verificar que README e exemplos permitem subir o fluxo sem segredos em `VITE_*` ou logs.

## 5. Verificação de conclusão

- [x] 5.1 Executar os testes de integração dos fluxos com MySQL real isolado e transporte de e-mail controlado, incluindo expiração, limites, concorrência, sessões antigas e contas exclusivas do Google; verificar `pnpm test` completo.
- [x] 5.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; verificar que todos concluem sem erro antes de marcar a mudança concluída.
- [x] 5.3 Revisar somente arquivos/hunks desta mudança, incluindo `tasks.md` final, executar `git diff --cached --check` e criar o único commit de conclusão no formato de `AGENTS.md`; verificar hash e lista de arquivos incluídos.
