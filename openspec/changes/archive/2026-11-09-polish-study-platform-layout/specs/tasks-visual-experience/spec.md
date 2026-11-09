# Spec Delta

## MODIFIED Requirements

### Requirement: Conclusão rápida e detalhes compactos
Cada card de tarefa da lista SHALL ter uma caixa de seleção acessível que reflita o estado confirmado. Marcar uma tarefa sem subtarefas SHALL concluí-la. Marcar uma tarefa com subtarefas pendentes SHALL abrir a confirmação existente e, ao confirmar, concluir a tarefa e as subtarefas pendentes atomicamente. A caixa de uma tarefa já concluída SHALL refletir a conclusão sem iniciar reabertura em lote. Sem subtarefas, Ver detalhes SHALL aparecer como ação compacta sem a faixa de progresso, alinhada ao fim da mesma linha do bloco de título e prazo quando houver espaço. Em larguras estreitas SHALL poder quebrar de linha sem sobrepor o conteúdo. A interface SHALL manter o estado anterior em caso de cancelamento ou falha e impedir envios duplicados durante a operação.

#### Scenario: Concluir a partir da lista
- **WHEN** a pessoa marca uma tarefa parcialmente concluída e confirma a conclusão em lote
- **THEN** todas as subtarefas ficam concluídas, a tarefa fica com 100% e a lista reflete o status conforme seus filtros.

#### Scenario: Tarefa sem subtarefas
- **WHEN** a pessoa marca uma tarefa sem subtarefas na lista
- **THEN** a tarefa é concluída diretamente e Ver detalhes permanece disponível sem a faixa de progresso.

#### Scenario: Layout de tarefa sem subtarefas
- **WHEN** a lista exibe uma tarefa sem subtarefas e há espaço horizontal
- **THEN** Ver detalhes fica na extremidade direita da linha do título e do prazo, inclusive com o texto Sem prazo.
