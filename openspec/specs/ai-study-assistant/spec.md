# ai-study-assistant Specification

## Purpose

Permitir que contas elegíveis conversem com a IA configurada, consultem seus estudos e revisem criações antes de gravá-las.

## Requirements

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

### Requirement: Workspace visual do Assistente de IA
O Assistente SHALL usar a paleta e tokens atuais nos temas claro e escuro. SHALL apresentar cabeçalho compacto com título e Nova conversa, histórico lateral de conversas reais com seleção atual e paginação, aviso de envio ao provedor e retenção de 30 dias por mensagem, boas-vindas centralizadas quando não houver mensagens e sugestões em cards com ícone, categoria, texto e descrição curta. As sugestões SHALL respeitar módulos ativos e preencher o campo editável com foco, sem envio automático. A referência SHALL orientar composição e espaçamento sem introduzir anexos, microfone, dados fictícios ou funcionalidades adicionais.

#### Scenario: Entrada sem mensagens
- **WHEN** uma conta elegível abre uma nova conversa
- **THEN** vê boas-vindas e cards de sugestões suportadas, aviso de privacidade antes do envio e Nova conversa no cabeçalho.

#### Scenario: Histórico real
- **WHEN** a pessoa seleciona uma conversa ou pede mais conversas
- **THEN** vê dados reais e seleção atual, com loading, erro e paginação preservados; não aparecem títulos ou contagens inventados.

### Requirement: Compositor integrado e conversa responsiva
O campo de mensagem SHALL integrar botão Enviar e ficar na parte inferior do painel, com mensagens acima e sem encobrir mensagens, prévias ou confirmações. Enter SHALL enviar texto válido e Shift+Enter SHALL inserir quebra de linha; composição de texto por IME SHALL NOT disparar envio. O botão SHALL continuar operável por teclado e respeitar limite de texto, bloqueio durante envio e estados de erro. Em 320 px o histórico SHALL ser adaptado em região acessível recolhível, sem uma segunda sidebar permanente comprimindo a conversa; seu acionador SHALL informar expansão. SHALL preservar retry sem duplicação, histórico de mensagens paginado, prévias, confirmação idempotente e foco visível. SHALL respeitar movimento reduzido, teclado virtual e barra inferior global.

#### Scenario: Envio por teclado
- **WHEN** a pessoa usa Shift+Enter, Enter ou composição IME
- **THEN** obtém quebra de linha, envio explícito válido ou composição sem envio, respectivamente, sem duplicar mensagens durante loading.

#### Scenario: Conversa longa e prévia
- **WHEN** a conversa contém mensagens extensas e uma prévia de criação
- **THEN** todas as mensagens, dados da prévia e confirmação ficam alcançáveis e o compositor não os encobre.

#### Scenario: Mobile e falha
- **WHEN** a pessoa usa 320 px, abre histórico ou recebe falha no envio
- **THEN** histórico, mensagem e retry continuam acessíveis por teclado e toque, com foco coerente e sem overflow horizontal nos dois temas.
