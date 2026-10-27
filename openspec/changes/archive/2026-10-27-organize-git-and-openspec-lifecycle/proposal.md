# Proposal

## Why

O histórico local está preservado, mas não há remoto nem upstream configurados, e 35 mudanças completas continuam ativas ao lado de uma mudança incompleta. A convenção atual separa o archive do apply, acumulando documentação fora das specs principais e dificultando saber o que foi concluído e publicado.

## What Changes

- Inventariar Git, publicação, commits e mudanças OpenSpec com evidências, distinguindo referências locais de branches realmente consultadas no servidor.
- Recuperar a URL correta de origin com informação confiável; consultar o servidor e configurar upstream somente quando a relação entre os históricos estiver comprovada. Manter master como branch principal local, sem renomeações ou exclusões desnecessárias.
- Documentar branches codex/<mudança> para novos trabalhos, integração à principal e publicação explícita, sem push automático.
- Auditar e arquivar o backlog concluído em ordem de dependência, sincronizando deltas com as specs principais sem sobrescrever requisitos mais recentes. Preservar refine-auth-desktop-layout enquanto suas pendências não tiverem evidências de conclusão.
- Alterar AGENTS.md, orientação de operações OpenSpec e documentação para que o apply concluído execute commit, sincronização e archive automaticamente, sem uma nova solicitação do usuário.
- Preservar um único commit final por mudança: incorporar sync e archive ao commit recém-criado por amend restrito ao próprio commit local ainda não publicado. Falhas deixam estado recuperável e relatório explícito.
- Fornecer um comando de conclusão explícito e verificável, integrado ao fluxo do agente, sem hook global post-commit que arquive mudanças em commits comuns.

## Capabilities

### New Capabilities

Nenhuma. Mudança de ferramentas, documentação e organização do repositório; skip_specs: true.

### Modified Capabilities

Nenhuma alteração de comportamento do produto. As specs existentes serão sincronizadas apenas com deltas históricos aprovados durante a organização do backlog.

## Impact

AGENTS.md, openspec/config.yaml, README.md, scripts locais de conclusão e seus testes, package.json, openspec/changes e openspec/specs. A configuração local Git pode ser corrigida durante o apply, dependendo da identificação do repositório. Não altera funcionalidades, banco, segredos, tags ou versão; não inclui push, force-push, exclusão de branches nem reescrita de commits históricos. A URL do remoto permanece uma dependência externa a resolver no apply; sua ausência não impede o trabalho independente de organização local.
