# Design

## Context

O `AGENTS.md` exige um commit por apply concluído e contém uma mensagem fixa antiga. `openspec/config.yaml` repete a mesma mensagem na orientação de apply. O novo formato já foi documentado no `AGENTS.md` por solicitação explícita nesta etapa de proposal; os arquivos permanecem sem commit até o apply. Ver [proposal.md](./proposal.md) para a motivação.

## Goals / Non-Goals

**Goals:** manter uma única convenção legível para pessoas e agentes, com os cinco tipos solicitados e sem conflito entre `AGENTS.md` e a orientação do OpenSpec.

**Non-Goals:** validar mensagens por hook, reescrever histórico, criar tags, alterar número de commits por apply ou mudar código de aplicação.

## Decisions

### Documentação principal e orientação OpenSpec

`AGENTS.md` será a referência permanente para o formato `[tipo] descrição objetiva da alteração`, o significado de `feat`, `make`, `fix`, `update` e `delete`, os exemplos e a regra de uma alteração lógica por commit. No apply, a linha de `openspec/config.yaml` que ainda exige `Apply OpenSpec change: ...` será substituída por uma orientação compatível com `AGENTS.md`, mantendo as demais regras de versionamento.

**Alternativa considerada:** manter a mensagem fixa como exceção para applies. Isso criaria dois formatos para o mesmo projeto e contrariaria o pedido de usar o novo padrão em cada commit.

### Um apply, um commit lógico

O tipo será escolhido conforme a natureza da mudança concluída. A mensagem do commit deste apply deverá usar `update`, pois modifica uma convenção existente. A regra anterior de exatamente um commit por apply concluído continua válida; a nova convenção define o texto desse commit.

**Alternativa considerada:** criar um commit para cada tarefa do apply. Isso conflita com a regra de versionamento já adotada e separaria artefatos que compõem uma mesma mudança revisável.

### Verificação documental

Não será adicionada dependência nem hook Git para esta mudança. A aceitação verificará o conteúdo de `AGENTS.md`, a ausência da mensagem fixa em orientações ativas, a validade do OpenSpec e os comandos de qualidade do projeto. O apply revisará o diff staged antes de criar seu único commit.

**Alternativa considerada:** instalar um validador automático de commit. O pedido limita esta etapa a documentar a convenção; um hook acrescentaria comportamento e manutenção sem necessidade demonstrada.

## Risks / Trade-offs

- [A orientação OpenSpec antiga contradiz o `AGENTS.md`] → atualizar `openspec/config.yaml` no apply e procurar a mensagem fixa nas instruções ativas antes de concluir.
- [Escolha subjetiva entre `make` e `update`] → usar `make` para criação/configuração inicial e `update` para alterar algo que já existe, conforme os exemplos documentados.
- [Commits antigos têm outro formato] → aplicar a convenção somente aos novos commits, sem reescrever histórico.

## Migration Plan

O `AGENTS.md` já contém a nova seção, ainda sem commit. No apply, conferir essa seção, alinhar `openspec/config.yaml`, executar as verificações previstas e criar o único commit da mudança com uma mensagem `[update] ...`. Se a revisão identificar contradição, corrigir os textos antes do commit. Não há migração de dados nem rollback de aplicação.
