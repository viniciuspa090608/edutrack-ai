# Design

## Context

O repositório tem OpenSpec configurado e a mudança `bootstrap-study-platform` planejada, mas ainda não há `AGENTS.md` nem commits Git. A skill local `openspec-apply-change` lê `operationGuidance` de `openspec/config.yaml`, executa tarefas e marca checkboxes; ela não inclui um passo próprio de commit. Ver [proposal.md](./proposal.md) para a motivação.

## Goals / Non-Goals

**Goals:** tornar o commit uma etapa explícita de conclusão de cada apply conduzido por agente neste projeto, com escopo auditável e mensagem que identifique a mudança.

**Non-Goals:** automatizar releases, tags SemVer, pushes, merges, commits parciais por tarefa ou arquivamento OpenSpec. Não alterar o funcionamento do produto nem o código da plataforma.

## Decisions

### 1. Orientação persistente em dois pontos do projeto

Adicionar `operations.apply.guidance` a `openspec/config.yaml`. A orientação deve dizer que, após todas as tarefas marcadas como concluídas e as verificações exigidas aprovadas, o agente cria um commit Git único para a mudança e informa o hash. `openspec instructions apply --change <nome> --json` deve expor essa orientação em `operationGuidance`. Registrar a mesma política em `AGENTS.md` para agentes que atuem no repositório fora de uma chamada direta à CLI.

Como `AGENTS.md` ainda não existe e está previsto na fundação, esta mudança poderá criar uma seção mínima de versionamento. O apply posterior de `bootstrap-study-platform` deverá acrescentar suas convenções sem remover a seção de Git. A documentação em dois lugares é intencional: a configuração OpenSpec alcança o fluxo apply; `AGENTS.md` alcança agentes de código em geral.

**Alternativas consideradas:** editar a skill instalada em `.agents/skills`, o que seria frágil a atualizações; ou criar um hook/wrapper de Git, que introduziria automação e dependências sem necessidade para esta convenção de agente.

### 2. Momento e escopo do commit

Um apply pode ocupar várias sessões. O commit de conclusão acontece uma vez, quando todas as tarefas do `tasks.md` estão marcadas, as verificações requeridas passaram e o diff foi revisado. Se o apply for pausado ou falhar, não há commit de conclusão. Se uma nova chamada de apply apenas confirmar que tudo já estava concluído e não produzir diff, não se cria commit vazio.

Antes de editar, o agente registra o estado do working tree para distinguir alterações preexistentes. Ao concluir, adiciona somente os arquivos e trechos da mudança aplicada, incluindo o `tasks.md` atualizado e artefatos OpenSpec alterados por ela. Usa staging explícito ou por hunk quando houver mistura no mesmo arquivo; não usa `git add .` nem inclui alterações alheias. Revisa `git diff --cached --check` e `git diff --cached --stat`/diff antes de criar o commit. A mensagem terá o formato `Apply OpenSpec change: <nome-da-mudança>`. Após o commit, verifica o hash e informa ao usuário quais arquivos foram versionados. Alterações preexistentes fora do escopo permanecem no working tree.

O repositório ainda não possui commit inicial. Git permite que o primeiro commit seja criado com um subconjunto explícito de arquivos; arquivos alheios e não rastreados não precisam entrar nele. Se identidade Git estiver ausente ou o commit falhar, o agente relata o bloqueio sem configurar uma identidade fictícia nem declarar o apply versionado.

**Alternativas consideradas:** criar commit após cada tarefa, que fragmentaria uma única mudança OpenSpec; ou adicionar todo o working tree, que poderia capturar trabalho não relacionado.

### 3. Alcance da convenção

`operations.apply.guidance` é orientação lida pelo agente, não uma garantia técnica para comandos Git executados manualmente ou por ferramentas que ignoram OpenSpec. A política atende ao fluxo de apply usado neste repositório; caso a equipe passe a exigir bloqueio automático de merges sem commit correspondente, isso merece outra mudança com validação no CI.

**Alternativa considerada:** exigir uma tag por apply. O usuário escolheu apenas commit; tags e SemVer permanecem fora do escopo.

## Risks / Trade-offs

- [Mudanças preexistentes entram no commit] → capturar o estado inicial, fazer staging explícito e revisar o diff staged.
- [Novo `AGENTS.md` é sobrescrito pelo bootstrap] → manter a regra de Git em seção própria e verificar sua preservação no apply da fundação.
- [Orientação de apply não é executada por ferramentas externas] → documentar seu alcance; não afirmar automação que não existe.
- [Verificação ou identidade Git falha] → não criar um commit de conclusão incompleto; relatar a causa e retomar depois da correção.

## Migration Plan

Aplicar esta mudança antes de `bootstrap-study-platform`. Validar a configuração OpenSpec e confirmar que `operationGuidance` aparece nas instruções de apply de uma mudança existente. Criar o primeiro commit para os arquivos desta própria mudança e suas instruções, mesmo que outros arquivos ainda estejam não rastreados. Para reverter a convenção, remover a orientação de `openspec/config.yaml` e a seção correspondente de `AGENTS.md` em uma mudança posterior; commits já criados permanecem no histórico.
