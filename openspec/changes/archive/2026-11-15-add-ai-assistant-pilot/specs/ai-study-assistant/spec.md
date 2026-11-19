## Purpose

Permitir que contas elegíveis conversem com a IA configurada, consultem seus estudos e revisem criações antes de gravá-las.

## ADDED Requirements

### Requirement: Conversa autenticada e recuperável

O Assistente IA SHALL permitir iniciar e retomar conversas recentes durante o piloto para contas autenticadas com IA habilitada. SHALL informar antes do envio que a mensagem, o trecho recente necessário e dados pertinentes de estudo podem seguir ao provedor configurado. Sugestões SHALL refletir módulos ativos e preencher um campo editável sem enviar automaticamente. O chat SHALL oferecer estados acessíveis de carregamento, vazio, resposta e falha, suporte a teclado, foco visível, movimento reduzido e uso a partir de 320 px.

#### Scenario: Sugestão em tela estreita

- **WHEN** a pessoa seleciona por teclado uma sugestão de módulo ativo em uma tela de 320 px
- **THEN** o texto aparece no campo editável com foco e o envio depende de uma ação explícita.

#### Scenario: Falha recuperável

- **WHEN** o envio encontra cota esgotada, timeout ou indisponibilidade
- **THEN** a conversa e a mensagem permanecem disponíveis, a interface explica a falha e permite tentar novamente explicitamente sem duplicar a mensagem de origem.

#### Scenario: Acesso direto sem IA

- **WHEN** a conta perde elegibilidade ou desativa IA e tenta abrir a rota ou chamar a API
- **THEN** o conteúdo privado do chat fica inacessível e nenhuma chamada ao provedor ou criação é iniciada.

### Requirement: Consultas isoladas e contexto limitado

A API SHALL derivar a conta da sessão e restringir consultas, conversas, mensagens, prévias e confirmações a essa conta. Consultas do piloto SHALL abranger tarefas, matérias e flashcards de módulos ativos, com seleção limitada dos dados pertinentes. Mensagens, dados de estudo e saídas do provedor SHALL ser tratados como dados sem autoridade para ampliar permissões. Limites configuráveis SHALL restringir mensagem, contexto recente e resposta. Logs operacionais SHALL excluir credenciais, tokens, texto bruto e dados de outras contas.

#### Scenario: Pergunta sobre tarefas da semana

- **WHEN** a pessoa pergunta pelas tarefas que vencem nesta semana com Tarefas habilitado
- **THEN** o contexto contém somente as tarefas pertinentes e autorizadas da conta, dentro dos limites configurados.

#### Scenario: Identificador alheio ou instrução em dados

- **WHEN** um identificador de outra conta é apresentado ou um texto tenta ampliar o escopo autorizado
- **THEN** o sistema rejeita o identificador sem revelar existência e não consulta nem modifica dados fora do escopo permitido.

### Requirement: Prévia e confirmação idempotente

O assistente SHALL limitar propostas de escrita à criação de matérias, tarefas e flashcards em baralhos existentes. Quando faltarem campos obrigatórios ou houver destinos ambíguos, SHALL pedir esclarecimento. A API SHALL validar a proposta antes de exibir uma prévia com conteúdo e destino. A confirmação SHALL revalidar sessão, elegibilidade, módulos pertinentes, propriedade e dados, usar serviços públicos dos módulos e executar a criação com chave de idempotência, sem chamar o provedor.

#### Scenario: Destino ambíguo

- **WHEN** a solicitação de flashcards corresponde a vários baralhos ou não identifica um destino válido
- **THEN** o chat pede esclarecimento para um novo turno sem criar registros.

#### Scenario: Confirmação repetida

- **WHEN** a pessoa confirma a mesma prévia válida em paralelo ou repete a confirmação após perder a resposta
- **THEN** há uma única criação ou um único lote atômico e a repetição autorizada recupera o resultado original.

#### Scenario: Prévia perde autorização

- **WHEN** o destino deixa de pertencer à conta, o módulo é desabilitado ou a prévia expira antes da confirmação
- **THEN** a API recusa a confirmação sem criar conteúdo nem chamar o provedor.

### Requirement: Retenção individual e limpeza periódica

O histórico SHALL ser persistido no MySQL e consultável com paginação. Cada mensagem SHALL expirar 30 dias corridos após sua criação e ficar imediatamente fora das consultas e do contexto quando expirada. A implantação SHALL executar limpeza periódica em lotes com índice por expiração, incluindo conversas vazias, mesmo sem tráfego. Criações confirmadas SHALL sobreviver à expiração do histórico.

#### Scenario: Conversa com mensagens de idades diferentes

- **WHEN** uma mensagem vence enquanto outra mensagem da conversa permanece vigente
- **THEN** somente a mensagem vigente permanece disponível para leitura e seleção de contexto, mesmo antes da limpeza física.

#### Scenario: Reinício durante limpeza

- **WHEN** a rotina de limpeza é interrompida e reinicia sem atividade no chat
- **THEN** volta a remover lotes vencidos e conversas vazias, preservando mensagens vigentes e criações confirmadas.

### Requirement: Evidência operacional do piloto

O piloto SHALL registrar métricas agregadas de latência, chamadas por mensagem, falhas de cota e crescimento do histórico sem textos ou credenciais. Antes de ampliar acesso, SHALL registrar volume e concorrência validados, latência observada, folga da cota compartilhada e ajustes dos limites com base nessas medições.

#### Scenario: Revisão para ampliação

- **WHEN** a equipe avalia ampliar o piloto
- **THEN** dispõe de evidências dos provedores liberados, da capacidade validada e da folga reservada aos fluxos existentes.
