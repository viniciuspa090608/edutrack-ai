# Tasks

## 1. Dependência e contratos

- [x] 1.1 Confirmar que `add-user-authentication` está aplicado, com middleware de sessão, `userId` autenticado e tabela `users` disponíveis; verificar por teste HTTP que uma rota privada distingue sessão válida de ausente antes de iniciar a integração de tarefas.
- [x] 1.2 Adicionar em `packages/contracts` schemas/tipos de tarefa, criação, atualização parcial, filtros, paginação e respostas, sem importar entidades da API; verificar por testes de contrato datas inválidas, limites de texto, enumerações, campos desconhecidos e `null` para limpeza.

## 2. Persistência e API

- [x] 2.1 Criar migration versionada e entidade de `study_tasks` com FK para `users`, índices por proprietário e prazo, defaults de importância/status e `DATE` para prazo; verificar aplicação única e reversão da migration em MySQL de teste isolado, mantendo `synchronize: false`.
- [x] 2.2 Implementar repository com proprietário obrigatório em cada leitura e mutação, ordenação estável e filtros combinados; verificar em MySQL real que dois usuários nunca recebem ou alteram tarefas um do outro.
- [x] 2.3 Implementar service e endpoints de criação/lista/detalhe com validação, defaults e paginação; verificar HTTP 201/200, título aparado, prazo sem deslocamento de dia, ausência de sessão e lista vazia.
- [x] 2.4 Implementar `PATCH /tasks/:id` para edição parcial e mudanças manuais entre os três status, inclusive limpeza explícita de descrição/prazo; verificar preservação de campos omitidos, rejeição de valores inválidos e HTTP 404 para ID alheio.
- [x] 2.5 Implementar `DELETE /tasks/:id` com escopo do proprietário e resposta 204; verificar remoção da tarefa própria e 404 para tarefa inexistente ou de outro usuário sem alterar o registro alheio.
- [x] 2.6 Aplicar os filtros `status`, `priority`, `dueFrom` e `dueTo` com intervalo inclusivo e paginação preservada; verificar combinações, limites de data, exclusão de tarefas sem prazo quando há intervalo e erro para filtros inválidos em testes HTTP/MySQL.

## 3. Experiência web

- [x] 3.1 Adicionar `/app/tarefas` à navegação e proteção da área autenticada, reutilizando a sessão e `returnTo` interno; verificar que abertura direta sem sessão não exibe dados e leva ao login.
- [x] 3.2 Construir lista, detalhe, paginação e filtros na funcionalidade web de tarefas; verificar carregamento, lista vazia, filtros sem resultado, limpeza de filtros e preservação dos filtros ao mudar de página.
- [x] 3.3 Construir formulários de criação/edição e controle manual dos três status; verificar por testes de interação valores padrão, validação, limpeza de opcionais, sucesso, erro de rede e ausência de envio duplicado.
- [x] 3.4 Adicionar exclusão com confirmação acessível e atualização da lista somente após resposta bem-sucedida; verificar cancelamento, falha e exclusão confirmada por testes de interface.
- [x] 3.5 Revisar rótulos, mensagens de erro, foco e layout da página a 320 px; verificar uso completo por teclado e inspeção visual sem rolagem horizontal do layout.

## 4. Verificações e conclusão

- [x] 4.1 Documentar no README o uso manual de tarefas, filtros, prazo como data e dependência da autenticação, deixando subtarefas/progresso para `add-task-subtasks-and-progress` e matéria para mudança posterior; verificar que a documentação corresponde à interface e API entregues.
- [x] 4.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` com MySQL real em `TEST_DB_NAME` e `pnpm build`; verificar código zero nos quatro comandos e corrigir qualquer falha.
- [x] 4.3 Executar `openspec validate add-study-tasks --strict` e conferir manualmente CRUD, filtros, isolamento entre dois usuários e funcionamento sem IA/matérias; verificar todos os cenários da spec e validação sem erros.
- [x] 4.4 Revisar e adicionar somente arquivos/hunks desta mudança, incluindo `tasks.md` final, executar `git diff --cached --check` e criar o único commit de conclusão no formato de `AGENTS.md`; verificar hash e lista de arquivos incluídos.
