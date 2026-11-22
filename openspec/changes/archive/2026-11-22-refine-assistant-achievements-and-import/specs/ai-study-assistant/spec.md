## ADDED Requirements

### Requirement: Sugestões de tarefas e orientação do aplicativo
O assistente SHALL apresentar “Quais tarefas devo fazer?” quando Tarefas estiver habilitado, substituindo a sugestão de vencimentos da semana e usando categoria e descrição coerentes com organização de tarefas. SHALL adicionar “Me ensine a usar o aplicativo” para toda conta elegível ao assistente, sem depender de módulos de estudo específicos. Selecionar qualquer sugestão SHALL preencher o campo editável e focá-lo, sem enviar automaticamente. As demais sugestões SHALL preservar suas regras de módulos.

#### Scenario: Selecionar tarefas
- **WHEN** uma conta com Tarefas habilitado seleciona “Quais tarefas devo fazer?”
- **THEN** o compositor recebe exatamente esse texto, ganha foco e aguarda envio explícito; o card antigo não aparece.

#### Scenario: Ajuda com módulos desabilitados
- **WHEN** uma conta elegível com Tarefas desabilitado abre as sugestões em 320 px
- **THEN** a sugestão de tarefas fica oculta e “Me ensine a usar o aplicativo” permanece acessível por teclado, sem overflow.

### Requirement: Respostas úteis para tarefas e aprendizagem do aplicativo
Ao receber a nova pergunta de tarefas, o assistente SHALL consultar somente tarefas autorizadas do módulo ativo e orientar a escolha com base nos dados disponíveis, explicitando ausência de tarefas ou informações insuficientes sem inventar registros. A ajuda sobre o aplicativo SHALL explicar fluxos reais de navegação e uso manual dos módulos habilitados e recursos de Conta, respeitando elegibilidade e permissões; SHALL NOT executar criações ou iniciar importação por pedir ajuda.

#### Scenario: Tarefas disponíveis ou ausentes
- **WHEN** a pessoa envia “Quais tarefas devo fazer?”
- **THEN** recebe orientação sobre suas tarefas disponíveis ou indicação de ausência, sem restringir silenciosamente a pergunta a vencimentos da semana nem acessar outras contas.

#### Scenario: Aprender a usar
- **WHEN** a pessoa envia “Me ensine a usar o aplicativo”
- **THEN** recebe orientação coerente com as telas reais e módulos habilitados, sem funcionalidades inventadas ou alterações de dados.
