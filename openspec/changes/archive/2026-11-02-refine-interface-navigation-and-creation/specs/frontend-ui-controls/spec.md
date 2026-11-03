## ADDED Requirements

### Requirement: Transições consistentes de botões
Os botões existentes, incluindo ações apresentadas como links, SHALL usar duração de 500 ms para hover em propriedades explícitas pertinentes de cor, fundo, borda, sombra e opacidade, sem transition all. Foco, pressionado, desabilitado e carregamento SHALL permanecer perceptíveis e a interação SHALL NOT aguardar a transição. Movimento reduzido SHALL reduzir ou desativar essas transições.

#### Scenario: Estados e duração
- **WHEN** a pessoa usa botões primários, secundários, destrutivos e de ícone nos dois temas
- **THEN** o hover usa 500 ms nas propriedades necessárias e foco, active, disabled e loading continuam distinguíveis e funcionais.

### Requirement: Criação em modais compartilhados
Criar tarefa, matéria, baralho, card de estudo, rotina e roadmap manual SHALL usar um modal compartilhado com título específico, ação principal e Cancelar, mantendo campos, schemas, regras e APIs existentes. O modal SHALL anunciar erros, focar o primeiro campo inválido e bloquear envios duplicados durante salvamento. Sucesso SHALL fechar o modal e atualizar a coleção correspondente sem reload; falha SHALL preservar dados e permitir nova tentativa sem falso sucesso. Edições e fluxos de importação, IA e revisão não SHALL ser convertidos obrigatoriamente por este requisito.

#### Scenario: Criação e atualização
- **WHEN** cada formulário abrangido é preenchido e salvo com sucesso
- **THEN** uma única criação é enviada, o modal fecha e a coleção apresenta o resultado conforme seus filtros e paginação existentes.

#### Scenario: Validação e erro de rede
- **WHEN** o envio possui campos inválidos ou o servidor falha
- **THEN** o modal permanece aberto com valores preservados, feedback acessível e possibilidade de correção ou nova tentativa.

### Requirement: Foco e descarte seguros nos modais
O modal SHALL manter foco dentro de si, ter nome acessível e devolver foco ao acionador ao fechar, ou a destino lógico se ele desaparecer. Esc, Cancelar, botão fechar e clique externo quando permitido SHALL passar pela mesma proteção de descarte: formulário alterado exige confirmação; recusá-la preserva dados e foco. Fechamento durante envio SHALL ser bloqueado até resultado, evitando duplicação e perda do resultado. O modal SHALL funcionar desde 320 px, nos dois temas, sem overflow horizontal, com rolagem interna e ações alcançáveis.

#### Scenario: Teclado e confirmação
- **WHEN** a pessoa percorre campos com Tab e Shift+Tab, altera dados e pressiona Esc
- **THEN** foco permanece no modal ou confirmação; cancelar o descarte conserva os dados e confirmar fecha e devolve foco ao acionador.

#### Scenario: Formulário limpo e salvamento
- **WHEN** a pessoa fecha um formulário sem alterações ou tenta fechá-lo durante salvamento
- **THEN** o primeiro fecha sem confirmação e o segundo permanece até o resultado da operação.

#### Scenario: Tela estreita e erro extenso
- **WHEN** um modal é usado em 320 px ou pouca altura com erros visíveis
- **THEN** campos, feedback e ações são alcançáveis por teclado e rolagem interna sem transbordamento horizontal.

## MODIFIED Requirements

### Requirement: Consistência visual das áreas alteradas
As áreas alteradas SHALL preservar os padrões existentes de tema claro e escuro, tipografia, hover, foco, disabled, teclado, responsividade e movimento reduzido, sem alterar regras de negócio, campos ou resultados dos fluxos; a apresentação de criação SHALL seguir os modais explicitamente definidos nesta especificação.

#### Scenario: Temas e teclado
- **WHEN** a pessoa usa as áreas alteradas em tema claro ou escuro e navega por teclado em telas amplas ou estreitas
- **THEN** controles e estados permanecem legíveis, identificáveis e operáveis, com foco visível e sem overflow horizontal.
