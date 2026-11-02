# ai-provider-routing Specification

## Purpose

Executar a geração de estudos com o provedor e a credencial autorizados para cada conta, preservando os limites e a segurança dos fluxos existentes.

## Requirements

### Requirement: Resolução por conta em todos os fluxos
A API SHALL resolver a configuração da conta autenticada ao iniciar geração de roadmaps, regeneração de passos pendentes e geração de flashcards. O modo padrão SHALL usar exclusivamente Gemini com modelo configurado pelo operador e credencial privada do projeto. O modo pessoal SHALL usar exclusivamente provedor, modelo e chave da conta. Todas as verificações de autenticação, propriedade e módulos habilitados SHALL ocorrer antes da chamada externa. Uma chamada em andamento SHALL manter a configuração capturada no início; alterações SHALL valer nas próximas gerações.

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

### Requirement: Provedores restritos e resposta validada
O sistema SHALL suportar exclusivamente Gemini, Claude, OpenAI apresentado como ChatGPT, DeepSeek e Kimi, em destinos oficiais fixos no servidor. O catálogo SHALL limitar modelos a combinações compatíveis com geração estruturada. Nenhum modelo ou texto do usuário SHALL definir host, caminho arbitrário ou redirecionamento da requisição. Toda resposta SHALL passar pelas validações estruturais e limites de domínio existentes antes de ser apresentada como prévia. Timeout, recusa, resposta inválida ou limite de tamanho SHALL retornar erro recuperável sem salvar conteúdo.

#### Scenario: Matriz de provedores
- **WHEN** cada um dos cinco provedores retorna uma resposta válida para cada fluxo suportado
- **THEN** a prévia segue os mesmos contratos e validações de domínio independentemente do provedor.

#### Scenario: Saída inadequada
- **WHEN** um provedor retorna JSON inválido, campos incompatíveis, recusa ou conteúdo excessivo
- **THEN** nenhuma prévia válida é exibida nem conteúdo é persistido e a falha é sanitizada.

### Requirement: Falhas sem troca de credencial
Falha, chave inválida, ausência de configuração, modelo indisponível ou cota esgotada SHALL NOT causar troca automática para outro provedor, modelo ou credencial. A interface SHALL distinguir falha de credencial pessoal, indisponibilidade e limite atingido sem expor resposta bruta. Restaurar o padrão SHALL exigir ação explícita. Operações manuais SHALL permanecer independentes da IA. Confirmar uma prévia existente SHALL preservar expiração, assinatura, autorização e idempotência sem nova chamada externa, mesmo após troca de configuração.

#### Scenario: Chave pessoal recusada
- **WHEN** o provedor recusa a chave pessoal
- **THEN** a aplicação orienta revisar a configuração sem tentar a chave compartilhada do projeto.

#### Scenario: Padrão indisponível
- **WHEN** a configuração Gemini padrão está ausente ou o serviço está indisponível
- **THEN** o fluxo padrão informa indisponibilidade e os fluxos manuais e configurações pessoais válidas permanecem utilizáveis.

#### Scenario: Confirmar depois de trocar provedor
- **GIVEN** uma prévia ainda válida e a preferência de IA habilitada
- **WHEN** a pessoa muda o provedor e confirma a prévia
- **THEN** as verificações existentes determinam a confirmação, sem nova geração ou duplicação de conteúdo.

### Requirement: Limites de uso compartilhado
Geração SHALL exigir sessão autenticada e limites de frequência e concorrência por conta. O modo padrão SHALL também respeitar orçamento diário de chamadas e concorrência globais configurados pelo operador e compartilhados entre instâncias. Reservas SHALL ser atômicas antes da chamada externa; quando um limite for atingido, SHALL responder erro recuperável sem chamada ao provedor. A interface SHALL informar que o padrão gratuito está sujeito a limites e disponibilidade.

#### Scenario: Cota global concorrente
- **GIVEN** uma chamada restante no orçamento compartilhado
- **WHEN** duas contas solicitam geração simultaneamente
- **THEN** no máximo uma nova chamada externa é autorizada e a outra recebe indicação de limite.

#### Scenario: Limite pessoal
- **WHEN** uma conta excede a frequência ou concorrência permitida
- **THEN** novas gerações são recusadas temporariamente sem impedir edição manual.
