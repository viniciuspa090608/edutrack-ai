# Design

## Context

Ver [proposal.md](proposal.md) e as specs desta mudança. `add-manual-flashcards` ainda não foi aplicado e prevê baralhos/cartões próprios, consulta por revelação, preferência `flashcards_enabled` e CRUD sem IA. `import-flashcards` também está em planejamento. Esta mudança acrescenta agendamento após esses dois fluxos existirem, sem transformar a consulta manual em avaliação. A API usa controllers, services e repositories; dados de usuário são filtrados pelo ID autenticado. MySQL usa migrations versionadas e `synchronize: false`.

## Goals / Non-Goals

**Goals:** calcular datas reproduzíveis, registrar cada avaliação uma única vez, permitir substituir a política de cálculo futuramente e manter a consulta de cartões independente do agendamento.

**Non-Goals:** sincronizar com calendário externo, enviar notificações, usar IA para avaliar respostas ou prometer eficácia pedagógica clínica. Nesta versão não há algoritmo configurável pelo usuário.

## Decisions

### 1. Política pura e versionada

O módulo de flashcards terá uma fronteira de agendamento com uma função pura equivalente a `next(previousState, rating, reviewedAt) → decision`. Ela não acessa banco, HTTP, React ou serviços de IA. A implementação inicial se chama `sm2-inspired-v1`; o serviço de revisão escolhe a política registrada e persiste seu identificador e versão no estado e em cada evento. Estado de outra versão só poderá ser usado por uma política nova após migração explícita do estado, sem reinterpretar silenciosamente o histórico. Testes de tabela e relógio fixo cobrirão todos os níveis e transições.

Alternativa considerada: colocar multiplicadores no service de CRUD de cartões. Isso acoplaria persistência e algoritmo e dificultaria sua troca.

### 2. Regra inicial de `sm2-inspired-v1`

Um cartão novo começa com `dueAt = createdAt`, intervalo 0, fator de facilidade 2,5 e sequência de acertos 0. Cartões existentes no momento da migration recebem estado inicial com `dueAt` no momento do backfill, sem inventar revisões passadas. Todos os cálculos partem do instante confirmado pelo servidor em UTC, somando durações exatas: 10 minutos = 600 segundos, 1 dia = 86.400 segundos, 3 dias = 259.200 segundos, 5 dias = 432.000 segundos. A interface converte para o horário local apenas na apresentação.

| Avaliação | Sem intervalo consolidado: cartão novo ou após `AGAIN` | Com intervalo consolidado `I` |
| --- | --- | --- |
| `AGAIN` | 10 minutos | 10 minutos |
| `HARD` | 1 dia | `max(1, ceil(I_dias × 1,2))` dias |
| `GOOD` | 3 dias | `max(3, ceil(I_dias × facilidade))` dias |
| `EASY` | 5 dias | `max(5, ceil(I_dias × facilidade × 1,3))` dias |

`AGAIN` zera a sequência de acertos e reduz a facilidade em 0,20; `HARD` aumenta a sequência e reduz a facilidade em 0,15; `GOOD` aumenta a sequência sem mudar facilidade; `EASY` aumenta a sequência e a facilidade em 0,15. A facilidade fica entre 1,3 e 3,0. Com intervalo consolidado, arredondar para dias inteiros e garantir `GOOD >= HARD + 1 dia` e `EASY >= GOOD + 1 dia` antes de aplicar o teto de 365 dias. Usa-se a facilidade **anterior** à avaliação para calcular o novo intervalo. `AGAIN` reinicia o estágio, de modo que a próxima avaliação positiva usa novamente o intervalo inicial de seu nível. A política é inspirada no princípio de ampliar intervalos conforme o histórico, sem afirmar equivalência ao SM-2 original.

Alternativa considerada: usar dias de calendário no fuso do navegador. Isso tornaria os resultados dependentes de fuso e horário de verão e dificultaria reprodução no servidor.

### 3. Estado materializado e histórico imutável

Uma migration cria estado de agendamento 1:1 com cartão (`card_id`, `due_at`, `revision`, `policy_id`, `policy_version`, estado validado da política, timestamps) e eventos de avaliação append-only (`card_id`, `user_id`, `rating`, `reviewed_at`, estado anterior e novo, intervalo, próxima data, versão da política, chave idempotente). `due_at` recebe índice para a fila. A consulta de pendentes filtra proprietário por baralho, `flashcards_enabled` e `due_at <= now`, ordena por `due_at` e ID, e pagina resultados; nunca retorna verso na lista. Histórico pagina por data e ID. Exclusão de cartão ou baralho remove estado e eventos pelo mesmo ciclo de vida dos cartões. Dados não são apagados ao desativar o módulo.

Alternativa considerada: recomputar a fila inteira a partir do log a cada abertura. O log segue auditável, mas o estado materializado permite consulta eficiente e atualização transacional.

### 4. Avaliação atômica, idempotente e autorizada

O fluxo usa rota autenticada de pendentes, rota de avaliação de cartão pendente e rota de histórico, ajustadas à estrutura final publicada por `add-manual-flashcards`. O request inclui avaliação, revisão esperada do estado e uma chave idempotente criada pelo cliente para aquela ação. O service localiza cartão e baralho do usuário, verifica a preferência e bloqueia o estado de agendamento em transação MySQL. Se a chave já foi confirmada, retorna a decisão gravada; caso contrário, exige revisão atual e `due_at <= reviewedAt`, chama a política, grava novo estado e evento, e confirma juntos. Requisição concorrente com revisão antiga recebe conflito sem novo evento. IDs alheios ou inexistentes têm resposta indistinguível de não encontrado. O cliente não fornece `user_id` nem horário de avaliação confiável.

Alternativa considerada: confiar em dois `PATCH` separados, um para estado e outro para histórico. Uma falha entre eles quebraria a consistência da próxima revisão.

### 5. Edição de conteúdo e importação

Criação manual e importação confirmada criam o estado inicial no mesmo fluxo de persistência do cartão. Ao alterar efetivamente frente ou verso, o service de flashcards reinicia o estado para `dueAt = editedAt`, facilidade 2,5 e sequência 0, incrementa a revisão e a geração do conteúdo na mesma transação, mas mantém eventos anteriores para consulta. Reenvio de conteúdo idêntico não reinicia agendamento. O histórico indica a geração a que cada avaliação pertence. A revelação manual continua sem escrita e pode compartilhar apenas o componente visual de frente/verso com a sessão programada.

Alternativa considerada: manter a próxima data após mudança de conteúdo. Isso aplicaria a memória da resposta antiga a um cartão diferente. Apagar eventos antigos reduziria a transparência sobre revisões já realizadas.

### 6. Interface de revisão

A página de flashcards ganha entrada para pendentes e contagem, com filtros por baralho se houver. A sessão mostra uma frente por vez; após **Revelar resposta**, mostra verso e quatro botões com rótulo claro. A interface envia avaliação uma vez, mostra próxima data, retira o cartão da fila e avança conforme escolha da pessoa. Sair após revelar descarta apenas o estado local. Falhas preservam o cartão visível e permitem tentar novamente com a mesma chave idempotente. O histórico por cartão fica separado da consulta manual. Estados vazio, loading, erro e sucesso, foco visível, teclado, largura de 320 px e movimento reduzido seguem os padrões do projeto.

## Risks / Trade-offs

- [Duplo clique ou perda da resposta duplica revisão] → chave idempotente persistida, revisão esperada e transação com bloqueio.
- [Horários variam por fuso ou horário de verão] → durações em segundos a partir do UTC do servidor, conversão local apenas para exibição.
- [Histórico cresce com o uso] → paginação e índices; eventos só são removidos com o cartão segundo a política existente.
- [Mudança futura de algoritmo] → versão em estado e evento, política pura e migração explícita do estado antes de aplicar outra versão.
- [Cartões, importação e autenticação ainda não implementados] → aplicar dependências antes, adaptando os nomes de tabela e rotas aos contratos concretos sem alterar estes comportamentos.

## Migration Plan

1. Após `add-manual-flashcards` e `import-flashcards`, adicionar tabela de estado e eventos; criar estado inicial para cartões existentes em migration/backfill idempotente, mantendo histórico vazio.
2. Integrar criação, importação e edição de cartões ao estado; publicar rotas de pendentes, avaliação e histórico após testes MySQL reais e isolados.
3. Publicar a interface de revisão programada, mantendo a consulta manual atual. Em rollback do código, ocultar as novas ações e preservar estado/eventos para reinstalação; não descartar histórico automaticamente.
