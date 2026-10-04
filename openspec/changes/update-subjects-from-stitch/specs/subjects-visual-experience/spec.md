# Spec Delta

## Purpose

Definir uma experiência visual consistente para todas as interfaces existentes de Matérias e seus roadmaps, inspirada no Stitch e fiel aos dados, ações e restrições reais do EduTrack.

## ADDED Requirements

### Requirement: Identidade visual em todo o módulo

A interface SHALL aplicar uma linguagem coerente de superfícies, cards, tipografia, espaçamentos, bordas, ícones, botões e campos à listagem, detalhe, cadastro, edição, exclusão, assuntos conhecidos, plano manual, registros vinculados e auxiliares de matéria. Interfaces sem referência específica no Stitch SHALL derivar a mesma linguagem visual e SHALL preservar seus fluxos existentes.

#### Scenario: Cadastro e edição sem export específico
- **WHEN** a pessoa cria ou edita uma matéria a partir da listagem ou detalhe redesenhado
- **THEN** o formulário apresenta o mesmo padrão visual, contém os campos existentes e mantém salvar, cancelar, validação e preservação dos valores em falhas.

#### Scenario: Plano e confirmação coerentes
- **WHEN** a pessoa organiza seu plano manual ou abre a confirmação de exclusão
- **THEN** controles, status e confirmação seguem a identidade do módulo e mantêm todas as ações e consequências atuais.

#### Scenario: Auxiliares fora da página de matérias
- **WHEN** um seletor ou nome de matéria aparece em tarefas, Pomodoro ou flashcards
- **THEN** seu acabamento é coerente e seus estados e comportamento permanecem corretos sem exigir visita prévia à página de Matérias.

### Requirement: Apresentação subordinada aos dados reais

A interface SHALL apresentar somente dados reais obtidos pelos fluxos atuais e SHALL manter contratos, validações e operações de API existentes. Elementos do Stitch sem campo, rota ou comportamento implementado SHALL ser omitidos ou adaptados a informações existentes com rótulos semanticamente corretos. A atualização SHALL NOT introduzir mocks em runtime, dados acadêmicos fictícios, novas funcionalidades ou consultas adicionais para preencher o protótipo.

#### Scenario: Card com dados reais
- **WHEN** a API retorna uma matéria com nome, nível, objetivo, prazo, horas semanais e assuntos conhecidos
- **THEN** sua apresentação utiliza esses dados sem inventar professor, créditos, média, frequência ou recomendações de IA.

#### Scenario: Disponibilidade e registros recentes
- **WHEN** a pessoa consulta horas semanais e registros vinculados recentes
- **THEN** horas declaradas não são rotuladas como tempo estudado e uma página de registros não é apresentada como total global ou contagem de pendências.

### Requirement: Roadmaps integralmente alinhados

A apresentação SHALL estender a identidade visual à lista paginada, blocos/passos, criação e edição manual, exclusão, parâmetros de IA, geração, prévias, confirmação, progresso, reordenação de pendentes, regeneração, histórico, snapshots e restauração de roadmaps. SHALL preservar a distinção entre prévia não salva, versão ativa, conteúdo protegido e revisão histórica, assim como limites, confirmações, cancelamento, expiração e conflitos existentes.

#### Scenario: Prévia de geração
- **WHEN** uma geração válida retorna uma prévia
- **THEN** parâmetros, conteúdo editável, validade e ações existentes aparecem no novo padrão visual e não são apresentados como conteúdo persistido antes da confirmação.

#### Scenario: Progresso e trecho protegido
- **WHEN** há passos concluídos e a pessoa edita ou reordena os pendentes
- **THEN** o conteúdo protegido e controles bloqueados permanecem identificáveis e as mesmas restrições são aplicadas.

#### Scenario: Histórico e restauração
- **WHEN** a pessoa consulta uma revisão histórica e inicia sua restauração
- **THEN** o snapshot permanece somente leitura e a prévia de restauração exige a confirmação existente sem alterar a versão ativa antecipadamente.

### Requirement: Estados visuais completos e honestos

Cada fluxo redesenhado SHALL distinguir os estados aplicáveis de loading, erro, vazio, sucesso, validação, envio e indisponibilidade; SHALL preservar anúncios acessíveis, mensagens e mecanismos existentes de retry/cancelamento. Esqueletos SHALL NOT exibir valores fictícios e falhas SHALL NOT ser representadas como sucesso ou zero.

#### Scenario: Falha durante edição
- **WHEN** salvar uma matéria ou roadmap falha
- **THEN** a edição permanece disponível e o erro aparece de forma legível sem alegar persistência.

#### Scenario: Lista vazia e lista indisponível
- **WHEN** uma listagem está carregando, retorna vazia ou falha
- **THEN** cada condição possui apresentação distinta, usando ação de criação no vazio e retry quando já previsto no erro.

#### Scenario: Prévia inválida para confirmação
- **WHEN** uma prévia expira ou ocorre conflito de revisão
- **THEN** o aviso e as ações permitidas continuam identificáveis e a confirmação permanece bloqueada conforme o fluxo atual.

### Requirement: Acessibilidade, responsividade e temas

Todas as interfaces redesenhadas SHALL permanecer utilizáveis desde 320 px sem rolagem horizontal causada pelo layout, com textos longos, formulários e diálogos acessíveis. SHALL manter operação por teclado, nomes acessíveis, foco visível, foco inicial e retorno de foco existentes, contraste nos temas suportados e respeito à preferência por movimento reduzido. Status SHALL NOT depender exclusivamente de cor.

#### Scenario: Editor em viewport estreita
- **WHEN** a pessoa usa por teclado um editor com vários blocos e passos em 320 px
- **THEN** campos e ações permanecem legíveis e alcançáveis, incluindo reordenação e cancelamento, sem overflow horizontal do layout.

#### Scenario: Confirmação de exclusão
- **WHEN** a pessoa abre e cancela uma confirmação por teclado
- **THEN** o diálogo mantém identificação acessível e gestão de foco existente, com ações visíveis nos temas claro e escuro.

#### Scenario: Movimento reduzido
- **WHEN** a pessoa usa preferência por movimento reduzido
- **THEN** transições decorativas são reduzidas sem ocultar feedback ou ações.

### Requirement: Compatibilidade de navegação e preferências

A atualização SHALL preservar a rota e os links existentes de Matérias, a paginação e os controles de preferências. O shell SHALL permanecer único, sem navegação duplicada do protótipo. IA desabilitada SHALL continuar permitindo os fluxos manuais e ocultando ações de IA; módulos desabilitados SHALL manter seus bloqueios atuais.

#### Scenario: Acesso a partir do dashboard
- **WHEN** a pessoa abre o link existente com identificador de matéria e âncora de roadmap
- **THEN** acessa o mesmo conteúdo real no layout atualizado sem exigir uma rota nova.

#### Scenario: IA desabilitada
- **WHEN** a pessoa usa Matérias com IA desabilitada
- **THEN** CRUD, plano, progresso e recursos manuais existentes continuam disponíveis no mesmo padrão visual sem ações de geração por IA.
