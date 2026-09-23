# Spec Delta

## Purpose

Define respostas e registros de erro previsíveis para clientes HTTP sem revelar detalhes internos ou dados sensíveis da API.

## ADDED Requirements

### Requirement: Formato uniforme de erro
A API SHALL responder erros HTTP em JSON com `error.code` estável e `error.message` legível, além do status HTTP apropriado.

#### Scenario: Rota inexistente
- **GIVEN** a API iniciada
- **WHEN** um cliente solicita uma rota não registrada
- **THEN** recebe HTTP 404 no formato uniforme de erro
- **AND** não recebe uma página HTML de erro.

#### Scenario: JSON inválido
- **GIVEN** a API iniciada
- **WHEN** um cliente envia JSON malformado com `Content-Type: application/json`
- **THEN** recebe HTTP 400 no formato uniforme de erro
- **AND** a resposta não inclui stack trace.

#### Scenario: Falha inesperada
- **GIVEN** uma falha inesperada durante o processamento de uma requisição
- **WHEN** o tratamento global de erros a captura
- **THEN** o cliente recebe HTTP 500 com mensagem genérica no formato uniforme
- **AND** o detalhe técnico é registrado em log estruturado sem credenciais ou hashes.
