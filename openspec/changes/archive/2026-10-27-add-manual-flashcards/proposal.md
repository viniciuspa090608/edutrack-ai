# Proposal

## Why

A EduTrack ainda não permite criar cartões de estudo próprios e revisar conceitos revelando a resposta. O fluxo manual precisa funcionar desde o primeiro baralho, independentemente de serviços de IA ou de uma matéria associada.

## What Changes

- Criar, listar, consultar, editar e excluir baralhos próprios, incluindo baralhos sem matéria e associação opcional a uma matéria própria.
- Criar, listar, consultar, editar e excluir cartões dentro de um baralho; cada cartão tem frente e verso obrigatórios.
- Permitir abrir um cartão com a frente visível e revelar seu verso por ação explícita, sem alterar progresso ou agendamento.
- Proteger todos os dados por usuário e respeitar as preferências dos módulos sem fazer o uso manual depender da IA.
- Reservar importação de arquivos, repetição espaçada e geração por IA para `import-flashcards`, `add-spaced-repetition` e `generate-flashcards-with-ai`.

## Capabilities

### New Capabilities

- `manual-flashcards`: CRUD de baralhos e cartões, vínculo opcional com matéria, revisão por revelação e isolamento por usuário.

### Modified Capabilities

- `shared-contracts`: acrescentar contratos públicos de baralhos e cartões para uso comum da web e API.

## Impact

- `apps/api`: módulo de flashcards, rotas autenticadas, migrations MySQL e validação opcional de matéria pelo contrato público de `add-subjects`.
- `apps/web`: página protegida de baralhos e cartões, formulário manual e interação acessível de revelar resposta.
- `packages/contracts`: schemas de entrada e DTOs de baralhos, cartões e associação opcional.
- O apply depende de `add-user-authentication`, `add-profile-and-module-preferences` e `add-subjects`, ainda não implementados. A exclusão de uma matéria remove apenas o vínculo do baralho; o baralho e seus cartões permanecem.
