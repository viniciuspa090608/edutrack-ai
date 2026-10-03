# Proposal

## Why

A EduTrack registra estudo em módulos distintos, mas ainda não mostra a constância da pessoa nem reconhece marcos verificáveis. Sequências e conquistas precisam partir de atividades confirmadas, com dias definidos no fuso do usuário e sem duplicar eventos.

## What Changes

- Mostrar sequência atual, maior sequência e conquistas obtidas em uma área privada de progresso.
- Contar como atividade válida: transição de tarefa para `COMPLETED` (manual ou derivada das subtarefas), conclusão de cada bloco de 25 minutos de Pomodoro, avaliação confirmada de flashcard, conclusão de item do plano manual de matéria **e conclusão de bloco de roadmap quando todos os seus passos estiverem concluídos**. Portanto, concluir um bloco de matéria mantém a sequência. Simples revelação de cartão, criação/edição de conteúdo, pausa e tempo parcial sem bloco não contam.
- Atribuir cada evento à data local usando o fuso IANA salvo na conta; várias atividades na mesma data contam como um dia ativo. A sequência atual considera hoje ou, se hoje ainda não tiver atividade, ontem; um dia inteiro perdido a zera. Alterar o fuso afeta eventos futuros, preservando as datas já creditadas.
- Conceder uma vez por conta as seguintes conquistas, conforme eventos confirmados:

| Conquista | Critério |
| --- | --- |
| Primeiro dia | 1 dia ativo |
| Três dias seguidos | sequência de 3 dias ativos |
| Sete dias seguidos | sequência de 7 dias ativos |
| Tarefas em dia | 10 transições de tarefa para `COMPLETED` |
| Foco consistente | 5 blocos Pomodoro completos |
| Revisão constante | 20 avaliações de flashcards |
| Plano em andamento | 5 conclusões de itens manuais de matéria ou blocos de roadmap, somadas |

- Registrar cada atividade confirmada uma vez por transição ou avaliação, inclusive em chamadas repetidas e concorrentes. Reabrir e concluir novamente cria uma nova atividade apenas quando há nova transição real; excluir o objeto original não desfaz conquistas já obtidas.

## Capabilities

### New Capabilities

- `study-streaks`: dias ativos, fuso horário por conta, sequência atual e maior sequência.
- `study-achievements`: catálogo fixo de conquistas, critérios e concessão única por conta.

### Modified Capabilities

- `shared-contracts`: contratos públicos de fuso, sequência e conquistas para web e API.

## Impact

- `apps/api`: registro idempotente de atividades e projeções de sequência/conquistas, integrações pelos contratos públicos de tarefas, Pomodoro, matérias/roadmaps e revisão de flashcards, migrations MySQL e rotas autenticadas.
- `apps/web`: escolha de fuso na conta e apresentação acessível da sequência e das conquistas.
- `packages/contracts`: validação dos dados de fuso e respostas públicas.
- O apply depende de autenticação, tarefas e subtarefas, Pomodoro, matérias e roadmaps, flashcards com repetição espaçada e preferências ainda planejados. `add-study-analytics` pode consumir os mesmos eventos quando aplicado, sem ser pré-requisito desta mudança. IA não é necessária para manter uma sequência; blocos de roadmap já existentes contam quando concluídos manualmente.
