# Spec Delta

## MODIFIED Requirements

### Requirement: Dependência de banco em testes de integração
Quando os testes de integração precisarem de MySQL, o CI SHALL disponibilizar uma instância real instalada e iniciada diretamente no runner, sem Docker ou containers, configurada por variáveis de ambiente de teste, sem expor credenciais de produção. O ambiente MUST permitir criação e remoção de bancos temporários isolados e manter os bancos de desenvolvimento e teste distintos.

#### Scenario: Teste com banco
- **GIVEN** um teste de integração que precisa consultar MySQL
- **WHEN** o CI executa a suíte de testes
- **THEN** o teste usa a instância temporária do pipeline sem containers
- **AND** o pipeline falha se a conexão ou a migration necessária falhar.

#### Scenario: Banco não inicia
- **WHEN** a preparação do MySQL no runner falha ou excede o tempo de espera de prontidão
- **THEN** o pipeline falha explicitamente sem substituir a conexão por mocks ou ignorar testes.
