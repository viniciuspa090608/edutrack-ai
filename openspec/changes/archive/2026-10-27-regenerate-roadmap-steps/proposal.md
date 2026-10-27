# Proposal

## Why

Um roadmap deixa de refletir o plano de estudo quando a pessoa muda a ordem de uma etapa. Ela precisa reorganizar o que ainda falta, mantendo o trabalho concluído e decidindo se a nova sequência sugerida por IA deve substituir a atual.

## What Changes

- Incluir, conforme ampliação autorizada, IDs estáveis e conclusão explícita dos passos, preservados pelo editor manual e registrados em revisões.
- Permitir mover um passo pendente dentro da parte ainda não concluída de um roadmap próprio e solicitar à IA uma nova sequência para os passos posteriores ao ponto alterado.
- Preservar sem mudanças os passos concluídos; exibir a sequência candidata em prévia, permitindo editar, confirmar ou cancelar antes de qualquer substituição.
- Validar a prévia e impedir passos duplicados no roadmap confirmado. Falhas de geração ou cancelamento deixam a versão ativa intacta.
- **Guardar versões confirmadas substituídas**, com data e origem da alteração. A pessoa poderá consultá-las e restaurar uma versão anterior; a restauração criará uma nova versão ativa, preservando o histórico. Rascunhos cancelados não serão guardados.
- Manter exatamente uma versão ativa por roadmap. O recurso com IA respeitará a preferência de IA e o isolamento por usuário, sem impedir a edição manual já prevista.

## Capabilities

### New Capabilities

- `roadmap-step-regeneration`: reordenação parcial com IA, prévia revisável, confirmação, prevenção de duplicatas e histórico recuperável de versões confirmadas.

### Modified Capabilities

Nenhuma spec principal publicada de matérias ou roadmaps será modificada; os proposals `add-subjects` e `generate-subject-roadmaps-with-ai` ainda não publicaram essas capacidades.

## Impact

- Autenticação, preferências, matérias e geração inicial de roadmaps estão aplicadas. Os passos atuais possuem IDs internos, recriados na edição, sem conclusão pública; esta mudança estabelece identidade estável, progresso e revisões sobre essa base real.
- `apps/web`: reordenação, prévia editável, confirmação/cancelamento e histórico/restauração, com suporte a teclado e estados de erro e carregamento.
- `apps/api` e `packages/contracts`: endpoints e schemas autenticados para gerar prévia, confirmar com controle de versão, listar versões e restaurar; persistência versionada e transações MySQL.
- A IA complementa o roadmap da matéria; não altera tarefas, Pomodoro, matérias de outras pessoas nem o fluxo manual quando a IA estiver desativada.
