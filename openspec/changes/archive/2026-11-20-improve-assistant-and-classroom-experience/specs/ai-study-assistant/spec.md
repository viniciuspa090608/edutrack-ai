## ADDED Requirements

### Requirement: Área integral e rolagem independente do assistente

O Assistente SHALL ocupar a largura e a altura úteis do shell autenticado, seguindo o aproveitamento de espaço da tela de configurações. Histórico e mensagens SHALL ter rolagens verticais independentes, sem depender de rolagem da página para alcançar o compositor. Cabeçalho, aviso de privacidade, compositor e controles SHALL permanecer alcançáveis. Em telas estreitas o histórico SHALL continuar recolhível e acessível, sem comprimir permanentemente o chat. O layout SHALL funcionar desde 320 px, em alturas reduzidas, com teclado virtual e movimento reduzido, sem encobrir conteúdo ou controles.

#### Scenario: Histórico e conversa extensos

- **WHEN** uma pessoa abre uma conversa longa com muitas conversas no histórico em desktop
- **THEN** rolar o histórico não move as mensagens e rolar as mensagens não move o histórico nem a página; o compositor continua alcançável.

#### Scenario: Tela estreita ou baixa

- **WHEN** a pessoa usa 320 px ou abre o teclado virtual
- **THEN** pode alternar histórico e conversa, ler todas as mensagens e enviar texto sem overflow horizontal ou controles encobertos.

### Requirement: Título real da conversa e metadados secundários

Cada conversa com mensagem vigente do usuário SHALL usar como título o texto da primeira mensagem vigente do usuário em ordem cronológica. Datas e horas SHALL aparecer em uma linha secundária cinza, usando formato local legível e sem substituir o título. Títulos longos SHALL ser abreviados apenas visualmente, com conteúdo completo acessível, sem modificar a mensagem. Conversas sem mensagem vigente do usuário SHALL usar “Nova conversa”. Títulos SHALL respeitar isolamento por usuário e a expiração de 30 dias por mensagem; conteúdo expirado SHALL NOT permanecer revelado pelo título.

#### Scenario: Primeira mensagem e reabertura

- **WHEN** a pessoa envia “Quais tarefas vencem nesta semana?” e reabre o histórico
- **THEN** a conversa mostra esse texto como título e a data e hora de criação como subtítulo cinza; mensagens posteriores não substituem o título enquanto a primeira estiver vigente.

#### Scenario: Expiração e conversa vazia

- **WHEN** a primeira mensagem expira ou uma conversa ainda não possui mensagem do usuário
- **THEN** o título usa a próxima mensagem vigente do usuário ou “Nova conversa”, sem recuperar texto vencido.

### Requirement: Identificação visual das mensagens por autoria

Mensagens do usuário e respostas da IA SHALL ter superfícies visualmente distintas. A resposta da IA SHALL usar azul claro coerente com a paleta da plataforma e adaptado aos temas claro e escuro, mantendo contraste legível. Rótulos textuais de autoria SHALL permanecer presentes para que a identificação não dependa somente de cor. Prévias, confirmações e falhas SHALL preservar legibilidade e interação.

#### Scenario: Mensagens nos dois temas

- **WHEN** a conversa apresenta pergunta, resposta da IA e prévia nos temas claro e escuro
- **THEN** o usuário distingue autoria por rótulo e superfície, identifica o azul claro da resposta e consegue operar a prévia por teclado.
