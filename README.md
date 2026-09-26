# EduTrack

Plataforma de estudos em construção. A página inicial apresenta os recursos planejados; a página técnica React continua em `/status`. A API Express oferece `GET /health` e autenticação local ou Google, com contratos compartilhados e conexão MySQL.

## Pré-requisitos

- Node.js 24 ou 25 e pnpm 11.25.0 (ver `packageManager` no `package.json`).
- Docker com Compose para MySQL local, ou MySQL 8.4 equivalente.

## Preparação local

Na raiz do repositório, instale e configure o ambiente:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

O arquivo `.env` é local e ignorado pelo Git. Ajuste `DB_PASSWORD` para uma senha local e mantenha `DB_NAME` e `TEST_DB_NAME` diferentes. `DB_PORT=3307` evita conflito com um MySQL local na porta padrão. Defina `API_PUBLIC_ORIGIN` como a origem pública da API e `WEB_ORIGIN` como a origem da web. `VITE_API_BASE_URL` contém somente a origem pública da API; nunca coloque segredos em variáveis `VITE_*`.

Para ativar o Google, configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no servidor e registre exatamente `http://localhost:3001/auth/google/callback` como URI de redirecionamento no projeto Google local. Em produção, use `${API_PUBLIC_ORIGIN}/auth/google/callback`; web e API precisam estar em HTTPS e no mesmo site. As duas credenciais Google são exigidas em produção. Mantenha o segredo somente na API.

Para confirmação de e-mail e recuperação de senha, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `EMAIL_HMAC_KEY` e `EMAIL_ENCRYPTION_KEY` na API em todos os ambientes. As chaves são valores hexadecimais independentes de 32 bytes cada; gere cada uma com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Use `SMTP_USER` e `SMTP_PASSWORD` juntos quando o provedor exigir autenticação. A porta 465 usa TLS direto; em produção, as demais portas exigem STARTTLS. Nunca exponha essas variáveis em `VITE_*` ou registre seus valores em logs. A API valida as configurações antes de iniciar; configure o SMTP e inicie o worker de entrega antes de habilitar os novos fluxos.

Inicie o banco e consulte as migrations:

```powershell
pnpm db:up
pnpm db:migration:show
pnpm db:migration:run
```

O Compose cria os bancos de desenvolvimento e teste na primeira inicialização. O volume mantém os dados entre reinicializações. Se usar um MySQL já instalado, crie os dois bancos conforme `.env` e dê ao usuário configurado permissão para conectar, criar e remover tabelas no banco de teste. As migrations criam autenticação e os dados de confirmação/recuperação. Execute `pnpm db:migration:run` antes de iniciar a API; `synchronize` continua desativado. Contas locais existentes passam a exigir confirmação; contas exclusivas do Google previamente validadas por OIDC permanecem confirmadas. Sessões antigas de contas locais pendentes perdem acesso privado no servidor.

Em terminais separados:

```powershell
pnpm dev:api
pnpm dev:web
pnpm --filter @study-platform/api email:worker
```

A landing abre em <http://localhost:5173/> sem depender da API. Cadastro e login ficam em `/acesso`; a área protegida fica em `/app` e a vinculação explícita do Google em `/conta`. O diagnóstico técnico fica em `/status`. A API abre em <http://localhost:3001>; `GET http://localhost:3001/health` responde `{"status":"ok"}` após a conexão com o banco. Para executar o build da API, use `pnpm build` e depois `pnpm --filter @study-platform/api start`.

A sessão usa cookie opaco `HttpOnly`, `SameSite=Lax` e `Secure` em HTTPS, com hash do segredo no MySQL. Ela expira após 24 horas sem atividade ou 7 dias desde a entrada, e a saída revoga a sessão no servidor. Em produção o cookie usa o prefixo `__Host-`; no HTTP local, usa o nome sem prefixo. Cadastro e login local pendente usam somente um cookie temporário de confirmação, sem acesso privado. Após confirmar o e-mail, a pessoa entra novamente. A recuperação usa outro cookie temporário de cinco minutos, consome a autorização uma vez e revoga todas as sessões ao trocar a senha.

## Operação de e-mail

Configure um provedor SMTP alcançável antes de iniciar o worker. Na configuração local, `localhost:1025` pode apontar para um capturador de e-mail de desenvolvimento; se ele não estiver ativo, os itens ficam na fila e são repetidos com atraso. O worker é um processo separado da API e deve ficar em execução em cada ambiente que oferece cadastro ou recuperação. Use `pnpm --filter @study-platform/api email:worker` em desenvolvimento ou execute `node apps/api/dist/email-worker.js` após o build em produção. O código de seis dígitos só vence dez minutos após a entrega. Reenvios revogam códigos anteriores. Um item é reservado por vez, repetido até cinco tentativas e descartado quando o desafio foi revogado.

Monitore contagens e idade de itens em `email_outbox` por `state`, desafios por `state` e falhas do processo, sem consultar ou registrar `ciphertext`, destinatários, códigos, cookies, hashes ou chaves. O worker registra somente eventos de envio, descarte e falha; a API registra tipo de falha e identificador da requisição. Para deploy, aplique as migrations, confira SMTP e worker com uma entrega controlada, depois exponha API e web. Em rollback, interrompa emissão e worker e mantenha as tabelas e o estado de confirmação. Use uma versão da API que preserve o bloqueio de contas pendentes; não volte à API anterior que ignorava esse estado. Se essa versão compatível não estiver disponível, suspenda o acesso privado até restaurar o serviço. Expire desafios, autorizações, contextos e itens antigos em uma rotina de retenção do banco após o prazo operacional escolhido.

Para publicar a web em hospedagem estática, configure o servidor para devolver `index.html` nas aberturas diretas de `/acesso`, `/confirmar-email`, `/recuperar-senha`, `/app`, `/conta` e `/status` (fallback de SPA). Arquivos em `/illustrations/` devem continuar servidos diretamente. O servidor de desenvolvimento e o preview do Vite já oferecem esse fallback.

## Verificações

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` inclui integração real com o MySQL em `TEST_DB_NAME`; o banco precisa estar ativo. Os testes de autenticação criam e removem bancos temporários com prefixo `TEST_DB_NAME`. O usuário MySQL de teste precisa de permissão para isso. Os demais comandos cobrem todos os workspaces aplicáveis. O CI executa os mesmos comandos com MySQL temporário e instalação por lockfile congelado.

## Organização

- `apps/web`: React, Vite e interface mobile-first.
- `apps/api`: Express, TypeORM, migrations e módulos `health` e `auth`.
- `packages/contracts`: schemas Zod e tipos de fronteira usados por API e web.
- `packages/ui`: apresentação compartilhada efetivamente usada pela página técnica.
- `packages/config`: presets TypeScript, ESLint e Prettier.
- `openspec/changes`: planejamento e tarefas por mudança.

Leia `AGENTS.md` para as regras de arquitetura e versionamento. O planejamento desta fundação está em `openspec/changes/bootstrap-study-platform`.
