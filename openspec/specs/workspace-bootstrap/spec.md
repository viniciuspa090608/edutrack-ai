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

O projeto SHALL documentar pré-condições, configuração de ambiente, MySQL local, migrations, credenciais dos perfis, comandos explícitos de reset e população e endereços de acesso no computador e na rede local. SHALL disponibilizar npm run dev na raiz, delegando a pnpm como gerenciador do monorepo, para iniciar web, API e worker de e-mail juntos com encerramento coordenado e sem operações automáticas de limpeza ou população.

#### Scenario: Primeira execução local

- **GIVEN** dependências instaladas e valores válidos de ambiente configurados conforme o README
- **WHEN** a pessoa segue os comandos de execução local
- **THEN** web, API e worker iniciam nos endereços documentados
- **AND** o procedimento informa como disponibilizar MySQL e aplicar migrations.

#### Scenario: Interrupção e falha

- **WHEN** a pessoa interrompe npm run dev ou um dos processos falha
- **THEN** os processos filhos são encerrados e as portas liberadas
- **AND** falhas retornam código de saída diferente de zero.
