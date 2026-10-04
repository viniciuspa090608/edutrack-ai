# Spec Delta

## Purpose

Apresentar evolução e conquistas reais com uma identidade visual comum, compreensível e acessível, respeitando as fontes distintas de estatísticas, sequências e marcos do EduTrack.

## ADDED Requirements

### Requirement: Identidade visual coerente e escopo local
A interface SHALL aplicar a linguagem visual derivada do Stitch e dos módulos atualizados a Progresso, Conquistas, Estatísticas e à seção de fuso de estudo diretamente relacionada. Headers, cards, tipografia, ícones, badges, barras e estados SHALL compartilhar hierarquia e espaçamento consistentes. A navegação existente e a separação funcional das consultas SHALL ser preservadas, sem redesenhar os demais módulos.

#### Scenario: Navegar entre evolução e marcos
- **WHEN** o usuário visita Progresso e Estatísticas
- **THEN** encontra a mesma linguagem visual, com indicadores de evolução e conquistas claramente identificados
- **AND** continua acessando as rotas existentes, sem depender de novas telas ou ações fictícias.

### Requirement: Indicadores e contexto de progresso fiéis
Progresso SHALL destacar sequência atual, maior sequência e dias ativos enviados pela API, preservar o fuso salvo, início do rastreamento e explicações dos limites do histórico e atividades válidas. A interface SHALL NOT recalcular sequências, apresentar pontos/níveis/XP inexistentes ou tratar frequência de analytics como sequência de gamificação.

#### Scenario: Sequência atual encerrada
- **WHEN** a API retorna sequência atual zero, recorde positivo e dias ativos positivos
- **THEN** os três valores são apresentados separadamente
- **AND** o usuário não recebe uma indicação falsa de ausência de histórico.

#### Scenario: Histórico não retroativo
- **WHEN** o progresso é carregado
- **THEN** o fuso e início do rastreamento permanecem visíveis com o acesso à edição na conta
- **AND** atividades anteriores não são apresentadas como dias creditados.

### Requirement: Catálogo completo e estados legíveis de conquistas
O mural SHALL apresentar todas as conquistas retornadas pela API com nome, critério, alvo, progresso e data de obtenção quando presente. O estado obtido SHALL ser determinado pela concessão retornada; pendência sem avanço e progresso parcial SHALL ser diferenciados com texto e ícones, além de cor. A apresentação da barra SHALL preservar a limitação existente ao alvo, sem criar regras de progresso ou desbloqueio. Conquistas bloqueadas SHALL permanecer legíveis; não SHALL haver recompensas, categorias, raridades ou estado recém-desbloqueado sem suporte atual.

#### Scenario: Progresso parcial
- **WHEN** uma conquista pendente retorna progresso 3 e alvo 5
- **THEN** seu card mostra o critério real, o estado em progresso e 3 de 5
- **AND** a barra possui nome acessível, valor 3 e máximo 5.

#### Scenario: Conquista concedida
- **WHEN** uma conquista possui data de obtenção
- **THEN** o card indica que foi obtida e apresenta a data no fuso de estudo
- **AND** sua concessão não é inferida novamente a partir da barra ou do streak atual.

#### Scenario: Nenhuma conquista obtida
- **WHEN** nenhuma conquista possui data de obtenção
- **THEN** a interface apresenta mensagem de início de jornada sem ocultar o catálogo real e seus critérios
- **AND** não promete XP ou conquistas por ações que não atendem às regras existentes.

### Requirement: Evolução por período sem mudanças de consulta
Estatísticas SHALL preservar os filtros de dia, semana, trimestre, semestre e ano, data de referência, fuso IANA e envio explícito da consulta. SHALL preservar todos os valores atuais, anteriores, diferenças, percentuais retornados, cobertura, intervalos com fim exclusivo e indicação de período parcial. Métricas omitidas pela API SHALL continuar omitidas; valores indisponíveis SHALL NOT ser convertidos em zero. Tempo ativo SHALL manter a unidade em minutos e sua formatação atual.

#### Scenario: Consulta por teclado
- **WHEN** o usuário escolhe um período suportado e envia data e fuso válidos por teclado
- **THEN** a mesma consulta existente é executada
- **AND** controles selecionados, foco, loading e resultados são compreensíveis nos dois temas.

#### Scenario: Base de comparação indisponível
- **WHEN** a API retorna percentual nulo ou histórico indisponível
- **THEN** a interface preserva as indicações de não calculável e indisponibilidade
- **AND** não calcula uma nova variação nem representa ausência como zero.

### Requirement: Gráficos de séries reais com equivalente textual
A evolução visual SHALL usar exclusivamente a série diária recebida, preservando datas, agrupamento, unidades e valores. Métricas com unidades distintas SHALL ter representações separadas. Ausência de valores SHALL ser distinguida de zero, sem interpolação, agregação nova ou preenchimento fictício. Todos os valores e avisos de cobertura SHALL continuar disponíveis em texto; gráficos e eventuais tooltips SHALL ser legíveis e acessíveis nos dois temas, por teclado e em dispositivos de toque.

#### Scenario: Série com lacunas
- **WHEN** uma série contém um valor positivo, um zero registrado e uma data sem valor disponível
- **THEN** o gráfico distingue os três casos, sem ligar ou preencher a lacuna como dado comprovado
- **AND** o equivalente textual conserva as datas e valores originais.

#### Scenario: Série extensa no mobile
- **WHEN** um período anual é consultado em tela estreita
- **THEN** a evolução permanece legível por janelas visuais da série ou rolagem local identificada, sem mudar o período ou agregar dados
- **AND** a página não ganha overflow horizontal e os valores completos continuam acessíveis.

### Requirement: Estados completos e configuração de fuso preservada
Todas as superfícies do escopo SHALL apresentar loading, erro recuperável e ausência de atividade sem dados de exemplo. Analytics SHALL distinguir período vazio de histórico indisponível; ausência de conquistas SHALL manter os critérios visíveis. A seção de fuso SHALL preservar validação, sugestão aplicada somente por ação explícita, salvamento, estados busy/disabled, retry e feedback de sucesso, sem modificar datas já creditadas.

#### Scenario: Falha de carregamento
- **WHEN** a consulta falha
- **THEN** a interface mostra mensagem legível e ação de tentar novamente utilizável por teclado
- **AND** não exibe dados estáticos para simular sucesso.

#### Scenario: Sugestão de fuso
- **WHEN** o usuário abre a seção de fuso e altera o campo para a sugestão do navegador
- **THEN** nenhum salvamento ocorre até a confirmação explícita existente
- **AND** o feedback informa que datas já registradas foram preservadas.

### Requirement: Temas, responsividade e acessibilidade
O escopo SHALL suportar claro/escuro com superfícies, texto, bordas, indicadores, eixos, legendas e estados hover/focus/selected/disabled adequados. Desde 320 px, textos longos, grids, filtros e séries SHALL permanecer utilizáveis. A interface SHALL preservar semântica, nomes acessíveis, foco visível e movimento reduzido, sem depender exclusivamente de cor ou reduzir contraste de conquistas bloqueadas a ponto de prejudicar leitura.

#### Scenario: Alternar tema
- **WHEN** o usuário alterna entre claro e escuro
- **THEN** os dados e seleções permanecem intactos e todos os cards, barras, controles e estados continuam legíveis.

#### Scenario: Leitura e navegação em 320 px
- **WHEN** o usuário acessa as áreas por teclado em largura de 320 px
- **THEN** nomes e critérios completos, filtros, indicadores e ações ficam acessíveis sem overflow da página
- **AND** efeitos decorativos respeitam preferência por movimento reduzido.
