# web-runtime Specification
## Purpose

Define a experiência mínima de execução da aplicação web, permitindo confirmar que a base React carrega com acessibilidade e suporte móvel.

## Requirements
### Requirement: Página técnica inicial
A aplicação web SHALL manter em `/status` uma página técnica simples que identifique a plataforma e indique que a fundação está operacional, sem apresentar funcionalidades de produto ainda não implementadas como disponíveis.

#### Scenario: Abertura da aplicação
- **GIVEN** a aplicação web iniciada
- **WHEN** uma pessoa abre `/status`
- **THEN** a página técnica é exibida sem erro de execução
- **AND** há título de página e conteúdo principal identificáveis.

### Requirement: Suporte móvel e acessibilidade básica
A página inicial SHALL permanecer utilizável em largura de 320 px, sem rolagem horizontal causada pelo layout, e SHALL permitir navegação por teclado com foco visível para elementos interativos.

#### Scenario: Visualização estreita
- **GIVEN** uma viewport de 320 px de largura
- **WHEN** a pessoa abre a página inicial
- **THEN** todo o conteúdo essencial permanece visível e legível
- **AND** o layout não exige rolagem horizontal.

#### Scenario: Navegação por teclado
- **GIVEN** a página inicial carregada
- **WHEN** a pessoa navega pelos controles com o teclado
- **THEN** cada controle interativo alcançável apresenta foco perceptível
- **AND** pode ser ativado sem mouse.

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

### Requirement: Acesso local e LAN em porta fixa

O servidor web de desenvolvimento SHALL iniciar com --host 0.0.0.0, porta explícita 5173 e strictPort. A web SHALL permitir acesso à API e autenticação pelo computador e por endereço LAN documentado, com origens explicitamente autorizadas e cookies funcionais, preservando validação de origem e proteção de sessão em produção.

#### Scenario: Login pela rede local

- **WHEN** uma pessoa abre a web pelo IP LAN configurado e autentica um perfil
- **THEN** a sessão persiste e consultas e mutações autenticadas funcionam.

#### Scenario: Origem não autorizada

- **WHEN** uma origem não autorizada tenta executar uma mutação autenticada
- **THEN** a requisição é rejeitada sem alterar dados.

#### Scenario: Porta ocupada

- **WHEN** a porta 5173 já está ocupada ao iniciar a web
- **THEN** a inicialização falha sem trocar silenciosamente de porta.
