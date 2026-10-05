# Spec Delta

## ADDED Requirements

### Requirement: Acomodação integral da autenticação em desktop
A interface SHALL apresentar integralmente login e cadastro em `/acesso`, confirmação de e-mail em `/confirmar-email` e todas as etapas de `/recuperar-senha` nas viewports de conteúdo 1366×768, 1440×900 e 1920×1080, com zoom de 100%, nos temas claro e escuro, sem rolagem vertical ou horizontal da página ou de regiões internas. Essa garantia SHALL incluir textos atuais e estados aplicáveis de validação, loading, erro e sucesso, inclusive mensagens simultâneas permitidas pelo fluxo. Campos, instruções, mensagens e ações SHALL permanecer legíveis e inteiramente visíveis. Espaçamentos, dimensões e conteúdo decorativo SHALL adaptar-se à altura disponível preservando identidade visual e conteúdo essencial; excedentes SHALL NOT ser resolvidos por ocultação de overflow, corte, truncamento de mensagens, redução global por escala ou remoção de ações.

#### Scenario: Login e cadastro com feedback
- **WHEN** login ou cadastro é exibido em qualquer viewport de referência a 100%, em qualquer tema, em estado inicial, validação, envio ou erro, ou com aviso de segurança alterada e erro OAuth e/ou erro de submissão simultâneos conforme o fluxo atual
- **THEN** títulos, tabs, campos, dicas aplicáveis, feedback completo, submissão, Google, recuperação e retorno ficam inteiramente dentro da viewport sem rolagem ou sobreposição
- **AND** resultados ativos ou pendentes mantêm os destinos atuais, sem criar uma nova tela de sucesso local.

#### Scenario: Confirmação em todos os estados
- **WHEN** confirmação é exibida em uma viewport de referência e tema, antes ou durante confirmação/reenvio, com validação, erro de código, rede, espera de reenvio ou sucesso
- **THEN** instruções, status e erros coexistentes, campo e ações aplicáveis, contador e caminho de entrada cabem integralmente sem rolagem
- **AND** sucesso orienta login sem iniciar sessão privada.

#### Scenario: Todas as etapas de recuperação
- **WHEN** solicitação, código, nova senha ou conclusão é exibida em uma viewport de referência e tema, incluindo validação, envio/reenvio, erro e sucesso aplicáveis
- **THEN** instruções, mensagens genéricas, feedback coexistente, campos, dicas e todas as ações disponíveis cabem integralmente sem rolagem
- **AND** código inválido/expirado, contexto expirado e resultado incerto da redefinição permanecem legíveis com os caminhos atuais de nova tentativa.

### Requirement: Refluxo acessível da autenticação fora da garantia desktop
Todas as telas e etapas de autenticação SHALL permanecer utilizáveis desde 320 px de largura e com zoom ampliado, altura menor ou conteúdo excepcionalmente longo. A interface SHALL permitir rolagem vertical necessária, manter quebra de texto sem overflow horizontal causado pelo layout e permitir alcançar cada campo, mensagem e ação por teclado, inclusive no início e fim do documento. Foco, rótulos, anúncios acessíveis e preferência por movimento reduzido SHALL ser preservados. A exigência de ausência de rolagem vertical SHALL NOT limitar acessibilidade fora das condições desktop de referência.

#### Scenario: Mobile e altura pequena
- **WHEN** qualquer tela/etapa é usada em 320×568, 375×667, 768×600 ou desktop 1366×600 nos dois temas
- **THEN** conteúdo essencial permanece legível e alcançável, com rolagem vertical quando necessário, sem corte ou rolagem horizontal causada pelo layout.

#### Scenario: Zoom e mensagens excepcionais
- **WHEN** qualquer tela/etapa é usada com zoom real do navegador de 200% sobre as três resoluções de referência, ou recebe mensagem excepcionalmente longa incluindo trecho sem espaços
- **THEN** a página reflui e permite rolar verticalmente até todo conteúdo e ações sem sobreposição ou overflow horizontal de layout
- **AND** navegação por Tab e Shift+Tab mantém foco visível e alcança controles sem mouse.

### Requirement: Apresentação identificável da ação Google
A ação “Continuar com Google” em login e cadastro SHALL usar a logo multicolorida do Google, manter superfície branca e texto escuro nos dois temas e apresentar borda e foco perceptíveis. A superfície SHALL permanecer branca em repouso, hover, foco e ativação; hover e foco SHALL ser distinguidos por borda, sombra ou contorno perceptíveis sem alterar a superfície. A logo SHALL preservar cores e proporções e não duplicar o nome acessível da ação. A apresentação SHALL preservar a integração OAuth e os destinos de retorno permitidos existentes.

#### Scenario: Temas e interação
- **WHEN** a ação Google é exibida, recebe hover, foco por teclado ou ativação em login ou cadastro nos temas claro e escuro
- **THEN** logo multicolorida, texto escuro e superfície branca permanecem e borda/foco e feedback de interação são perceptíveis
- **AND** a ação mantém o nome acessível “Continuar com Google” e pode ser ativada por teclado.

#### Scenario: OAuth e retorno preservados
- **WHEN** a pessoa ativa Google em qualquer modo com destino permitido ou destino externo/malformado
- **THEN** a mesma integração OAuth é iniciada com o retorno interno permitido ou fallback existente
- **AND** erros de retorno continuam recuperáveis sem alterar validações, regras ou contratos de autenticação.
