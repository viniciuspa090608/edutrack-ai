# tasks-visual-experience Specification

## Purpose

Estabelecer uma identidade visual consistente baseada no Stitch para todos os fluxos existentes de Tasks, acessível e responsiva nos temas claro e escuro, preservando dados, regras e operações reais do EduTrack.

## Requirements

### Requirement: Identidade visual integral do módulo
A interface de Tasks SHALL compartilhar hierarquia tipográfica, superfícies, espaçamentos, bordas, raios, botões, controles, badges e feedback entre listagem, criação, edição, detalhes, subtarefas e confirmações. Interfaces sem equivalente no Stitch SHALL derivar essa mesma identidade. O redesenho SHALL permanecer restrito a Tasks e suas interfaces diretamente relacionadas.

#### Scenario: Percorrer o fluxo completo
- **WHEN** a pessoa abre a lista, cria uma tarefa, vê os detalhes, edita seus campos e gerencia subtarefas
- **THEN** todas essas interfaces apresentam a mesma linguagem visual
- **AND** confirmações de exclusão e conclusão em lote também seguem esse padrão.

### Requirement: Listagem fiel aos dados reais
Os cards SHALL distinguir título, descrição quando disponível, status, importância, prazo e progresso existente com hierarquia visual inspirada no Stitch. A interface SHALL preservar a ordem recebida, paginação e filtros existentes, e SHALL NOT inventar dados, totais agregados, horários, status ou ações. Matéria SHALL ser apresentada somente quando resolvida pela integração existente e habilitada, sem usar nomes fictícios ou IDs como nomes.

#### Scenario: Informações opcionais ausentes
- **WHEN** uma tarefa não possui descrição, matéria, prazo ou subtarefas
- **THEN** a interface usa indicação neutra ou omite o metadado opcional
- **AND** não mostra progresso calculado, prazo com horário, anexos ou conteúdo fictício.

#### Scenario: Aplicar filtros e navegar
- **WHEN** a pessoa combina status, importância e intervalo de prazo, aplica filtros e muda de página
- **THEN** os critérios e a paginação mantêm o funcionamento atual
- **AND** limpar filtros e recuperar uma listagem sem resultados permanecem disponíveis sem alterar a ordenação.

### Requirement: Formulários preservam campos e submissão
Criação e edição SHALL apresentar os campos e validações existentes na nova identidade, preservando título de até 160 caracteres, descrição opcional de até 2.000, importância `LOW`/`MEDIUM`/`HIGH`, status `PENDING`/`IN_PROGRESS`/`COMPLETED`, prazo opcional como data sem horário e matéria opcional conforme preferência. A interface SHALL preservar valores após erro, bloqueio durante submissão, cancelamento e abertura do detalhe após salvar. Com subtarefas, a edição SHALL continuar informando que o status é derivado e não enviar um status manual.

#### Scenario: Falha e nova tentativa
- **WHEN** a pessoa envia dados inválidos ou o salvamento falha
- **THEN** vê feedback legível junto aos campos ou ao formulário e mantém os valores digitados
- **AND** pode corrigir ou tentar novamente sem submissões duplicadas.

#### Scenario: Matérias desativadas
- **WHEN** a preferência de matérias está desativada e a pessoa cria ou edita uma tarefa
- **THEN** os controles de matéria permanecem ocultos e os payloads seguem o comportamento existente
- **AND** a associação preexistente não é apagada por causa do redesenho.

### Requirement: Subtarefas e progresso visualmente coerentes
Subtarefas SHALL manter título, estado binário, ordem e ações existentes de adicionar, editar, excluir, concluir, reabrir e mover por teclado. A interface SHALL apresentar as contagens e o percentual retornados pela API, preservando a regra concluídas ÷ total × 100 e a formatação que evita anunciar conclusão parcial como 0% ou 100%. Sem subtarefas, SHALL preservar o status manual e a ausência de percentual.

#### Scenario: Concluir e reabrir um passo
- **WHEN** a pessoa conclui ou reabre uma subtarefa e a API confirma a alteração
- **THEN** a lista de passos, as contagens, o progresso e o status exibido refletem a resposta real
- **AND** os estilos de concluído e pendente distinguem os estados sem inventar status intermediários para subtarefas.

#### Scenario: Confirmações e conflitos
- **WHEN** a pessoa cancela uma exclusão ou conclusão em lote, ou uma mutação retorna conflito ou erro
- **THEN** a interface preserva as confirmações, mensagens, recuperação e atualização de estado existentes
- **AND** não anuncia sucesso de operação não confirmada.

### Requirement: Temas claro e escuro completos
Todas as superfícies de Tasks SHALL acompanhar o tema atual, inclusive formulários e confirmações em modal, sem remount ou perda de valores. Ambos os temas SHALL tratar background, cards, inputs, selects, opções, bordas, textos, ícones, badges, progresso, alerts e estados hover, focus, selected e disabled com contraste adequado, sem inversão genérica de cores.

#### Scenario: Trocar tema com formulário aberto
- **WHEN** a pessoa alterna o tema com criação, edição ou confirmação aberta
- **THEN** página e modal adotam o tema escolhido com controles e mensagens legíveis
- **AND** valores, foco e estado da operação são preservados.

### Requirement: Feedback completo para estados assíncronos
Listagem, detalhe, subtarefas e integração de matéria SHALL preservar seus estados de carregamento, erro e recuperação; a UI SHALL distinguir ausência de tarefas, ausência de subtarefas, filtros sem resultados e sucesso de mutação usando a mesma identidade visual. Mensagens retornadas ou mapeadas da API SHALL manter o tratamento existente, sem expor payloads internos ou substituir erros por sucesso.

#### Scenario: Carregamento e indisponibilidade
- **WHEN** a listagem, detalhe, subtarefas ou seleção de matéria aguarda resposta ou falha
- **THEN** a pessoa identifica o estado atual e encontra a recuperação existente onde aplicável
- **AND** skeletons e mensagens não exibem registros fictícios como dados reais.

### Requirement: Responsividade e acessibilidade de todos os fluxos
Tasks SHALL permanecer utilizável em desktop, tablet e mobile desde 320 px, sem overflow horizontal causado pelo layout, inclusive com textos longos e diálogos. Ações SHALL permanecer alcançáveis por teclado, com nomes acessíveis, foco visível, restauração de foco, anúncios de estado e sem depender apenas de cor. Animações SHALL respeitar movimento reduzido.

#### Scenario: Tela estreita com conteúdo longo
- **WHEN** a pessoa abre cards, filtros, formulários, detalhes, subtarefas e confirmações em 320 px com títulos e descrições extensos
- **THEN** o conteúdo quebra ou rola verticalmente sem ocultar ações essenciais
- **AND** controles, cancelamento, submissão e reordenação continuam operáveis pelo teclado.

#### Scenario: Cancelar uma confirmação
- **WHEN** a pessoa cancela pelo teclado uma confirmação de exclusão ou conclusão
- **THEN** o foco retorna ao controle existente apropriado
- **AND** nenhuma mutação é enviada.

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
