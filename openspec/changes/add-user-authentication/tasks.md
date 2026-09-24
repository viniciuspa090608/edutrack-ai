# Tasks

## 1. Dados e contratos

- [x] 1.1 Criar migrations versionadas de usuários, credenciais, identidades Google, sessões, tentativas OAuth e limites de tentativa, com índices únicos e `synchronize: false`; verificar aplicação e segunda execução sem reaplicação no MySQL isolado de teste.
- [x] 1.2 Implementar entidades/repositories do módulo de autenticação com transações para cadastro e vínculo; verificar em testes com MySQL real que corridas pelo mesmo e-mail ou `sub` não criam duplicatas nem mesclam contas.
- [x] 1.3 Adicionar schemas Zod e tipos públicos para cadastro, login, `/auth/me` e erros de autenticação em `packages/contracts`; verificar entradas inválidas e respostas válidas em testes de contrato.
- [x] 1.4 Validar `API_PUBLIC_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e topologia HTTPS no mesmo site em produção; atualizar `.env.example` e verificar por testes de ambiente que configuração inválida falha sem imprimir segredos.

## 2. Cadastro, login e sessão

- [x] 2.1 Implementar normalização de e-mail, política de senha e hash `scrypt` com salt e comparação em tempo constante; verificar por testes que a senha em claro não é persistida e que credenciais corretas/incorretas são distinguidas sem enumerar contas.
- [x] 2.2 Implementar `POST /auth/register` e `POST /auth/login` com validação, conflitos e resposta genérica de credenciais; verificar cadastro, duplicidade, entrada válida e falhas em testes HTTP com MySQL real.
- [x] 2.3 Implementar limitação persistida de tentativas de cadastro e login por IP/chave de e-mail e limpeza de registros vencidos; verificar HTTP 429, janela de recuperação e comportamento consistente após recriação da aplicação.
- [x] 2.4 Implementar sessão opaca em cookie, hash no banco, expiração por 24 horas de inatividade e 7 dias absolutos, renovação por atividade, troca em novo login, `GET /auth/me` e `POST /auth/logout`; verificar cookie, recarga, limites e revogação em testes HTTP/MySQL.
- [x] 2.5 Configurar CORS com credenciais para `WEB_ORIGIN`, validar `Origin` e JSON nas operações de alteração de estado e manter logs sem segredos; verificar rejeição de origem ausente/diferente e ausência de senha, cookie e token nos logs de teste.
- [x] 2.6 Criar middleware reutilizável que resolve a sessão e fornece o `userId` autenticado a endpoints privados, com limpeza de sessões expiradas; verificar HTTP 401 sem sessão, escopo da própria conta e recusa de sessão revogada em testes HTTP.

## 3. Google e vínculo explícito

- [x] 3.1 Integrar biblioteca OIDC para Authorization Code com PKCE, `state`, `nonce`, cookie de tentativa, callback de uso único e limpeza de tentativas vencidas; verificar expiração, reutilização, troca e claims inválidas com respostas controladas do provedor.
- [x] 3.2 Implementar entrada Google pela chave `(google, sub)`, criação de conta apenas com e-mail verificado sem conflito e resposta segura para e-mail coincidente; verificar primeiro acesso, retorno com e-mail alterado, conflito local e concorrência em MySQL real.
- [x] 3.3 Implementar início explícito do vínculo a partir de sessão autenticada e confirmação no callback vinculada à mesma sessão; verificar vínculo válido, `sub` já ocupado, sessão expirada e preservação da sessão em falhas.

## 4. Web e proteção

- [x] 4.1 Substituir o aviso de `/acesso` por formulários de cadastro/login e entrada Google, preservando os CTAs da landing; verificar navegação, validação, carregamento, erro e sucesso em testes de interface.
- [x] 4.2 Adicionar `/app` e `/conta`, consulta inicial a `/auth/me`, ação de saída, botão de vínculo e proteção de URLs abertas diretamente; verificar que não há flash de dados privados sem sessão e que a API também recusa acesso direto.
- [x] 4.3 Tratar `returnTo` somente para caminhos internos permitidos e apresentar falhas/cancelamento de Google com nova tentativa; verificar que URL externa é ignorada e que o vínculo com falha não troca de conta.
- [x] 4.4 Ajustar formulários e páginas privadas para teclado, foco, rótulos e largura de 320 px; verificar por testes de interação e inspeção visual que os controles são operáveis e não há rolagem horizontal do layout.

## 5. Integração e entrega

- [x] 5.1 Atualizar README com fluxo local, callback Google, configuração de cookies/HTTPS, migrations e limites desta etapa sem e-mail; verificar instruções em ambiente limpo e confirmar que nenhum segredo entra no bundle web.
- [x] 5.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` com MySQL real em `TEST_DB_NAME` e `pnpm build`; verificar saída zero e corrigir falhas antes de concluir o apply.
- [x] 5.3 Executar `openspec validate add-user-authentication --strict`, conferir manualmente cadastro, login local, Google, vínculo, expiração/saída e rotas protegidas, e registrar a reconciliação necessária do `/acesso` provisório de `add-public-landing` antes do sync/archive; verificar validação sem erros e cenários da spec atendidos.
