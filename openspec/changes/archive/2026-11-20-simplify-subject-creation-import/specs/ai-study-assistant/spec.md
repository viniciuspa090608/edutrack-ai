## ADDED Requirements

### Requirement: Mensagens compactas e envio integrado
A conversa SHALL limitar a largura de leitura das mensagens e ajustar seus cards ao conteúdo, com espaçamento interno compacto. SHALL preservar rótulos de autoria, superfícies distintas e azul claro da IA nos temas suportados, além de prévias e confirmações alcançáveis. O envio SHALL usar botão compacto com ícone integrado visualmente à área de composição, nome acessível Enviar mensagem, foco visível e área acionável de pelo menos 44 por 44 px. SHALL preservar Enter, Shift+Enter, proteção IME, bloqueio durante envio, limites e retry idempotente existentes. Textos longos SHALL quebrar sem overflow e o compositor SHALL permanecer alcançável com teclado virtual.

#### Scenario: Mensagens curtas e longas em desktop
- **WHEN** a conversa apresenta pergunta curta, resposta longa e prévia
- **THEN** os cards não ocupam toda a largura desnecessariamente, a leitura tem largura limitada e prévias continuam operáveis.

#### Scenario: Envio acessível em tela estreita
- **WHEN** a pessoa usa o botão por teclado ou toque em 320 px
- **THEN** consegue identificar Enviar mensagem, enviar uma única vez e alcançar o campo sem conteúdo encoberto.
