# environment-validation Specification
## Purpose

Define o comportamento da fundação diante de configurações ausentes ou inválidas, para evitar inicialização ambígua e exposição de segredos.

## Requirements
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

### Requirement: Ambiente seguro para configuração de IA por conta
A API SHALL aceitar configuração privada explícita de chave e modelo Gemini padrão, exigir que ambos sejam configurados juntos e validar modelos compatíveis antes de iniciar. A ausência de ambos SHALL desabilitar somente geração padrão, preservando modo pessoal. A API SHALL exigir chave de criptografia de credenciais pessoais independente das chaves de e-mail e assinatura, com 32 bytes hexadecimais e identificação de versão. A configuração SHALL validar limites positivos de uso por conta e globais. Valores secretos SHALL NOT aparecer em mensagens de validação. Exemplos SHALL conter apenas nomes e valores não secretos; configurações antigas OpenAI SHALL NOT ser interpretadas como Gemini.

#### Scenario: Padrão parcialmente configurado
- **WHEN** somente chave ou modelo Gemini padrão é informado
- **THEN** a inicialização falha identificando os nomes inválidos sem imprimir seus valores.

#### Scenario: Sem credencial compartilhada
- **WHEN** a API inicia sem chave e modelo Gemini padrão, com demais configurações válidas
- **THEN** o modo pessoal permanece disponível e nenhuma chave pessoal é usada para atender outras contas.

#### Scenario: Criptografia inválida
- **WHEN** falta a chave dedicada ou ela tem formato inválido ou reutiliza segredo de e-mail ou assinatura
- **THEN** a inicialização é recusada sem expor o segredo.

#### Scenario: Ambiente antigo
- **WHEN** somente a antiga configuração global OpenAI está presente
- **THEN** a aplicação exige migração explícita sem enviar essa credencial ao Gemini e sem imprimi-la.
