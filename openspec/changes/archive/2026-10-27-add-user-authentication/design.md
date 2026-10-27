# Design

## Context

Ver [proposal.md](proposal.md) e [spec.md](specs/user-authentication/spec.md). A web React/Vite seleciona rotas por `window.location.pathname`; `/acesso` exibe **Em breve** e os CTAs da landing já apontam para ela. A API Express só expõe `/health`, valida `WEB_ORIGIN`, usa contratos Zod e conecta ao MySQL com TypeORM e `synchronize: false`. Não há entidades nem migrations de produto. `VITE_API_BASE_URL` é uma origem da API. Os testes de banco usam `TEST_DB_NAME` real e isolado.

## Goals / Non-Goals

**Goals:** manter uma identidade EduTrack independente do meio de entrada; persistir sessões revogáveis com autoridade no servidor; tornar a proteção da API reutilizável pelos módulos futuros; permitir OAuth do Google e vínculo explícito sem usar e-mail como chave de identidade do provedor.

**Non-Goals:** envio de e-mails, verificação de endereço local, redefinição ou troca de senha, exclusão de conta, desvinculação de Google, recuperação de acesso a conta apenas Google, permissões além de “usuário autenticado”, dados dos módulos de estudo ou armazenamento de tokens Google para uso posterior.

## Decisions

### 1. Modelo de contas e persistência

Criar migrations para `users` (ID imutável, e-mail canônico único, datas), `password_credentials` (um hash e salt por usuário quando houver senha), `external_identities` (provedor, `subject`, usuário e e-mail informado pelo provedor) e `sessions` (hash único de token, usuário, criação, última atividade, revogação). `external_identities` terá unicidade em `(provider, subject)` e, nesta etapa, no par `(user_id, provider)`. Uma conta criada pelo Google não precisa de senha; uma conta local mantém sua senha após vínculo.

O e-mail local é normalizado com trim e conversão estável para minúsculas antes da unicidade; a senha não é normalizada nem aparada. Política inicial: 12 a 128 caracteres, sem regras artificiais de composição. Usar `crypto.scrypt` com salt aleatório por credencial, parâmetros fixados e versionados, comparação em tempo constante e hash fictício para e-mail inexistente. Migrations, restrições únicas e transações cobrem concorrência entre cadastros e vínculos. `users.email` não será substituído automaticamente quando o e-mail retornado pelo Google mudar; `subject` continua determinando a conta. Alternativa rejeitada: usar e-mail como identificador de Google, pois e-mails mudam e podem coincidir com uma conta local.

### 2. Sessão de servidor com cookie opaco

Após cadastro e cada login, gerar token aleatório criptograficamente forte, gravar somente seu hash em `sessions` e enviar o token em cookie host-only `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em HTTPS. Em produção, usar prefixo `__Host-`; em desenvolvimento HTTP local, nome sem esse prefixo e sem `Secure`. O cookie terá limite absoluto de 7 dias. Cada requisição autenticada consulta a sessão no MySQL, exige ausência de revogação e `last_used_at` inferior a 24 horas e atualiza a última atividade sem estender os 7 dias absolutos. A saída revoga a linha da sessão atual e remove o cookie. Um novo login revoga a sessão anterior do navegador antes de emitir outra. Nenhum token vai para `localStorage`, `sessionStorage`, JSON, URL ou logs.

Usar `fetch` com `credentials: 'include'`, CORS com origem exata `WEB_ORIGIN` e credenciais, e cookies emitidos pela origem da API. `API_PUBLIC_ORIGIN` e `WEB_ORIGIN` devem ser HTTPS e mesmo site em produção; o callback Google fica em `${API_PUBLIC_ORIGIN}/auth/google/callback`. No desenvolvimento, `localhost` em portas diferentes funciona como mesmo site. Rejeitar `Origin` ausente, `null` ou diferente de `WEB_ORIGIN` nos métodos de alteração de estado chamados pela web e aceitar somente JSON nesses endpoints. O callback OAuth usa `GET` e sua proteção própria de estado de uso único. Alternativas rejeitadas: JWT em armazenamento do navegador, que dificulta revogação imediata e expõe o segredo a scripts, e cookie de terceiro com `SameSite=None`, que depende de políticas do navegador.

### 3. Google OAuth/OIDC e vínculo

A API inicia Authorization Code Flow com PKCE, `state` e `nonce`, pedindo somente `openid email profile`. Uma tentativa de duração curta (10 minutos) guarda hash do `state`, verificador PKCE, `nonce`, intenção (`login` ou `link`) e, no vínculo, ID da sessão/usuário. Cookie temporário host-only `HttpOnly` e `SameSite=Lax` liga a tentativa ao navegador. O callback confirma `state` e cookie, consome a tentativa atomicamente, troca o código no servidor e valida assinatura, `iss`, `aud`, prazo, `nonce`, `sub` e `email_verified` do ID token. A API não mantém access/refresh token do Google e só redireciona para caminhos internos da web previamente permitidos. Usar biblioteca OIDC mantida para descoberta, troca e validação criptográfica, evitando implementação manual do protocolo.

No login, consultar primeiro `(google, sub)`. Se existir, usar o `user_id` vinculado sem procurar conta pelo e-mail. Se não existir, criar conta e vínculo em uma transação apenas quando o e-mail verificado não colidir com `users.email`; uma colisão mostra orientação para entrar localmente e vincular. No vínculo, a pessoa já deve estar autenticada e iniciar explicitamente a ação em `/conta`; `POST /auth/google/link/start` passa pela checagem de origem. No retorno, revalidar a mesma sessão e criar o vínculo em transação somente se `sub` estiver livre. Falha ou cancelamento preserva a sessão preexistente. Alternativa rejeitada: mesclar automaticamente pelo e-mail, pois não prova que duas credenciais representam a mesma conta EduTrack.

### 4. API, proteção e limitação de abuso

Expor `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/google/start`, `GET /auth/google/callback` e `POST /auth/google/link/start`. Controllers validam HTTP, services fazem regras de conta/sessão/OIDC e repositories persistem; schemas de entrada e respostas públicas ficam em `packages/contracts`. Um middleware lê o cookie, resolve a sessão e fornece o `userId` para rotas privadas; a API nunca aceita um `userId` do cliente como escopo de dados. `/auth/me` devolve somente campos públicos da própria conta e estado do vínculo. Reutilizar o formato de erro existente, sem segredos, hashes ou stacks.

Limitar cadastro e login por IP e por chave derivada do e-mail, com janela de 15 minutos e resposta 429 após 5 falhas de login por chave ou volume excessivo de cadastro. Manter contadores no MySQL para funcionar com mais de uma instância da API; limpar registros vencidos periodicamente. Falhas de credencial mantêm a mesma resposta, exista ou não o e-mail. Alternativa rejeitada: contador só em memória, que reinicia em deploy e difere entre instâncias.

### 5. Rotas e experiência web

Substituir `AccessPage` por login/cadastro em `/acesso`; manter os CTAs existentes e oferecer troca clara entre formulários e botão de Google. `/app` será uma área inicial mínima com saudação e saída, sem simular módulos ainda não entregues. `/conta` exibirá a conta atual e ação de vincular Google quando aplicável. Uma verificação inicial por `/auth/me` evita exibir conteúdo privado enquanto a sessão é desconhecida; 401 leva a `/acesso`, com `returnTo` aceito somente para caminhos internos conhecidos. URLs privadas abertas diretamente devem passar pelo mesmo controle. A API é a autoridade em todas as operações, mesmo se a proteção da web falhar. Estados de carregamento, erro, sucesso, teclado, foco e layout a 320 px entram nos componentes e testes.

### 6. Configuração, testes e documentação

Adicionar e validar `API_PUBLIC_ORIGIN`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`, sem `VITE_*` para segredos. Documentar callback exato a registrar no Google, cookies, HTTPS e mesmo site em produção, migrations e configuração local no `.env.example`/README. Testes de integração usam MySQL real em `TEST_DB_NAME` com migrations, concorrência de e-mail/`sub`, expiração e revogação; o protocolo Google é exercitado com respostas controladas no limite HTTP do provedor, sem depender de uma conta Google real. Testes web cobrem formulários, proteção, recarga, retorno permitido e acessibilidade. Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e validação OpenSpec no apply.

## Risks / Trade-offs

- [Google indisponível ou configuração OIDC incorreta] → erro recuperável, entrada local independente, validação antecipada de ambiente e testes do callback.
- [Duas tentativas concorrentes usam o mesmo e-mail ou `sub`] → índices únicos, transações e tratamento de conflito sem mescla.
- [Cookie não chega à API em implantação com sites diferentes] → exigir web e API no mesmo site, HTTPS e credenciais CORS explícitas; documentar e testar a topologia publicada.
- [Sessões e tentativas OAuth acumulam no banco] → índices de expiração e limpeza periódica que não afeta a validade de sessões ativas.
- [Spec da landing ainda exige aviso provisório] → reconciliar `add-public-landing` antes de sincronizar/arquivar as specs finais; `/acesso` passa a cumprir esta spec de autenticação.
- [Sem e-mails transacionais nesta etapa] → não oferecer recuperação de senha ou verificação; documentar a limitação e tratar esses fluxos no proposal seguinte.

## Reconciliação antes do sync/archive

Antes de sincronizar ou arquivar esta mudança, substituir na spec principal de `public-landing` o requisito provisório de aviso em `/acesso` pelo fluxo real de cadastro e entrada descrito em `user-authentication`. A landing mantém seus CTAs apontando para `/acesso`; o conteúdo da rota passa a pertencer ao módulo de autenticação.

## Migration Plan

1. Criar e aplicar migrations de identidade, sessão, tentativas OAuth e limitação de abuso antes de ativar as rotas.
2. Configurar credenciais Google e origem/callback por ambiente; validar HTTPS e mesmo site na publicação.
3. Publicar API e web juntas, trocando `/acesso` e adicionando `/app` e `/conta`; verificar login local, Google, vínculo, saída e acesso direto sem sessão.
4. Em rollback, retornar à interface provisória e desativar as novas rotas; preservar tabelas de identidade e sessão para não perder contas. Revogar sessões se houver mudança incompatível de formato.
