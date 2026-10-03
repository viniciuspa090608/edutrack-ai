# Proposal

## Why

O desenvolvimento precisa utilizar o MySQL instalado localmente, sem depender de Docker ou Docker Compose. Hoje o Compose também fornece Mailpit e o CI usa MySQL em container; ambos precisam de alternativas para remover essa dependência de forma completa.

## What Changes

- Configurar o desenvolvimento por ambiente para MySQL em `localhost:3306`, usuário `root`; a senha informada será usada somente no `.env` local ignorado pelo Git, nunca em código, exemplos ou artefatos versionados.
- Atualizar `.env.example` com senha vazia e instruções de preenchimento local, mantendo bancos de desenvolvimento e teste separados.
- **BREAKING** Remover `compose.yaml`, `docker/mysql-init.sh`, `db:up` e `mail:up`; retirar referências ao Compose dos comandos de formatação e lint.
- Documentar criação explícita dos bancos locais, permissões para testes isolados, migrations e Mailpit nativo ou provedor SMTP configurado.
- Substituir o serviço MySQL em container do CI por uma instância instalada no runner, mantendo testes reais e os quatro comandos de qualidade.
- Preservar migrations, entities, repositories, validação de ambiente, `synchronize: false` e regras de negócio. Não apagar volumes nem dados existentes.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `database-connection`: explicitar a preparação e operação local sem Docker, por variáveis de ambiente e com bancos isolados.
- `continuous-integration`: disponibilizar MySQL real diretamente no runner sem containers.

## Impact

Arquivos afetados: `.env.example`, `.env` local (somente durante apply), `README.md`, `package.json`, `compose.yaml`, `docker/mysql-init.sh` e `.github/workflows/quality.yml`. O DataSource já recebe host, porta, usuário, senha e banco do ambiente; não há necessidade observada de alterar a persistência da API. O init script apenas valida o nome e cria o banco de teste; o Compose também inicia Mailpit, função que será substituída antes da remoção. Alterações preexistentes nesses arquivos devem ser preservadas por hunk no apply. Histórico OpenSpec permanece intacto.
