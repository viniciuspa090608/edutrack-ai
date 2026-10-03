# Proposal

## Why

A geração assistida pode acelerar a preparação de cartões a partir de um conteúdo ou assunto informado, mas o usuário precisa conferir a precisão das perguntas e respostas antes que elas entrem no baralho.

## What Changes

- Oferecer **Aprimorar com IA** apenas quando a preferência de IA estiver habilitada e o módulo de flashcards estiver disponível.
- Receber conteúdo ou assunto em texto e um baralho próprio já existente para gerar cartões com frente e verso.
- Validar a resposta da IA e mostrar todos os cartões em prévia, com ações para editar, remover, salvar os restantes como estão ou cancelar.
- Criar cartões no baralho somente após confirmação explícita, sem alterar cartões preexistentes.
- Preservar criação manual e importação de arquivos independentes da IA e de falhas do provedor.

## Capabilities

### New Capabilities

- `flashcard-ai-generation`: geração estruturada, prévia, revisão e confirmação de cartões para baralho próprio.

### Modified Capabilities

- `shared-contracts`: acrescentar schemas públicos da solicitação, prévia e confirmação da geração de flashcards.

## Impact

- `apps/api`: serviço de geração e validação, integração server-side com provedor de IA, autorização do baralho e confirmação transacional.
- `apps/web`: entrada de texto, seleção de baralho e editor de prévia no módulo de flashcards.
- `packages/contracts`: contratos de fronteira de geração e confirmação, sem expor entidade de persistência.
- O apply depende de `add-manual-flashcards`, autenticação e preferências. Pode reutilizar o adaptador de IA de `generate-subject-roadmaps-with-ai` se ele já estiver aplicado; a funcionalidade não depende do módulo de matérias ou de roadmaps. `import-flashcards` permanece independente.
