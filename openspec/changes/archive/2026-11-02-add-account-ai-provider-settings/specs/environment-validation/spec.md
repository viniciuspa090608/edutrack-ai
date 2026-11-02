## ADDED Requirements

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
