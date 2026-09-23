# Proposal

## Why

O repositório ainda contém apenas a configuração do OpenSpec. Sem uma base executável e convenções compartilhadas, as próximas funcionalidades tenderiam a divergir em estrutura, contratos, validação e critérios de qualidade. Esta mudança estabelece uma fundação verificável antes de iniciar os módulos de produto.

## What Changes

- Criar um monorepo TypeScript com pnpm workspaces, aplicações `apps/web` e `apps/api`, pacotes `packages/contracts`, `packages/ui` e `packages/config`, scripts de desenvolvimento e documentação local.
- Entregar uma página técnica React responsiva e acessível que mostre o estado do health check de uma API Express inicial.
- Configurar TypeORM com MySQL, migrations, validação de ambiente, tratamento uniforme de erros e logs estruturados.
- Estabelecer contratos compartilhados mínimos, sem entidades ou DTOs de funcionalidades futuras.
- Configurar ESLint, Prettier, testes, typecheck, build e CI para as verificações básicas.
- Registrar em `AGENTS.md` os limites entre módulos e as convenções permanentes do projeto.

**Objetivo:** permitir que uma pessoa instale as dependências, configure o ambiente, suba web, API e MySQL localmente e execute as verificações de qualidade por comandos documentados.

**Escopo:** somente a fundação técnica e uma interface técnica simples. Docker Compose poderá ser usado apenas para disponibilizar MySQL local.

**Fora do escopo:** landing page final, autenticação e recuperação de conta, onboarding, dashboard, tarefas, matérias, roadmaps, sessões e rotinas, flashcards, importação, repetição espaçada, IA real, analytics, perfil, uploads e e-mail. Nenhuma entidade desses domínios será antecipada.

## Capabilities

### New Capabilities

- `workspace-bootstrap`: instalação e execução dos workspaces do monorepo.
- `web-runtime`: inicialização da aplicação React e página técnica em telas pequenas.
- `api-runtime`: inicialização da API Express e infraestrutura HTTP mínima.
- `api-health`: resposta de health check independente dos módulos futuros.
- `database-connection`: conexão configurável com MySQL e execução explícita de migrations.
- `environment-validation`: falha clara e antecipada para configuração ausente ou inválida.
- `api-error-handling`: respostas de erro consistentes sem vazamento de detalhes internos.
- `shared-contracts`: consumo tipado de contratos comuns entre web e API.
- `quality-commands`: comandos reproduzíveis de lint, typecheck, test e build.
- `continuous-integration`: verificações básicas em CI para cada alteração proposta.

### Modified Capabilities

Nenhuma. O projeto ainda não possui specs vigentes.

## Impact

- Novos arquivos de configuração na raiz, código inicial em `apps/` e `packages/`, `AGENTS.md`, `.env.example`, README e workflow de CI.
- Nova rota HTTP de health check; nenhuma API de domínio nem esquema de tabelas de produto.
- Dependências justificadas pela stack obrigatória, pela validação de ambiente, pelos testes e pelo desenvolvimento local com MySQL.

**Riscos:** configuração de MySQL pode falhar em máquinas sem serviço local; scripts de workspace podem divergir entre CI e desenvolvimento; uma estrutura modular excessiva pode antecipar acoplamentos. O design limita módulos futuros a convenções e diretórios sob demanda, e os critérios de aceitação exigem verificação com configuração real.

**Critérios de sucesso:** os comandos documentados instalam e inicializam web/API; o health check responde; a API se conecta a MySQL e executa migrations vazias/iniciais sem `synchronize` em ambiente persistente; configuração inválida falha de forma legível; respostas de erro seguem o formato definido; lint, typecheck, test e build passam localmente e no CI.
