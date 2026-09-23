# Tasks

## 1. Workspace e convenções

- [x] 1.1 Criar `package.json` raiz, `pnpm-workspace.yaml` e manifests de `apps/web`, `apps/api`, `packages/contracts`, `packages/ui` e `packages/config`, fixar versões de Node/pnpm e gerar lockfile; verificar que `pnpm install --frozen-lockfile` resolve todos os workspaces a partir da raiz.
- [x] 1.2 Configurar TypeScript estrito compartilhado em `packages/config` e referências/exports de cada workspace; verificar que o comando inicial de typecheck alcança todos os pacotes sem imports de `apps/*` por pacotes compartilhados.
- [x] 1.3 Configurar ESLint e Prettier compartilhados, incluindo a checagem de formatação no lint da raiz; verificar que `pnpm lint` cobre apps e pacotes e falha diante de uma violação controlada.
- [x] 1.4 Criar `.gitignore` para `.env`, dependências e builds, e `AGENTS.md` com limites HTTP/domínio/persistência, dependências permitidas e regras de evolução; verificar que os arquivos existem e que `git status --short` não mostra artefatos gerados após instalação/build.

## 2. Contratos e componente compartilhado

- [x] 2.1 Implementar em `packages/contracts` schemas e tipos exportados de health check e erro HTTP, sem DTOs de domínio; verificar com teste de parsing válido/inválido e typecheck dos consumidores.
- [x] 2.2 Implementar em `packages/ui` apenas o componente de apresentação de estado usado na página técnica, com rótulos acessíveis; verificar seu consumo por `apps/web` e teste de renderização dos estados.

## 3. Ambiente e persistência

- [x] 3.1 Criar `.env.example`, carregamento explícito do `.env` raiz e schema de ambiente da API para porta, banco, origem web e modo de execução; verificar que valores ausentes ou inválidos encerram a API antes de conectar ao banco ou abrir a porta, sem imprimir segredos.
- [x] 3.2 Configurar o `DataSource` TypeORM/MySQL com `synchronize: false`, pasta de migrations e scripts para consultar/executá-las; verificar conexão com MySQL real e que executar migrations duas vezes não reaplica uma migration de teste.
- [x] 3.3 Adicionar Compose mínimo de MySQL local, com portas e credenciais de desenvolvimento configuráveis; verificar que o serviço atinge estado saudável e aceita a conexão descrita em `.env.example`.
- [x] 3.4 Configurar teste de integração com banco MySQL isolado, sem mock de conexão, e limpeza dos dados de teste; verificar que uma falha de credenciais faz o teste falhar e que a execução normal passa.

## 4. API HTTP

- [x] 4.1 Criar `app.ts` e `modules/health` com `GET /health` público, usando o contrato compartilhado; verificar HTTP 200, JSON esperado e resposta padronizada para método não suportado via teste HTTP.
- [x] 4.2 Adicionar parser JSON, resposta 404 e middleware global que mapeie JSON malformado para 400 e erro inesperado para 500; verificar status e formato `{ error: { code, message } }` sem stack trace em testes HTTP.
- [x] 4.3 Configurar CORS restrito a `WEB_ORIGIN` e logs estruturados com identificador de requisição e redação de dados sensíveis; verificar origem permitida/bloqueada e ausência de senha, cookie e autorização em logs de teste.
- [x] 4.4 Implementar `server.ts` para validar ambiente, abrir conexão, só então escutar na porta configurada e encerrar recursos em sinais de parada; verificar com MySQL real que `/health` responde após startup e que banco indisponível produz saída diferente de zero sem abrir a porta.

## 5. Aplicação web

- [x] 5.1 Criar app React/Vite em `apps/web`, carregar `.env` raiz e validar `VITE_API_BASE_URL` no build; verificar que `pnpm --filter @study-platform/web build` passa com URL válida e falha com URL ausente/inválida.
- [x] 5.2 Implementar página técnica em `src/app` e `src/features/system` que consulta `/health`, valida a resposta compartilhada e mostra carregamento, sucesso, erro e botão de nova tentativa; verificar por testes de componente os três estados e nova tentativa após falha.
- [x] 5.3 Aplicar layout mobile-first e Animate.css apenas de forma pontual com respeito a movimento reduzido; verificar em viewport de 320 px ausência de rolagem horizontal, título/landmark e foco visível/ativação por teclado do botão.

## 6. Comandos, documentação e CI

- [x] 6.1 Completar scripts raiz `lint`, `typecheck`, `test` e `build` para cobrir todos os workspaces aplicáveis; verificar que cada comando retorna zero no projeto íntegro e propaga falha de um workspace.
- [x] 6.2 Documentar no README pré-requisitos, instalação, `.env`, MySQL por Compose ou serviço equivalente, migrations, URLs, desenvolvimento, testes e comandos de qualidade; verificar cada comando seguindo o guia em uma instalação limpa.
- [x] 6.3 Criar workflow do GitHub Actions com lockfile congelado, MySQL temporário, variáveis de teste e os quatro comandos raiz; verificar os mesmos comandos localmente e, quando houver PR no GitHub, que o run passa e uma falha de lint/teste/banco impede sucesso.
- [x] 6.4 Executar a aceitação ponta a ponta da fundação: instalação limpa, migrations, startup web/API, consulta `/health`, teste visual/teclado em 320 px e `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; concluir apenas com todos os resultados registrados e sem código de módulos futuros.

## Verificações do apply (2026-09-22)

- `pnpm install --frozen-lockfile`: passou nos seis workspaces.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`: passaram; 15 testes no total (contratos 2, API 10, web 3). Uma violação temporária em `packages/contracts` fez o lint raiz falhar e foi removida.
- MySQL 8.0 local isolado: conexão real passou; a migration técnica do teste aplicou uma vez, a segunda aplicação aplicou zero, e credenciais inválidas fizeram a conexão falhar. `pnpm db:migration:show` e duas execuções de `pnpm db:migration:run` passaram, aplicando zero migrations de produto.
- API: startup com banco real, `GET /health` HTTP 200 com `{"status":"ok"}` e `X-Request-Id`; banco indisponível gerou saída 1 sem abrir a porta. Ambiente inválido foi rejeitado sem expor o valor da variável.
- Web: build com URL válida passou; URL vazia ou inválida foi rejeitada. Testes cobriram loading, sucesso, erro e retry por teclado. Renderização real no Edge em viewport de 320 px mostrou `innerWidth`, `documentWidth` e `bodyWidth` iguais a 320 px, título e status visíveis.
- `openspec validate bootstrap-study-platform --strict` e `docker compose config --quiet`: passaram. Não há remote Git ou PR para observar um run do GitHub Actions nesta etapa.
- **Tarefa 3.3 concluída na retomada:** `docker compose up -d mysql` iniciou MySQL 8.4.11; `docker inspect` informou `healthy` e `docker compose ps` confirmou `127.0.0.1:3307->3306`. O cliente MySQL conectou a `study_platform_dev` e `study_platform_test` usando as credenciais do `.env` copiado de `.env.example`.
- Após iniciar o Compose, `pnpm install --frozen-lockfile`, `pnpm db:migration:show`, `pnpm db:migration:run`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passaram novamente; os 15 testes, incluindo conexão e migration de teste, usaram o MySQL 8.4.11.
- Com a API conectada ao MySQL 8.4.11, `GET /health` retornou HTTP 200, `{"status":"ok"}` e `X-Request-Id`.
