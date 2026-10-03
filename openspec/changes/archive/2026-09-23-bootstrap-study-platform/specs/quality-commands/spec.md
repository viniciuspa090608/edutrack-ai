# Spec Delta

## Purpose

Define verificações locais reproduzíveis da fundação para identificar erros de estilo, tipos, testes e compilação antes de integrar mudanças.

## ADDED Requirements

### Requirement: Comandos de qualidade na raiz
O projeto SHALL oferecer comandos documentados `lint`, `typecheck`, `test` e `build` na raiz que executem as verificações aplicáveis aos workspaces mantidos.

#### Scenario: Execução completa em cópia limpa
- **GIVEN** dependências instaladas e configuração de teste válida
- **WHEN** cada comando é executado na raiz
- **THEN** todos os workspaces aplicáveis são verificados
- **AND** cada comando retorna zero apenas quando sua verificação passa.

#### Scenario: Falha detectada
- **GIVEN** um erro de tipo, lint, teste ou compilação em um workspace
- **WHEN** o respectivo comando da raiz é executado
- **THEN** retorna código de saída diferente de zero
- **AND** identifica o workspace ou arquivo que falhou.

### Requirement: Testes da fundação
A configuração de testes SHALL permitir executar testes unitários e de integração da API e testes de componentes da web, com verificações reais para os comportamentos iniciais relevantes.

#### Scenario: Suíte inicial
- **GIVEN** a fundação implementada
- **WHEN** o comando `test` é executado
- **THEN** verifica ao menos health check, validação de ambiente, formato de erro e renderização da página técnica
- **AND** falhas reais de configuração exigida não são ocultadas por mocks.
