# Spec Delta

## Purpose

Define a verificação automatizada da fundação em integração contínua, garantindo que o mesmo conjunto de comandos locais seja executado em alterações propostas.

## ADDED Requirements

### Requirement: Pipeline de verificação
O CI SHALL instalar dependências com lockfile imutável e executar `lint`, `typecheck`, `test` e `build` a partir da raiz em alterações propostas.

#### Scenario: Alteração válida
- **GIVEN** uma alteração proposta com dependências declaradas no lockfile
- **WHEN** o pipeline de CI é executado
- **THEN** os quatro comandos de qualidade são executados
- **AND** o pipeline conclui com sucesso somente se todos passarem.

#### Scenario: Verificação falha
- **GIVEN** uma alteração que quebra qualquer comando obrigatório
- **WHEN** o pipeline de CI é executado
- **THEN** o pipeline falha
- **AND** o resultado indica qual verificação falhou.

### Requirement: Dependência de banco em testes de integração
Quando os testes de integração precisarem de MySQL, o CI SHALL disponibilizar uma instância real configurada por variáveis de ambiente de teste, sem expor credenciais de produção.

#### Scenario: Teste com banco
- **GIVEN** um teste de integração que precisa consultar MySQL
- **WHEN** o CI executa a suíte de testes
- **THEN** o teste usa a instância temporária do pipeline
- **AND** o pipeline falha se a conexão ou a migration necessária falhar.
