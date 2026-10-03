# Spec Delta

## Purpose

Define o comportamento da fundação diante de configurações ausentes ou inválidas, para evitar inicialização ambígua e exposição de segredos.

## ADDED Requirements

### Requirement: Validação antecipada do ambiente
A API SHALL validar as variáveis obrigatórias e seus formatos antes de conectar ao banco ou abrir a porta HTTP.

#### Scenario: Variável obrigatória ausente
- **GIVEN** uma variável obrigatória ausente
- **WHEN** a API inicia
- **THEN** a inicialização falha com código de saída diferente de zero
- **AND** a mensagem identifica a chave inválida sem imprimir valores secretos.

#### Scenario: Valor inválido
- **GIVEN** uma porta ou outro valor tipado fora do formato permitido
- **WHEN** a API inicia
- **THEN** a configuração é rejeitada antes de abrir a porta HTTP
- **AND** o motivo pode ser identificado a partir da mensagem de erro.

### Requirement: Validação da configuração pública da web
O build da web SHALL validar a URL pública da API e falhar se ela estiver ausente ou inválida, sem incorporar segredos ao bundle.

#### Scenario: URL da API inválida
- **GIVEN** a URL pública da API ausente ou fora do formato permitido
- **WHEN** a web é construída
- **THEN** o build falha com indicação da chave de configuração inválida
- **AND** nenhum valor secreto é impresso.

### Requirement: Exemplo de ambiente
O projeto SHALL fornecer `.env.example` com todas as chaves necessárias para execução local e valores de exemplo que não sejam credenciais reais.

#### Scenario: Preparação local
- **GIVEN** uma cópia limpa do repositório
- **WHEN** a pessoa consulta `.env.example` e o README
- **THEN** identifica as chaves obrigatórias e como configurá-las
- **AND** nenhum segredo real está versionado no exemplo.
