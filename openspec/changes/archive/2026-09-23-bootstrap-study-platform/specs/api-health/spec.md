# Spec Delta

## Purpose

Define uma verificação HTTP simples da API para confirmar que o processo inicializado responde sem depender de regras de módulos de produto.

## ADDED Requirements

### Requirement: Health check
A API SHALL expor `GET /health`, sem autenticação, com HTTP 200 e corpo JSON tipado indicando estado operacional quando estiver pronta.

#### Scenario: Processo pronto
- **GIVEN** a API iniciada com suas dependências obrigatórias prontas
- **WHEN** um cliente envia `GET /health`
- **THEN** recebe HTTP 200 e `Content-Type: application/json`
- **AND** o corpo segue o contrato compartilhado de health check.

#### Scenario: Método incompatível
- **GIVEN** a API iniciada
- **WHEN** um cliente envia um método não suportado para `/health`
- **THEN** recebe uma resposta de erro padronizada
- **AND** a rota não executa qualquer operação de domínio.
