# Tasks

## 1. Fila e contratos

- [x] 1.1 Estender os contratos e as consultas de baralhos e revisão com filtro por matéria, contagens e fila por escopo. Verificar em MySQL isolado a paginação, os totais por estado, a exclusão de cartões futuros, a agregação de todos os baralhos vinculados e o isolamento por conta e preferência de módulo.
- [x] 1.2 Expor a prévia dos quatro intervalos usando a política vigente. Verificar as durações para cartões novos, em aprendizagem e consolidados, a equivalência com a confirmação e a ausência de gravações ao consultar a prévia.

## 2. Telas de estudo

- [x] 2.1 Implementar Baralhos conforme o esboço com os componentes existentes. Verificar colunas, matéria ao lado do nome, filtro, estados vazios, paginação e acesso aos fluxos de criação e gerenciamento.
- [x] 2.2 Implementar a visão compartilhada de baralho e matéria. Verificar o resumo e o início da sessão no escopo escolhido, incluindo matéria com vários baralhos, fila vazia e retorno à lista.
- [x] 2.3 Reorganizar a revisão com pergunta, divisor, resposta e área inferior. Verificar a revelação explícita, a associação de cada intervalo com sua avaliação, a próxima data confirmada e a transição para outro cartão ou fim da fila.
- [x] 2.4 Integrar carregamento, foco, histórico e recuperação de erros. Verificar saída sem avaliação, repetição idempotente após falha, recuperação de conflito e retorno ao resumo do mesmo escopo.

## 3. Verificação integrada

- [x] 3.1 Comparar as três telas com os esboços e o manual oficial do Anki. Conferir a 320 px e no desktop, em tema claro e escuro, com conteúdo longo, toque, teclado, foco visível e movimento reduzido.
- [x] 3.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` com MySQL real isolado e `pnpm build`. Conferir também o acesso aos fluxos de consulta manual, importação, IA e histórico.
