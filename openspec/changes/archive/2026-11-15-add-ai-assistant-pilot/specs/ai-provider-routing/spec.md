## MODIFIED Requirements

### Requirement: Resolução por conta em todos os fluxos
A API SHALL resolver a configuração da conta autenticada ao iniciar geração de roadmaps, regeneração de passos pendentes, geração de flashcards e turnos do Assistente IA. O modo padrão SHALL usar exclusivamente Gemini com modelo configurado pelo operador e credencial privada do projeto. O modo pessoal SHALL usar exclusivamente provedor, modelo e chave da conta. Todas as verificações de autenticação, propriedade e módulos habilitados SHALL ocorrer antes da chamada externa. Uma chamada em andamento SHALL manter a configuração capturada no início; alterações SHALL valer nas próximas gerações.

#### Scenario: Geração padrão
- **WHEN** uma conta no modo padrão solicita geração autorizada
- **THEN** o servidor chama Gemini usando sua credencial privada e não a envia à web nem no conteúdo do prompt.

#### Scenario: Configuração pessoal aplicada aos três fluxos
- **GIVEN** uma conta no modo pessoal
- **WHEN** solicita roadmap, regeneração de passos ou flashcards
- **THEN** cada fluxo usa a configuração pessoal atual sem consultar credenciais de outra conta.

#### Scenario: IA desativada
- **WHEN** uma conta com IA desativada solicita geração
- **THEN** o acesso é recusado antes de chamar qualquer provedor, mesmo havendo chave salva.

#### Scenario: Configuração atual no chat

- **WHEN** uma conta elegível envia uma mensagem após alterar sua configuração
- **THEN** o turno usa a nova configuração autorizada e chamadas já iniciadas preservam seu snapshot.

## ADDED Requirements

### Requirement: Orçamento e compatibilidade do Assistente IA

Cada envio SHALL iniciar no máximo uma chamada externa, usando os limites de frequência, concorrência e timeout existentes. Uma tentativa explícita posterior SHALL respeitar os mesmos limites. A admissão no modo padrão SHALL reservar atomicamente os limites gerais e tetos próprios do chat para orçamento diário e concorrência, configurados para preservar capacidade para roadmaps e flashcards. O chat SHALL operar somente com combinações de provedor e modelo validadas para o piloto. Uma configuração incompatível SHALL receber orientação recuperável sem chamada externa nem fallback.

#### Scenario: Chat esgota seu teto

- **WHEN** solicitações concorrentes atingem o teto do chat e ainda há capacidade nos limites gerais
- **THEN** novos envios do chat são recusados antes da chamada externa e roadmaps e flashcards continuam sujeitos aos limites gerais.

#### Scenario: Configuração incompatível

- **WHEN** a configuração da conta não está validada para o chat
- **THEN** o chat informa a incompatibilidade e orienta revisar a configuração, preservando o histórico e os fluxos atuais.

#### Scenario: Novo turno de esclarecimento

- **WHEN** o provedor pede esclarecimento
- **THEN** a resposta encerra o turno e uma nova chamada depende de um novo envio da pessoa.
