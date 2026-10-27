## Purpose

Permitir preparar o banco local de demonstração com operações explícitas e verificáveis, preservando sua estrutura e prevenindo limpeza de ambientes indevidos.

## ADDED Requirements

### Requirement: Alvo explícito e ambiente restrito

Os comandos de inspeção, reset e população SHALL usar a configuração efetiva do banco de desenvolvimento, mostrar host, porta e nome sem segredos e MUST rejeitar ambiente diferente de development. O reset MUST exigir confirmação que corresponda ao alvo completo antes de executar qualquer operação destrutiva.

#### Scenario: Confirmação ausente ou incorreta

- **WHEN** o reset é solicitado sem confirmação do alvo efetivo ou com confirmação divergente
- **THEN** nenhum dado é alterado e o comando informa o alvo e como confirmar.

#### Scenario: Ambiente proibido

- **WHEN** reset ou população são solicitados em production ou test
- **THEN** o comando termina com erro antes de qualquer escrita.

### Requirement: Limpeza preserva estrutura e migrations

O reset SHALL limpar os dados da aplicação por TRUNCATE, respeitar as chaves estrangeiras e preservar tabelas, índices, constraints e histórico de migrations. SHALL restaurar a verificação de chaves estrangeiras mesmo em caso de erro e informar falha parcial sem afirmar sucesso.

#### Scenario: Reset confirmado

- **WHEN** o alvo de desenvolvimento é confirmado e o reset termina
- **THEN** as tabelas de dados ficam vazias e a estrutura e os registros de migrations permanecem intactos.

#### Scenario: Falha durante limpeza

- **WHEN** uma tabela não pode ser truncada
- **THEN** o comando termina com erro, identifica a etapa sem segredos e restaura a verificação de chaves estrangeiras.

### Requirement: Operações independentes da inicialização

Reset e população SHALL ter comandos explícitos documentados e reproduzíveis e MUST NOT executar automaticamente ao iniciar a aplicação.

#### Scenario: Iniciar demonstração existente

- **WHEN** a pessoa executa npm run dev
- **THEN** nenhum reset ou seed é disparado e os dados existentes são preservados.
