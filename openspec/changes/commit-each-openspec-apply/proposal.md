# Proposal

## Why

O fluxo OpenSpec atual termina uma implementação sem registrar automaticamente no histórico Git qual mudança foi aplicada. Um commit por apply concluído torna a entrega identificável e facilita revisão, comparação e reversão.

## What Changes

- Registrar nas orientações de `openspec/config.yaml` que cada apply concluído deve gerar um único commit Git contendo apenas os arquivos daquela mudança, incluindo o estado final de `tasks.md`.
- Registrar a mesma convenção em `AGENTS.md`, que também está previsto na mudança `bootstrap-study-platform`.
- Definir verificação antes do commit, tratamento de alterações preexistentes e formato da mensagem com o nome da mudança OpenSpec.
- Não criar tag, incrementar SemVer, fazer push ou arquivar a mudança automaticamente.

## Capabilities

### New Capabilities

Nenhuma. Esta mudança altera somente o processo de desenvolvimento e sua documentação; `skip_specs: true` evita criar uma spec de comportamento do produto sem necessidade.

### Modified Capabilities

Nenhuma.

## Impact

- Arquivos de processo: `openspec/config.yaml` e `AGENTS.md`. Não há alteração em web, API, contratos ou dados.
- A orientação passa a valer nos próximos applies conduzidos por agentes que leem essas instruções. O commit desta própria mudança será o primeiro a seguir a convenção.
- A mudança deve ser aplicada antes de `bootstrap-study-platform` para que o primeiro apply da fundação já seja versionado.

**Critério de sucesso:** ao concluir um apply com todas as tarefas e verificações aprovadas, o agente cria exatamente um commit com o nome da mudança, sem incluir alterações alheias, e informa o hash resultante. Um apply pausado ou com verificações falhando permanece sem commit de conclusão.
