# Spec Delta

## MODIFIED Requirements

### Requirement: Página técnica inicial
A aplicação web SHALL manter em `/status` uma página técnica simples que identifique a plataforma e indique que a fundação está operacional, sem apresentar funcionalidades de produto ainda não implementadas como disponíveis.

#### Scenario: Abertura da aplicação
- **GIVEN** a aplicação web iniciada
- **WHEN** uma pessoa abre `/status`
- **THEN** a página técnica é exibida sem erro de execução
- **AND** há título de página e conteúdo principal identificáveis.

### Requirement: Estado da API na página técnica
A página técnica em `/status` SHALL consultar o health check da API a partir de uma URL configurada, validar a resposta recebida e apresentar estados distintos de carregamento, sucesso e erro sem bloquear a visualização da página. O estado de erro SHALL oferecer uma ação de nova tentativa.

#### Scenario: API saudável
- **GIVEN** a página técnica em `/status` carregada e a API acessível
- **WHEN** a consulta de health check retorna uma resposta válida
- **THEN** a página apresenta o estado de sucesso
- **AND** o payload é validado pelo contrato compartilhado antes de ser exibido.

#### Scenario: API indisponível
- **GIVEN** a página técnica em `/status` carregada e a API indisponível ou com resposta inválida
- **WHEN** a consulta de health check termina
- **THEN** a página apresenta um estado de erro legível
- **AND** o restante da página permanece utilizável e a consulta pode ser repetida pelo teclado.
