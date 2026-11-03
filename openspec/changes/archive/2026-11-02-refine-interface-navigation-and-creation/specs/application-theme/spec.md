## ADDED Requirements

### Requirement: Hierarquia escura próxima do preto
O tema escuro SHALL usar cinza principal próximo do preto, mais escuro que o fundo anterior, com sidebar, cards, campos e modais distinguíveis por superfícies, bordas e contraste. SHALL preservar identidade azul, semântica de estados, inicialização e preferência de tema existentes e os limiares de contraste da especificação principal. O tema claro SHALL conservar suas cores.

#### Scenario: Superfícies e estados escuros
- **WHEN** a pessoa percorre páginas e abre um modal no tema escuro
- **THEN** fundo, navegação, conteúdo, campos e overlay mantêm hierarquia perceptível e textos, foco e controles atendem aos contrastes aplicáveis.

#### Scenario: Tema claro preservado
- **WHEN** a pessoa alterna para claro durante um formulário preenchido
- **THEN** as cores claras existentes permanecem e o formulário, foco e rota são preservados.

## MODIFIED Requirements

### Requirement: Preservação das páginas existentes
A extensão do tema SHALL preservar conteúdo funcional, rotas, regras de negócio, loading, erro, vazio e sucesso existentes. A aparência das páginas internas SHALL permanecer preservada exceto pelos ajustes explícitos de superfícies escuras, transições e modais de criação definidos nesta mudança; a composição da landing SHALL seguir a atualização explicitamente definida em public-landing. SHALL preservar operação por teclado, layout utilizável a partir de 320 px e preferência por movimento reduzido.

#### Scenario: Uso após migração visual
- **WHEN** a pessoa utiliza uma página migrada em qualquer tema, inclusive em 320 px e por teclado
- **THEN** consegue concluir os mesmos fluxos com os mesmos resultados, com a estrutura preservada salvo os modais explicitamente definidos, sem rolagem horizontal causada pela mudança visual.
