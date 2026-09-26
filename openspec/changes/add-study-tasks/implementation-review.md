# Revisão da implementação

## Escopo entregue

- Contratos de tarefa, criação, edição parcial, filtros e paginação compartilhados entre web e API.
- Migration `CreateStudyTasks20260926180000`, entidade TypeORM e CRUD com proprietário obrigatório, sessão e proteção de origem existentes; preferência de tarefas verificada antes do acesso aos dados.
- Página `/app/tarefas`, navegação, formulários, status manual, detalhe, filtros, paginação e confirmação de exclusão.
- Prazo mantido como `DATE` e string de calendário; a conexão lê `DATE` como string e timestamps em UTC.

## Verificações

- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`: código zero.
- Suíte: 115 testes (10 contratos, 67 API e 38 web), incluindo MySQL real em bancos isolados com prefixo `TEST_DB_NAME`.
- `openspec validate add-study-tasks --strict`: sem erros.
- Migration aplicada uma única vez, revertida e reaplicada em MySQL isolado; FK, índices, defaults e prazo preservados.
- Testes HTTP/MySQL de tarefas também aprovados nos fusos `UTC` e `Pacific/Auckland`, além do fuso local `America/Sao_Paulo`.
- Revisão no navegador com viewport de 320 px: criação e edição por teclado, status/ importância manuais, calendário nativo, filtro sem resultado, limpeza de filtros e cancelamento de exclusão por Escape.
- Layout: `innerWidth = 320`, `clientWidth = scrollWidth = 305` com a barra vertical; sem overflow horizontal. Rótulos, foco visível e quebra de texto conferidos visualmente.
- Diálogo nativo restringe os controles disponíveis e inicia em Cancelar; Escape restaura foco em Excluir tarefa.
- Acesso direto sem sessão mantém `/app/tarefas` como destino do login, inclusive em StrictMode.
- Conferência HTTP na API temporária: filtros inclusivos combinados, leitura/edição/exclusão alheias retornando 404, registro próprio intacto e exclusão própria retornando 204 seguida de detalhe 404. Fluxo com IA desativada, sem matérias/flashcards.
- Os serviços, arquivos e banco usados na revisão manual são temporários e removidos ao finalizar.

## Observação do build

O Vite emite aviso de bundle acima de 500 kB; o build termina com código zero. Divisão do bundle não pertence a esta mudança.
