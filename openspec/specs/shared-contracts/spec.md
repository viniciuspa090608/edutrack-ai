# shared-contracts Specification
## Purpose

Define contratos de fronteira compartilhados entre web e API, reduzindo divergência de tipos sem antecipar modelos dos módulos futuros.

## Requirements
### Requirement: Contratos compartilhados mínimos
Web e API SHALL consumir do pacote compartilhado os tipos e schemas de fronteira necessários para health check, erro HTTP e funcionalidades implementadas de tarefas e Pomodoro, sem definir ali entidades de persistência ou modelos de funcionalidades futuras.

#### Scenario: Consumo nos dois aplicativos
- **GIVEN** os workspaces instalados
- **WHEN** web e API passam pelo typecheck
- **THEN** os dois resolvem o mesmo pacote de contratos para os formatos existentes
- **AND** não mantêm cópias locais divergentes desses formatos.

#### Scenario: Contratos de tarefas
- **GIVEN** a funcionalidade de tarefas implementada
- **WHEN** web e API validam entradas, filtros e respostas de tarefas
- **THEN** usam os mesmos contratos públicos do pacote compartilhado
- **AND** nenhuma entidade de persistência da API é importada pela web.

#### Scenario: Contratos de sessão Pomodoro
- **GIVEN** a funcionalidade Pomodoro implementada
- **WHEN** web e API validam comandos, estados, histórico e totais de sessões
- **THEN** usam schemas e tipos públicos do mesmo pacote compartilhado
- **AND** a entidade de persistência permanece exclusiva da API.

### Requirement: Validação de contratos externos
Quando um contrato compartilhado contiver dados recebidos fora do processo, a implementação SHALL disponibilizar validação em tempo de execução antes de confiar nesses dados.

#### Scenario: Corpo incompatível
- **GIVEN** um dado externo incompatível com o contrato compartilhado
- **WHEN** ele é validado na fronteira que o consome
- **THEN** a validação rejeita o dado
- **AND** o valor incompatível não é tratado como tipado apenas por uma declaração TypeScript.

### Requirement: Contratos públicos de rotinas
Web e API SHALL usar os mesmos schemas e tipos públicos para dados, horários e operações de rotinas, com validação de entradas externas em tempo de execução. Esses contratos SHALL NOT expor entidades ou repositories da API ao cliente.

#### Scenario: Entrada de rotina inválida
- **GIVEN** uma solicitação de rotina com dia, hora ou fuso inválido
- **WHEN** a API valida a entrada pelo contrato público
- **THEN** rejeita a solicitação antes de persistir dados.

#### Scenario: Consumo por web e API
- **WHEN** web e API fazem typecheck dos fluxos de rotina
- **THEN** resolvem os mesmos tipos de fronteira compartilhados
- **AND** a web não importa entidades de persistência da API.

### Requirement: Contratos públicos de matérias e vínculos opcionais
Web e API SHALL compartilhar schemas de validação e tipos públicos para criação, atualização, listagem e detalhe de matérias, assuntos conhecidos, itens ordenados de estudo e associações opcionais de tarefas e sessões Pomodoro a matérias. Os contratos SHALL representar ausência de associação explicitamente, validar entradas externas em tempo de execução e não expor entidades de persistência.

#### Scenario: Associação ausente
- **WHEN** web e API processam uma tarefa ou sessão sem matéria
- **THEN** ambas interpretam a ausência do vínculo da mesma forma e aceitam o fluxo independente.

#### Scenario: Entrada incompatível
- **WHEN** uma entrada externa contém nível inválido, data impossível, item de plano inválido ou identificador de matéria malformado
- **THEN** a validação compartilhada rejeita a entrada antes da regra de negócio.

### Requirement: Contratos públicos de baralhos e cartões manuais

Web e API SHALL compartilhar schemas de validação em tempo de execução e tipos públicos para criação, edição, listagem e detalhe de baralhos e cartões, incluindo frente, verso e associação opcional a matéria. Os contratos SHALL representar ausência de matéria explicitamente e SHALL NOT expor entidades ou detalhes de persistência.

#### Scenario: Baralho sem matéria
- **WHEN** web e API processam um baralho sem matéria
- **THEN** ambas usam a mesma representação pública de ausência de associação
- **AND** o baralho pode ser criado e consultado sem dados do módulo de matérias.

#### Scenario: Entrada inválida
- **WHEN** uma entrada externa contém frente vazia, verso vazio ou identificador de matéria malformado
- **THEN** o schema compartilhado rejeita o valor antes que ele seja tratado como dado validado.

### Requirement: Contratos públicos de importação de flashcards
Web e API SHALL compartilhar schemas de entrada e tipos de saída para seleção de colunas por índice, tentativa de importação, amostra, totais previstos, erros por linha, confirmação e totais efetivos. Os contratos SHALL validar dados externos antes do uso e não SHALL expor conteúdo temporário de outra conta nem entidades de persistência.

#### Scenario: Mapeamento incompatível
- **WHEN** um cliente envia índices de coluna iguais ou fora das colunas disponíveis
- **THEN** a validação compartilhada rejeita o mapeamento sem criar cartões.

#### Scenario: Resultado consistente
- **WHEN** a confirmação termina
- **THEN** web e API interpretam as mesmas contagens de importados, ignorados e rejeitados.

### Requirement: Contratos públicos de revisão espaçada
O pacote compartilhado SHALL oferecer tipos e schemas públicos para as avaliações `AGAIN`, `HARD`, `GOOD` e `EASY`, para o estado de agendamento, a lista de pendentes e os registros de revisão, incluindo próxima data e versão da política. Web e API SHALL usar os mesmos contratos e validar entradas externas antes de processar uma avaliação.

#### Scenario: Avaliação inválida
- **WHEN** uma requisição envia avaliação diferente dos quatro valores permitidos ou identificador inválido
- **THEN** a validação de fronteira rejeita o pedido antes de alterar agendamento ou histórico.

#### Scenario: Contratos compartilhados
- **WHEN** web e API executam typecheck
- **THEN** ambas usam os mesmos formatos de revisão e próxima data sem definições divergentes locais.

### Requirement: Contratos públicos da geração de flashcards com IA

Web e API SHALL compartilhar schemas de validação em tempo de execução e tipos públicos para solicitação de geração, cartões da prévia e confirmação revisada, incluindo baralho de destino e representação de frente e verso compatível com cartões manuais. Esses contratos SHALL rejeitar conteúdo vazio, cartões inválidos e campos desconhecidos, sem expor entidades de persistência ou segredos do provedor.

#### Scenario: Prévia compatível com o editor
- **WHEN** uma geração válida é devolvida pela API e exibida pela web
- **THEN** ambos usam o mesmo contrato para baralho, frente e verso dos cartões.

#### Scenario: Confirmação inválida
- **WHEN** uma confirmação externa contém cartão sem verso ou um identificador de destino incompatível
- **THEN** o schema compartilhado rejeita a entrada antes do salvamento.

### Requirement: Contratos públicos de estatísticas de estudo
Web e API SHALL compartilhar schemas para granularidade `day | week | quarter | semester | year`, data de referência e fuso IANA, além de tipos para intervalos, série diária, métricas disponíveis, frequência, comparação anterior e estado de histórico indisponível. Entradas externas SHALL ser validadas em execução e entidades de persistência SHALL permanecer fora do contrato.

#### Scenario: Consulta inválida
- **WHEN** o cliente envia granularidade desconhecida, data impossível ou fuso inválido
- **THEN** a validação rejeita a consulta antes da agregação.

#### Scenario: Métrica omitida por preferência
- **WHEN** uma métrica de módulo desativado não compõe a resposta
- **THEN** a web interpreta a ausência como indisponibilidade do módulo, sem converter o valor em zero.

### Requirement: Contratos públicos de sequências e conquistas

Web e API SHALL compartilhar schemas e tipos públicos para fuso IANA salvo, sequência atual, maior sequência, início do histórico rastreado e catálogo/progresso/concessão das conquistas. Entradas externas SHALL ser validadas em tempo de execução, sem expor eventos internos de outros usuários ou entidades de persistência.

#### Scenario: Fuso inválido
- **WHEN** a web ou a API recebe um identificador de fuso que não representa uma zona IANA válida
- **THEN** o schema o rejeita antes de gravá-lo na conta.

#### Scenario: Resultado compartilhado
- **WHEN** a API devolve sequência e conquistas à web
- **THEN** ambas usam os mesmos campos e tipos para dias, critérios, progresso e data de obtenção.

### Requirement: Contrato público de composição do dashboard
Web e API SHALL compartilhar schemas de resposta para resumos de tarefas, matéria/roadmap destacado, Pomodoro, sequência, flashcards e semana, com estados explícitos de conteúdo, vazio e erro por seção. Seções de módulos desativados SHALL ser omitidas, não representadas como zero. O contrato SHALL validar dados externos em execução e não expor entidades internas dos módulos.

#### Scenario: Módulo desligado
- **WHEN** flashcards estão desativados
- **THEN** a resposta validada omite a seção de flashcards, sem contagem fictícia.

#### Scenario: Falha parcial
- **WHEN** a consulta semanal falha e a de tarefas funciona
- **THEN** a resposta representa erro semanal e dados de tarefas separadamente.
