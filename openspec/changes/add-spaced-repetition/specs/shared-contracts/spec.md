# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos de revisão espaçada
O pacote compartilhado SHALL oferecer tipos e schemas públicos para as avaliações `AGAIN`, `HARD`, `GOOD` e `EASY`, para o estado de agendamento, a lista de pendentes e os registros de revisão, incluindo próxima data e versão da política. Web e API SHALL usar os mesmos contratos e validar entradas externas antes de processar uma avaliação.

#### Scenario: Avaliação inválida
- **WHEN** uma requisição envia avaliação diferente dos quatro valores permitidos ou identificador inválido
- **THEN** a validação de fronteira rejeita o pedido antes de alterar agendamento ou histórico.

#### Scenario: Contratos compartilhados
- **WHEN** web e API executam typecheck
- **THEN** ambas usam os mesmos formatos de revisão e próxima data sem definições divergentes locais.
