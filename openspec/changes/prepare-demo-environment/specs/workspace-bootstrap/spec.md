## MODIFIED Requirements

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
