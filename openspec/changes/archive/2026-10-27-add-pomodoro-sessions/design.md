# Design

## Context

Veja `proposal.md` e `specs/pomodoro-sessions/spec.md`. O código atual não tem autenticação ou módulos de estudo implementados. `add-user-authentication` define sessão e identidade; `add-study-tasks` define tarefas próprias e sua exclusão; ambos ainda são mudanças em planejamento. `add-profile-and-module-preferences` define bloqueio de ações do módulo de tarefas quando desligado. A arquitetura do projeto separa módulos e exige MySQL real em testes de banco.

## Goals / Non-Goals

**Goals:**

- Apurar um ou mais blocos de 25 minutos de execução acumulada na mesma sessão, com pausas excluídas, mesmo após recarga e em abas concorrentes.
- Encerrar cada sessão no máximo uma vez e oferecer registros estáveis de tempo e blocos para estatísticas futuras.
- Validar tarefa associada sem fazer Pomodoro depender do repository interno de tarefas.

**Non-Goals:**

- Criar intervalos de descanso automáticos, notificações ou detecção automática de atenção real.
- Criar módulo de matérias, associação com matéria ou dashboard de analytics nesta mudança.
- Atualizar automaticamente status/progresso de tarefa ao concluir foco.

## Decisions

### 1. Modelo e máquina de estados

Criar `pomodoro_sessions` com ID, `user_id`, `task_id` anulável, estado `RUNNING | PAUSED | BETWEEN_BLOCKS | COMPLETED | CANCELED`, tempo ativo total em milissegundos, instante de início do trecho em execução, início/fim da sessão, versão e número inteiro de blocos concluídos. Uma tabela pequena de sessão aberta usa `user_id` como chave única e aponta para a sessão não encerrada; criação e encerramento a atualizam na mesma transação. Isso impede duas sessões abertas mesmo se duas requisições partirem de abas diferentes. Índices por usuário e início permitem histórico e totais. A cada múltiplo de 1.500.000 ms ativos, o bloco é creditado uma vez e o estado efetivo passa a `BETWEEN_BLOCKS`; a contagem para até a pessoa iniciar o próximo bloco, concluir ou cancelar. Uma leitura pode derivar esse estado antes de a próxima transição persistir o marco; a transição sob bloqueio de linha materializa o crédito.

Transições permitidas: iniciar → `RUNNING`; `RUNNING` → `PAUSED`; `PAUSED` → `RUNNING`; fim de bloco → `BETWEEN_BLOCKS`; `BETWEEN_BLOCKS` → `RUNNING` ao iniciar próximo bloco; qualquer estado não terminal → `CANCELED`; `BETWEEN_BLOCKS`, ou `RUNNING`/`PAUSED` após pelo menos um bloco completo, → `COMPLETED`. Antes do primeiro bloco, `complete` retorna conflito e oferece cancelamento. `COMPLETED` e `CANCELED` são terminais. O servidor verifica estado e versão sob bloqueio de linha e devolve conflito com o estado atual para comando obsoleto; repetição de conclusão/cancelamento já terminal devolve o registro final sem nova contagem. A alternativa de guardar só cronômetro em memória do navegador perderia estado na recarga e permitiria duas contagens.

### 2. Cálculo de tempo ativo

Cada transição usa instante UTC obtido do MySQL dentro da transação, evitando divergência entre instâncias da API. Se `RUNNING`, o tempo efetivo é `min(nextBlockBoundaryMs, accumulated_active_ms + max(0, now - running_since))`, sendo `nextBlockBoundaryMs = (completed_blocks + 1) × 1.500.000`; se `PAUSED` ou `BETWEEN_BLOCKS`, é só o acumulado. Pausar grava o tempo efetivo e remove `running_since`. Continuar de pausa preserva o acumulado e define novo `running_since`; cinco minutos em pausa não entram na diferença. Ao atingir o limite, o crédito de bloco e a parada são atômicos. Iniciar o próximo bloco preserva total e créditos e define novo `running_since`. Concluir ou cancelar grava o tempo efetivo, preserva todos os blocos completos e encerra a sessão. Assim, cancelar antes do primeiro limite registra tempo parcial e zero blocos; cancelar após um ou mais limites mantém esses blocos. Nenhuma rota aceita tempo decorrido, bloco ou instante fornecido pelo cliente. O cálculo usa milissegundos internamente e expõe segundos inteiros, com arredondamento apenas na apresentação. Leituras de sessão aberta retornam instante do servidor, tempo efetivo e blocos para a web se sincronizar.

Somente sessões terminais entram no histórico agregado: `SUM(active_ms)` e `SUM(completed_blocks)` filtrados por `user_id`, com conversão final para segundos. Uma sessão ainda aberta aparece à parte. Não criar eventos de analytics sem consumidor atual; a linha terminal imutável e o ID serão a fonte para um futuro evento idempotente. A alternativa de incrementar um contador global em cada pausa ou bloco exigiria correções mais difíceis após repetição de chamadas.

### 3. Associação com tarefas sem dependência interna

`task_id` referencia `study_tasks.id` com `ON DELETE SET NULL`; a sessão e seus totais sobrevivem à exclusão da tarefa. O service público de tarefas valida se o ID pertence ao usuário autenticado antes da criação; conflito com exclusão concorrente é tratado pela FK como tarefa não encontrada. O módulo Pomodoro não importa repository ou entidade interna de tarefas. Associação é escolhida só no início. Se a preferência de tarefas existir e estiver desligada, o seletor some e a API recusa novo `task_id`, mas início sem tarefa e sessões já iniciadas continuam disponíveis. Não criar `subject_id` até existir um caso concreto de associação com matérias.

### 4. API e interface

Rotas autenticadas: `POST /pomodoro/sessions`, `GET /pomodoro/sessions/current`, `GET /pomodoro/sessions`, `GET /pomodoro/sessions/:id`, `GET /pomodoro/summary` e `POST /pomodoro/sessions/:id/{pause,resume,next-block,cancel,complete}`. Schemas Zod em `packages/contracts` validam corpo, parâmetros e respostas, sem expor entidade TypeORM. Toda consulta e mutação usa o `userId` da sessão e filtra por ele; ID alheio responde 404. Escritas reutilizam proteção de origem/CSRF da autenticação. `GET current` devolve a sessão aberta ou ausência explícita; `GET sessions` pagina registros terminais em ordem estável; `summary` devolve tempo ativo e blocos por usuário. Respostas de transição incluem versão e tempo calculado pelo servidor para resolver abas concorrentes.

Adicionar `/app/pomodoro` como página protegida. A web consulta a sessão aberta ao entrar e ao voltar do segundo plano. Ela pode projetar visualmente o cronômetro a partir do tempo e instante do servidor, mas nunca envia essa projeção como fato para a API; após falha de rede consulta novamente antes de repetir a ação. Ao fim de cada bloco, mostra **Iniciar próximo bloco** e **Concluir**; o botão **Concluir** também pode encerrar uma sessão com bloco anterior completo e trecho atual parcial. Controles obedecem ao estado e não permitem conclusão antes do primeiro bloco. A página mantém foco visível, rótulos, estados de erro/vazio/sucesso, layout a 320 px e movimento reduzido. O módulo funciona sem IA, matérias e tarefa selecionada.

### 5. Testes e implantação

Testes HTTP de integração usam MySQL real isolado e relógio controlado no limite de acesso ao tempo, cobrindo 10 minutos ativos + 5 pausados + 15 ativos, segundo bloco na mesma sessão, trecho parcial após bloco, recarga, corrida entre abas, repetição de comandos, cancelamento antes/depois do primeiro bloco, isolamento entre usuários, tarefa alheia/excluída e preferência de tarefas desligada quando disponível. O relógio controlado evita esperar 25 minutos em teste; a lógica de produção ainda usa tempo do banco. Testes web cobrem os controles por estado, sincronização após falha, teclado e 320 px. A migration depende de `users` e `study_tasks`, portanto essas mudanças devem ser aplicadas antes.

## Risks / Trade-offs

- [Aba fechada enquanto o timer executa] → tempo continua até o fim do bloco atual e para; ao retornar, a pessoa vê o estado real e escolhe próximo bloco, conclusão ou cancelamento. O timer mede estado de execução, não atenção física.
- [Duas abas enviam comandos na mesma sessão] → bloqueio transacional e versão impedem dupla transição; cliente recarrega o estado após conflito.
- [Relógios de instâncias diferem] → cálculo usa o relógio do MySQL e limita diferenças negativas a zero.
- [Tarefa excluída durante ou depois da sessão] → FK com `SET NULL` preserva histórico e totais, sem expor tarefa removida.
- [Spec de contratos pode avançar com tarefas antes deste apply] → antes de aplicar, rebasear o requisito `shared-contracts` sobre a versão principal então vigente, preservando cenários já publicados.

## Migration Plan

1. Concluir/aplicar autenticação e tarefas e confirmar tipos de `users.id` e `study_tasks.id`; se preferências já estiverem disponíveis, integrar o bloqueio de nova associação a tarefa desligada.
2. Aplicar migrations de sessões e slot aberto em MySQL com índices e FK anulável; manter `synchronize: false`.
3. Publicar API e web juntas; verificar sessão livre, pausas, vários blocos, conclusão/cancelamento e totais em conta real de teste. Nenhum dashboard novo é necessário.
4. Em rollback de código, retirar rotas e navegação, preservando sessões históricas e tabelas para retomada posterior; não recalcular nem apagar tempo já registrado automaticamente.
