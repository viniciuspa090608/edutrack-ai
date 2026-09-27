# Tasks

## 1. Preparação e contratos

- [x] 1.1 Registrar estado Git e alterações preexistentes, confirmar autenticação, preferências e produtores aplicados, inclusive conclusão de passos de roadmap; verificar migrations, transições e timestamps disponíveis antes de editar.
- [x] 1.2 Definir schemas e DTOs de período, data, fuso, série, comparação, métricas omitidas e cobertura histórica em `packages/contracts`; verificar validação de datas/fusos e respostas em testes de contrato.

## 2. Registros de atividade

- [x] 2.1 Criar migrations versionadas do ledger de eventos e intervalos ativos Pomodoro, com índices por usuário/instante e unicidade de origem; verificar aplicação e rollback em MySQL isolado e `synchronize: false`.
- [x] 2.2 Integrar emissão transacional e idempotente de conclusão de tarefas, avaliação de flashcards e conclusão de itens manuais; verificar reabertura, nova conclusão, repetição de comando e exclusão da origem em testes MySQL.
- [x] 2.3 Integrar conclusão/reabertura de passos de roadmap ao produtor e emitir evento de bloco somente quando o último passo completa o bloco; verificar edição/restauração sem falsa conclusão e métricas separadas de itens manuais.
- [x] 2.4 Persistir trechos ativos reais de Pomodoro e evento único de sessão concluída; verificar soma com `active_ms`, pausa, cancelamento parcial, sessão aberta e cruzamento de meia-noite.
- [x] 2.5 Fazer backfill somente de registros com instante confiável e registrar início de cobertura por métrica; verificar que `updated_at` genérico não cria conclusão histórica presumida.

## 3. Agregação e autorização

- [x] 3.1 Implementar limites de dia, semana ISO, trimestre, semestre e ano em fuso IANA, com conversão segura em horário de verão; verificar dias de 23/25 horas, fronteiras de ano e períodos anteriores.
- [x] 3.2 Agregar métricas, série diária, frequência e evolução a partir de eventos e intervalos do usuário autenticado; verificar duas contas, repetição idempotente, base anterior zero e período atual parcial em testes HTTP com MySQL real.
- [x] 3.3 Aplicar preferências à resposta e à frequência, omitindo fontes de módulos desativados sem excluir registros; verificar desativação/reativação e independência da preferência de IA.

## 4. Interface e fechamento

- [x] 4.1 Criar `/app/estatisticas` com seletores de período, data e fuso, cartões de métricas, série e equivalente textual; verificar teclado, 320 px, movimento reduzido e estados de loading/erro/vazio/histórico indisponível.
- [x] 4.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate add-study-analytics --strict`; corrigir falhas e conferir cenários das specs.
- [x] 4.3 Revisar diff e alterações preexistentes, adicionar somente arquivos/hunks deste apply, executar `git diff --cached --check` e criar exatamente um commit com implementação e `tasks.md` final; confirmar hash e arquivos incluídos.
