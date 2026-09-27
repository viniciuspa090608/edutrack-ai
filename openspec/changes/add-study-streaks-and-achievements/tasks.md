# Tasks

## 1. Pré-requisitos e contratos

- [x] 1.1 Confirmar que autenticação, preferências e os produtores de tarefas/subtarefas, Pomodoro, matérias/roadmaps e revisão espaçada estão aplicados com transições verificáveis; identificar o ID e instante confiável de cada conclusão, verificando os contratos e migrations entregues.
- [x] 1.2 Reconciliar o modelo persistido de blocos/passos de roadmap com o critério de bloco completo antes de integrar matérias; verificar em teste que apenas a transição do bloco inteiro gera atividade, inclusive sem IA.
- [x] 1.3 Adicionar schemas públicos de fuso IANA, sequência, início do rastreamento, catálogo e progresso de conquistas em `packages/contracts`; verificar validação de fuso inválido e compatibilidade web/API por testes de contrato.

## 2. Registro idempotente e fuso

- [x] 2.1 Criar migrations versionadas para fuso/histórico, marco de rastreamento, `study_activity_events` e `study_achievement_grants` com índices e unicidade; verificar apply/rollback em MySQL real isolado, preservando `synchronize: false`.
- [x] 2.2 Implementar leitura e edição autenticadas do fuso em `/conta`, com UTC explícito por padrão e sugestão não automática do navegador; verificar persistência, rejeição de fuso inválido e isolamento entre duas contas.
- [x] 2.3 Implementar `recordStudyActivity` transacional que escolhe o fuso vigente no instante da origem, congela a data local e ignora chaves repetidas; verificar meia-noite, horário de verão, troca de fuso, reprocessamento e rollback com relógio controlado.

## 3. Integrações com produtores

- [x] 3.1 Registrar somente transição real da tarefa principal para `COMPLETED`, manual ou derivada de subtarefas, com revisão de conclusão; verificar reenvio, reabertura/reconclusão e conclusão em lote sem evento por subtarefa.
- [x] 3.2 Registrar cada bloco Pomodoro completo com chave de sessão/ordinal e instante efetivo do limite de 25 minutos; verificar bloco antes da meia-noite materializado depois, pausa, cancelamento com e sem bloco e concorrência.
- [x] 3.3 Registrar cada avaliação persistida da revisão espaçada pelo ID do evento, sem contar revelação; verificar os quatro níveis, reenvio idempotente e exclusão posterior do cartão.
- [x] 3.4 Registrar transição de item manual de matéria para `COMPLETED` e transição de bloco de roadmap para todos os passos concluídos; verificar passo isolado, reabertura, nova conclusão e exclusão posterior sem apagar histórico.

## 4. Sequências e conquistas

- [x] 4.1 Calcular datas ativas distintas, sequência atual terminada hoje/ontem e maior sequência histórica por calendário local; verificar zero sem atividade, vários eventos no dia, dia perdido e mudanças de horário de verão.
- [x] 4.2 Implementar catálogo dos sete critérios do proposal e progresso por tipo de evento, com concessão única por `(user_id, achievement_code)`; verificar limiares de 1/3/7 dias, 10 tarefas, 5 blocos Pomodoro, 20 avaliações e 5 marcos de matéria.
- [x] 4.3 Recalcular concessões sob bloqueio por conta quando chegar evento atrasado, sem duplicar ou revogar prêmio; verificar ordem de entrega invertida, concorrência, fonte excluída e data do primeiro limiar.
- [x] 4.4 Expor `GET /study-progress` para a sessão autenticada, retornando fuso, início rastreado, sequências e conquistas; verificar que IDs de cliente não permitem consultar outra conta e que a leitura não grava eventos.

## 5. Interface e conclusão

- [x] 5.1 Criar área privada de progresso com sequência atual/recorde, fuso, início do histórico e conquistas obtidas/pendentes; verificar estados vazio/loading/erro/sucesso, teclado, foco, texto acessível e layout desde 320 px.
- [x] 5.2 Documentar atividades válidas e excluídas, política de fuso, sete conquistas e limite do histórico anterior ao rastreamento; verificar que a documentação coincide com API e interface.
- [x] 5.3 Executar integração com MySQL real isolado para dois usuários, eventos repetidos, módulos desativados, manual sem IA, virada de dia e horário de verão; verificar todos os cenários das specs e ausência de dados alheios.
- [x] 5.4 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate add-study-streaks-and-achievements --strict`; corrigir falhas antes de concluir.
- [x] 5.5 Revisar diff, adicionar apenas arquivos/hunks desta mudança e executar `git diff --cached --check` antes do único commit de apply conforme `AGENTS.md`; verificar hash e arquivos incluídos.
