# EduTrack

Plataforma de estudos em construção. A página inicial apresenta os recursos planejados; a página técnica React continua em `/status`. A API Express oferece `GET /health`, com contratos compartilhados e conexão MySQL. Funcionalidades de estudo e autenticação serão mudanças OpenSpec separadas.

## Pré-requisitos

- Node.js 24 ou 25 e pnpm 11.25.0 (ver `packageManager` no `package.json`).
- Docker com Compose para MySQL local, ou MySQL 8.4 equivalente.

## Preparação local

Na raiz do repositório, instale e configure o ambiente:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

O arquivo `.env` é local e ignorado pelo Git. Ajuste `DB_PASSWORD` para uma senha local e mantenha `DB_NAME` e `TEST_DB_NAME` diferentes. `DB_PORT=3307` evita conflito com um MySQL local na porta padrão. `VITE_API_BASE_URL` contém somente a origem pública da API; nunca coloque segredos em variáveis `VITE_*`.

Inicie o banco e consulte as migrations:

```powershell
pnpm db:up
pnpm db:migration:show
pnpm db:migration:run
```

O Compose cria os bancos de desenvolvimento e teste na primeira inicialização. O volume mantém os dados entre reinicializações. Se usar um MySQL já instalado, crie os dois bancos conforme `.env` e dê ao usuário configurado permissão para conectar, criar e remover tabelas no banco de teste. Não há migrations de produto nesta fundação; `migration:show` e `migration:run` devem concluir sem alterações.

Em terminais separados:

```powershell
pnpm dev:api
pnpm dev:web
```

A landing abre em <http://localhost:5173/> sem depender da API. A página provisória de acesso fica em `/acesso` e o diagnóstico técnico em `/status`. A API abre em <http://localhost:3001>; `GET http://localhost:3001/health` responde `{"status":"ok"}` após a conexão com o banco. A página técnica mostra o estado da API e oferece nova tentativa se ela estiver indisponível. Para executar o build da API, use `pnpm build` e depois `pnpm --filter @study-platform/api start`.

Para publicar a web em hospedagem estática, configure o servidor para devolver `index.html` nas aberturas diretas de `/acesso` e `/status` (fallback de SPA). Arquivos em `/illustrations/` devem continuar servidos diretamente. O servidor de desenvolvimento e o preview do Vite já oferecem esse fallback.

## Verificações

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` inclui integração real com o MySQL em `TEST_DB_NAME`; o banco precisa estar ativo. O teste cria e remove uma tabela técnica nesse banco. Os demais comandos cobrem todos os workspaces aplicáveis. O CI executa os mesmos comandos com MySQL temporário e instalação por lockfile congelado.

## Organização

- `apps/web`: React, Vite e interface mobile-first.
- `apps/api`: Express, TypeORM, migrations e módulos da API. O primeiro módulo é `health`.
- `packages/contracts`: schemas Zod e tipos de fronteira usados por API e web.
- `packages/ui`: apresentação compartilhada efetivamente usada pela página técnica.
- `packages/config`: presets TypeScript, ESLint e Prettier.
- `openspec/changes`: planejamento e tarefas por mudança.

Leia `AGENTS.md` para as regras de arquitetura e versionamento. O planejamento desta fundação está em `openspec/changes/bootstrap-study-platform`.
