## ADDED Requirements

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
