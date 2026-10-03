# workspace-bootstrap Specification
## Purpose

Define como a fundação do produto é instalada e executada a partir de um único workspace reproduzível por desenvolvimento e CI.

## Requirements
### Requirement: Instalação do monorepo
O projeto SHALL permitir instalar todos os workspaces declarados com pnpm a partir da raiz, usando um lockfile versionado e um comando documentado.

#### Scenario: Instalação limpa
- **GIVEN** uma cópia limpa do repositório e a versão de pnpm indicada no projeto
- **WHEN** a pessoa executa o comando documentado de instalação na raiz
- **THEN** as dependências de `apps/web`, `apps/api` e `packages/*` são resolvidas pelo workspace
- **AND** a instalação não exige instalação manual separada em cada pacote.

### Requirement: Execução local documentada
O projeto SHALL documentar as pré-condições, a configuração de ambiente e os comandos para iniciar web, API e MySQL localmente.

#### Scenario: Primeira execução local
- **GIVEN** dependências instaladas e valores válidos de ambiente configurados conforme o README
- **WHEN** a pessoa segue os comandos de execução local
- **THEN** a web e a API iniciam em endereços documentados
- **AND** o procedimento informa como disponibilizar MySQL e aplicar migrations.
