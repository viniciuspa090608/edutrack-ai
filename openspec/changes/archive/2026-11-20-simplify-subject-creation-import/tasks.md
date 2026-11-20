# Tasks

## 1. Contratos e criação

- [x] 1.1 Registrar branch e estado Git, preservar alterações preexistentes e criar codex/simplify-subject-creation-import se não houver branch adequada; verificar diff inicial e arquivos próprios.
- [x] 1.2 Separar schemas de criação, resposta e atualização e normalizar objetivo/horas/assuntos ausentes nas rotas manual e Classroom; verificar testes de contratos para entrada mínima, valores explícitos inválidos, resposta completa e PATCH sem defaults indevidos.
- [x] 1.3 Compartilhar sugestões de intermediário, seis meses de calendário e objetivo automático nos rascunhos; verificar fim de mês, ano bissexto e preservação de edições com testes focados.
- [x] 1.4 Adaptar cadastro manual e consumidores da criação, incluindo prévias do assistente, sem relaxar parâmetros obrigatórios de geração de roadmap; verificar criação somente com nome/nível/prazo e personalização persistida em MySQL real isolado.

## 2. Importação Classroom

- [x] 2.1 Inicializar turmas novas com criar nova disciplina e padrões, inclusive seleção em lote, preservando vínculos e somente tarefas; verificar seleção individual, lote, revisão e reimportação sem duplicatas.
- [x] 2.2 Oferecer usar disciplina existente com Select das disciplinas próprias e cobertura de paginação; verificar loading/erro/vazio, escolha além da primeira página, rejeição de destino alheio e preservação do planejamento existente em MySQL isolado.
- [x] 2.3 Simplificar rótulos e aplicar pares Objetivo/Nível e Prazo/Horas no formulário; verificar visualmente desktop e 320px, contexto acessível da turma e navegação por teclado.
- [x] 2.4 Alinhar Mais detalhes e Tentar novamente e ajustar texto do botão principal; verificar abertura do modal, quebra responsiva e retry preservando sucessos.
- [x] 2.5 Ocultar área de importação ao desconectar, fechar modal e invalidar respostas antigas; verificar desconexão com resultado, operação ativa, resposta tardia, recarga e reconexão sem apagar registros importados.

## 3. Assistente e estados vazios

- [x] 3.1 Compactar cards, limitar largura de leitura e integrar botão de envio com ícone e nome acessível; verificar temas, mensagens longas, prévias, Enter/Shift+Enter/IME, bloqueio durante envio e viewport de 320px com teclado virtual.
- [x] 3.2 Fazer cards vazios de Disciplinas e Flashcards ocuparem altura restante com margem inferior; verificar desktop, filtros expandidos, tela baixa, zoom, ausência real, filtro sem resultado, loading e erro.

## 4. Validação e conclusão local

- [x] 4.1 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build, com MySQL real isolado nos testes de banco; registrar resultados e resolver falhas antes da conclusão.
- [x] 4.2 Revisar deltas e cenários contra specs atuais, preparar snapshots semânticos e manifesto .openspec-local/simplify-subject-creation-import-manifest.json com arquivos próprios explícitos conforme README; verificar openspec validate simplify-subject-creation-import --strict e diff dos snapshots preservando requisitos posteriores.
- [x] 4.3 Executar pnpm openspec:finish --change simplify-subject-creation-import --manifest .openspec-local/simplify-subject-creation-import-manifest.json --message "[update] simplificar disciplinas e refinar interfaces de estudo", com revisão staged e git diff --cached --check; verificar refs reais antes de amend e confirmar archive, commit único final e arquivos incluídos, sem push, tag ou mudanças alheias.
