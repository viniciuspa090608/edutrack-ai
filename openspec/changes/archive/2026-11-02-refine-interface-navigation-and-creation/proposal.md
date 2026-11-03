# Proposal

## Why

A navegação privada recarrega o documento e remonta o shell, interrompendo a continuidade visual. Os cadastros têm apresentações diferentes e os ajustes finais de tema, movimento e identidade precisam de critérios comuns de acessibilidade e regressão.

## What Changes

- Manter shell e sidebar montados na navegação interna, preservando estado aplicável e rolagem, com destino ativo atualizado.
- Aplicar Animate.css: `backInLeft` ao chegar da landing ao login/cadastro, `fadeIn` somente no conteúdo interno e `backOutLeft` na saída autenticada, com fallback e movimento reduzido.
- Escurecer superfícies do tema escuro, preservando identidade azul, contraste e tema claro.
- Padronizar hover de botões em 500 ms com propriedades explícitas.
- Uniformizar criação de tarefas, matérias, baralhos, cards e rotinas em modal compartilhado acessível, preservando validações, persistência e atualização local.
- Usar logoTipo.png, fornecido pelo usuário durante o apply, como favicon comum às rotas públicas e privadas, preservando o arquivo original.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `web-runtime`: favicon compartilhado em acessos diretos e navegação.
- `application-theme`: hierarquia de superfícies escuras próximas do preto.
- `authenticated-shell-visual-experience`: persistência do shell e animações internas/saída.
- `frontend-ui-controls`: transições de botões e padrão compartilhado dos modais de criação.
- `public-landing`: animação de chegada ao acesso a partir das ações públicas.

## Impact

`apps/web` (App, PrivatePage, AuthenticatedShell, links internos, AccessPage, páginas de criação e CSS), `packages/ui` (Button, Dialog e composição compartilhada), `index.html` e asset público quando fornecido. Animate.css 4.1.1 e Radix Dialog já estão instalados; não se prevê novo roteador, dependência ou alteração de API, contratos e banco. Testes existentes serão adaptados e ampliados para navegação, cancelamento e mutações reais pelo cliente atual. A mudança aberta `refine-auth-desktop-layout` deve ser preservada e revisada nos pontos de CSS/auth compartilhados. Esta proposta não implementa código nem conclui/archive mudanças.
