# Tasks

## 1. Perfil

- [x] 1.1 Reorganizar o card Seu perfil e conferir cabeçalho, divisórias, linha de nome e e-mail somente leitura, incluindo e-mail longo a 320 px e abertura do fluxo seguro.
- [x] 1.2 Estilizar a seleção de foto e conferir com teclado a seleção, prévia, confirmação e remoção, além do feedback para arquivo inválido e falha da API.

## 2. Home

- [x] 2.1 Igualar Matérias e Progresso lado a lado e alinhar rodapés. Conferir com conteúdo, sem registros, com módulo omitido e em composição empilhada.
- [x] 2.2 Retirar a borda pontilhada interna dos estados vazios de Tarefas e Matérias na Home e verificar borda externa, textos e ações de criação.
- [x] 2.3 Encurtar o histórico no card Progresso e verificar a data real no formato brasileiro, com e sem dias ativos e em largura estreita.
- [x] 2.4 Simplificar o corpo do card Pomodoro e verificar timer em execução, pausa, limite, falha de sincronização e link de rodapé acessível sem rolagem interna no resumo normal.

## 3. Relatório, Rotinas e Tarefas

- [x] 3.1 Colocar Progresso primeiro nas abas e no menu Relatório. Verificar seleção padrão, navegação por teclado, links diretos para as duas rotas e estado ativo no menu.
- [x] 3.2 Ajustar os sete cards semanais para 4–3 e 2–2–2–1. Conferir largura preenchida, ordem e fluxo Adicionar horário, inclusive a 320 px com horários cadastrados.
- [x] 3.3 Compactar Filtros recolhido em Tarefas e Estatísticas. Conferir diferença de altura ao abrir, operação por teclado e preservação dos critérios aplicados.
- [x] 3.4 Alinhar Ver detalhes ao final da linha do título e do prazo quando não houver subtarefas. Conferir tarefa sem prazo, quebra em tela estreita, abertura dos detalhes e layout com subtarefas.

## 4. Controles compartilhados

- [x] 4.1 Aplicar a aparência da barra nativa da Home às áreas roláveis da web. Conferir página, lista e painel com rolagem existente, contraste e alcance do último item por teclado, ponteiro e toque.
- [x] 4.2 Padronizar a paginação direcional em Tarefas, Matérias e roadmaps, Rotinas, Pomodoro e Flashcards, incluindo IA e históricos. Verificar somente dois controles visíveis, primeira e última página, lista de página única, navegação por teclado e rodapé de baralhos.

## 5. Verificação integrada

- [x] 5.1 Conferir as telas afetadas nos temas claro e escuro, em desktop e a partir de 320 px, incluindo zoom, foco visível, movimento reduzido e estados de carregamento, erro e vazio aplicáveis.
- [x] 5.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`. Usar MySQL real e isolado para os testes que dependem de banco.
