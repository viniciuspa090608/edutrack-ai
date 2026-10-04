# Tasks

## 1. Preparação e apresentação comum

- [x] 1.1 Registrar status/diff Git no início do apply e separar alterações preexistentes, incluindo a proposta pendente de Pomodoro; verificar baseline salvo e lista explícita de arquivos desta mudança.
- [x] 1.2 Implementar classes/primitives locais de header, superfície, cards, badges e estados comuns a Progresso/Estatísticas, consumindo tokens claros/escuros e ícones existentes; verificar uso concreto nas duas páginas e ausência de alterações globais ou dependências novas.

## 2. Progresso e conquistas

- [x] 2.1 Reorganizar StudyProgressPage com sequência atual, recorde e dias ativos destacados e contexto de fuso/rastreamento/regras preservado; verificar valores da resposta e link `/conta` em teste UI, incluindo streak atual zero com histórico positivo.
- [x] 2.2 Reestilizar os sete cards do mural com nomes/critérios completos, ícones e labels Obtida/Bloqueada/Em progresso conforme dados existentes; verificar catálogo completo, earnedAt como fonte da obtenção e datas no fuso retornado.
- [x] 2.3 Estilizar barras preservando Math.min(progress,target), max real e nomes acessíveis; verificar progresso zero/parcial/acima do alvo sem novo cálculo de negócio ou percentual inventado.
- [x] 2.4 Derivar skeleton, erro/retry, primeiro dia e nenhuma conquista obtida do padrão comum sem ocultar critérios; verificar estados com resposta zero, progresso parcial sem concessão e falha recuperada por teclado.
- [x] 2.5 Atualizar apenas a apresentação de StudyTimeZoneSection, incluindo busy/disabled/sucesso/erro; verificar nos testes existentes que sugestão não salva automaticamente, submit explícito persiste e mensagens/validação são preservadas.

## 3. Estatísticas e evolução

- [x] 3.1 Reorganizar header, filtros e contexto dos períodos em AnalyticsPage preservando draft/query, opções reais, data, fuso e handlers; verificar payloads e submissão por teclado, sem mês/filtro por matéria/intervalo novo.
- [x] 3.2 Aplicar cards comuns às métricas reais e frequência, priorizando activeMs quando presente e preservando atual/anterior/diferença/percent/cobertura/fim exclusivo/parcial; verificar omissão de métricas, percent nulo e valores indisponíveis sem conversão a zero.
- [x] 3.3 Implementar barras visuais locais por métrica sobre series recebida, com unidades separadas e equivalente textual completo; verificar mesmas datas e valores, minutos formatados como antes, zero distinto de lacuna e aviso de amostras pré-cobertura, sem agregação/interpolação.
- [x] 3.4 Tornar séries longas legíveis com rolagem local identificada/focável e labels acessíveis; verificar período anual em 320 px sem overflow da página nem compressão ilegível e sem alteração de query/dados.
- [x] 3.5 Derivar loading, erro/retry, período sem atividade e histórico indisponível do padrão comum; verificar distinção dos estados e preservação do refresh por focus/preferências e cleanup, sem mocks na aplicação.

## 4. Temas, responsividade e validação

- [x] 4.1 Completar claro/escuro para superfícies, textos, barras, bloqueadas/obtidas, eixos/legendas e hover/focus/selected/disabled, incluindo portal do Select e eventuais tooltips; verificar ambas as variantes visualmente, sem depender só de cor.
- [x] 4.2 Validar 320, 375, 768 e 1280 px, teclado e movimento reduzido com dados reais existentes; registrar em validation.md evidências de cards, critérios longos, filtros, séries curtas/longas e estados alcançáveis, distinguindo limitações de ambiente de validações aprovadas.
- [x] 4.3 Expandir e executar somente testes UI focados via `pnpm --filter @study-platform/web test src/features/study-progress/StudyProgressPage.spec.tsx src/features/analytics/AnalyticsPage.spec.tsx`, acrescentando somente testes de componentes diretamente modificados se necessário; verificar catálogo/estados/alvos, fidelidade de payloads/séries, omissões, fuso, temas sem perda de dados e retry, sem suíte geral/backend/banco/módulos alheios.
- [x] 4.4 Executar `pnpm lint`, `pnpm typecheck` e `pnpm build` e revisar diff para garantir que contratos, backend, critérios, cálculos, produtores de eventos e módulos fora do escopo não mudaram; registrar resultados reais em validation.md e resolver falhas da mudança antes de concluir.

## 5. Conclusão do apply

- [x] 5.1 Atualizar tasks.md final somente após tarefas e verificações aprovadas, selecionar explicitamente arquivos/hunks desta mudança, revisar staged e executar `git diff --cached --check`; verificar que alterações preexistentes ficaram fora do stage e não usar `git add .`.
- [x] 5.2 Criar exatamente um commit de conclusão `[update] atualizar visual de progresso e conquistas` incluindo implementação e tasks.md final, sem commit vazio; confirmar hash e arquivos incluídos e reportar ao usuário, sem tag/push/archive automático. Não criar commit de conclusão para apply pausado ou com falhas.
