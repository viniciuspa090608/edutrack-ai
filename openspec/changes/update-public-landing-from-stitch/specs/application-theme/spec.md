# Spec Delta

## Purpose

Garantir identidade visual azul e neutra consistente em toda a aplicação, com temas claro e escuro legíveis e preservação dos fluxos existentes.

## ADDED Requirements

### Requirement: Identidade visual consistente
A aplicação SHALL apresentar identidade baseada nas escalas azul e neutra fornecidas, utilizando superfícies neutras e destaques azuis coerentes entre páginas e componentes. No tema claro SHALL predominar superfícies neutras claras e ações azuis médias ou escuras; no escuro SHALL predominar superfícies neutras escuras e destaques azuis médios ou claros. Azuis claros SHALL servir principalmente a backgrounds, highlights e elementos secundários, sem comprometer legibilidade.

#### Scenario: Navegar entre páginas
- **WHEN** a pessoa navega entre landing, acesso, autenticação e módulos autenticados
- **THEN** superfícies, textos, navegação, controles e destaques mantêm a mesma identidade no tema ativo.

### Requirement: Tema acompanha o sistema
A aplicação SHALL selecionar o tema claro ou escuro conforme a preferência de cores do sistema ao carregar e SHALL atualizar a aparência quando essa preferência mudar durante a sessão, incluindo overlays, quando não houver escolha manual válida no navegador. Uma escolha manual válida SHALL ter precedência sobre o sistema. Na ausência de suporte à preferência SHALL utilizar o tema claro. A troca SHALL preservar estado de formulários, foco, rota e operações em andamento.

#### Scenario: Carregamento em modo escuro
- **WHEN** a pessoa abre uma página com preferência de sistema escura sem escolha manual válida
- **THEN** a página e seus overlays utilizam o tema escuro desde a primeira apresentação da interface.

#### Scenario: Preferência alterada
- **WHEN** o sistema muda de claro para escuro ou de escuro para claro durante o uso sem escolha manual válida
- **THEN** a aparência acompanha a preferência sem recarregar a página nem perder seu estado atual.

#### Scenario: Preferência indisponível
- **WHEN** o ambiente não oferece consulta à preferência de cores e não há escolha manual válida
- **THEN** a interface permanece utilizável no tema claro.

### Requirement: Contraste e estados legíveis
A interface SHALL garantir contraste mínimo de 4,5:1 para texto normal e 3:1 para texto grande, e 3:1 para indicadores de foco e elementos visuais necessários à identificação dos controles contra cores adjacentes. SHALL verificar os dois temas e estados hover, focus, active e selecionado, incluindo transparências e gradientes. Estados desabilitados SHALL continuar identificáveis, sem exigir o limiar reservado a controles ativos.

#### Scenario: Controles e conteúdo nos dois temas
- **WHEN** a pessoa visualiza texto, campos, botões, cards, menus, diálogos e gráficos em qualquer tema
- **THEN** os pares de cores renderizados cumprem os limiares aplicáveis e o foco permanece perceptível por teclado.

### Requirement: Significado das cores de estado
A aplicação SHALL preservar a distinção de sucesso, aviso, erro destrutivo e informação sempre que esses estados existirem, em ambos os temas. SHALL comunicar o significado também por texto ou outro indicador acessível, sem depender apenas da cor.

#### Scenario: Feedback de operação
- **WHEN** uma operação apresenta sucesso, aviso, erro ou informação
- **THEN** seu significado permanece identificável e seu conteúdo legível no tema ativo.

### Requirement: Preservação das páginas existentes
A extensão do tema SHALL manter a aparência das páginas internas em cada tema, estrutura, conteúdo funcional, rotas, interações, regras de negócio, loading, erro, vazio e sucesso existentes; a composição da landing SHALL seguir a atualização explicitamente definida em public-landing. SHALL preservar operação por teclado, layout utilizável a partir de 320 px e preferência por movimento reduzido.

#### Scenario: Uso após migração visual
- **WHEN** a pessoa utiliza uma página migrada em qualquer tema, inclusive em 320 px e por teclado
- **THEN** consegue concluir os mesmos fluxos com os mesmos resultados, sem alterações de estrutura nem rolagem horizontal causada pela mudança visual.

### Requirement: Escolha manual local e acessível
A aplicação SHALL oferecer no header público um controle acessível para alternar claro/escuro, disponível no mobile sem abrir o menu, que comunique o tema atual e a ação de alternância. A escolha manual SHALL persistir somente no navegador e prevalecer sobre mudanças do sistema entre rotas, recargas e novas abas, sem preferência no backend. Sem escolha válida SHALL acompanhar o sistema, com fallback claro se a preferência não estiver disponível. Valores salvos inválidos SHALL ser ignorados. Remoção da escolha salva SHALL restabelecer o padrão do sistema e alterações de preferência entre abas SHALL ser refletidas.

#### Scenario: Escolha manual prevalece
- **WHEN** a pessoa alterna o tema pelo teclado ou ponteiro e depois navega para outra rota, recarrega ou muda o tema do sistema
- **THEN** a escolha manual continua aplicada e os controles nativos e overlays acompanham o mesmo tema.

#### Scenario: Sistema sem escolha salva
- **WHEN** a escolha local está ausente ou inválida e o sistema muda sua preferência
- **THEN** a aplicação acompanha o sistema sem recarregar ou perder foco e estado.

#### Scenario: Sincronização entre abas
- **WHEN** a escolha salva é alterada ou removida em outra aba do mesmo navegador
- **THEN** a aba aberta aplica a escolha válida ou volta a seguir o sistema quando removida.

### Requirement: Inicialização e armazenamento resilientes
A aplicação SHALL apresentar o tema efetivo desde a primeira pintura visível, sem flash perceptível do tema incorreto em acesso direto ou recarga. Falhas de leitura ou gravação do armazenamento SHALL NOT impedir a aplicação de carregar ou alternar tema. Falha de leitura SHALL usar o sistema ou fallback claro; falha de gravação SHALL manter a escolha manual em memória durante navegação da sessão atual, sem prometer persistência após recarga. O esquema dos controles nativos SHALL acompanhar o tema efetivo.

#### Scenario: Primeira pintura
- **WHEN** a pessoa abre uma rota diretamente com escolha escura salva e sistema claro, inclusive com carregamento lento
- **THEN** a primeira interface visível é escura, sem passagem perceptível pelo tema claro.

#### Scenario: Armazenamento bloqueado
- **WHEN** leitura ou gravação local lança erro e a pessoa alterna tema e navega entre rotas
- **THEN** a interface permanece utilizável e a escolha manual permanece na sessão atual
- **AND** uma nova carga sem acesso ao valor salvo usa sistema ou fallback claro.
