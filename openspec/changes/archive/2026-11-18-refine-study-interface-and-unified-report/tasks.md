# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD, status e diffs preexistentes; usar codex/refine-study-interface-and-unified-report se não houver branch adequada e verificar que master e alterações alheias foram preservadas.

## 2. Progresso individual de disciplinas

- [x] 2.1 Adicionar contrato de resumo de leitura por disciplina e reaproveitar a regra oficial de seleção de fonte; verificar schemas para roadmap, plano manual, zero e percentual nulo sem mudar validações de escrita.
- [x] 2.2 Consultar resumos em lote para a página autenticada na API; verificar com MySQL real isolado duas disciplinas da mesma conta, outra conta, paginação, filtro, ausência de itens e atualização após conclusão, sem N+1 por card.
- [x] 2.3 Exibir o percentual específico em cada card com formatação acessível; verificar valores distintos, progresso parcial e ausência de base sem reutilizar o destaque do Dashboard.

## 3. Filtros e detalhes

- [x] 3.1 Reorganizar filtros de Disciplinas em uma linha e Tarefas em duas linhas conforme specs; verificar visualmente busca maior, quatro controles na primeira linha de Tarefas, submissão/limpeza e adaptação em 320 px.
- [x] 3.2 Restringir detalhes de Disciplinas à seleção e ocultar filtros, coleção e paginação; verificar duas disciplinas com registros diferentes, link contextual com roadmap e retorno com critérios, página e foco preservados.
- [x] 3.3 Restringir detalhes de Tarefas à seleção e ocultar filtros, coleção e paginação; verificar duas tarefas com subtarefas distintas, resposta antiga descartada e retorno à listagem anterior.
- [x] 3.4 Alinhar Voltar à direita do título nos dois detalhes; verificar nomes longos, teclado e quebra sem sobreposição em 320 px.

## 4. Cards do Dashboard e conquistas

- [x] 4.1 Corrigir contenção e rolagem da prévia de Disciplinas; verificar acesso ao fim com ponteiro, toque e teclado, sem cortes e com cabeçalho/rodapé externos, incluindo resumo curto sem scroll artificial.
- [x] 4.2 Compactar Pomodoro e transferir a altura liberada à área útil de Flashcards; comparar medidas antes/depois nos estados inicial e com cronômetro, mantendo soma das alturas, gap e alinhamento com Tarefas e mostrando mais baralhos antes do scroll.
- [x] 4.3 Criar mapeamento estável de ícone e cor por conquista e aplicar ao mural; verificar códigos em ordem diferente, estados obtido/parcial/pendente e contraste nos dois temas.
- [x] 4.4 Exibir apenas conquistas obtidas no card Progresso com gap de 4 px; verificar nomes acessíveis, consistência com o mural, estado vazio e excesso com scroll restrito à div das conquistas.

## 5. Impressão unificada

- [x] 5.1 Compartilhar consulta aplicada entre as abas de Relatório com defaults existentes e isolamento da sessão; verificar navegação entre abas, descarte de rascunhos, logout/troca de conta e preferência de módulos.
- [x] 5.2 Implementar coordenador de carregamento e snapshot único para impressão de ambas as fontes; verificar bloqueio em loading/erro, retry, ausência total e uma seção vazia com outra ativa, sem impressão parcial silenciosa.
- [x] 5.3 Compor raiz imprimível compartilhada com Progresso, conquistas e notas primeiro e Estatísticas completas depois; verificar ambos os botões com mesmos dados/consulta e preservação de unidades, períodos, lacunas, cobertura, gráficos e tabela diária.
- [x] 5.4 Aplicar hierarquia do PDF de referência, paleta clara oficial e favicon carregado antes de imprimir; verificar logo, cores, cards, seções, tabelas e rodapé mesmo ao iniciar com tema escuro, sem copiar números ou ordem do modelo.
- [x] 5.5 Ajustar A4, quebras, cabeçalhos de tabela e paginação contínua sem overflow interno; salvar PDFs por ambas as abas e inspecionar todas as páginas com séries extensas, muitas conquistas e escala de cinza.
- [x] 5.6 Restaurar DOM, foco e estado após impressão/cancelamento e desmontagem; verificar nova impressão sem listeners ou seções duplicadas e timestamp único por geração.

## 6. Verificação integrada e conclusão local

- [x] 6.1 Revisar os fluxos em desktop e 320 px, temas claro/escuro, teclado e movimento reduzido, com módulos opcionais desativados e falhas parciais; registrar evidências de filtros, detalhes, scroll e distribuição de altura.
- [x] 6.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build, usando MySQL real isolado para testes de banco; registrar resultados e corrigir falhas antes de marcar conclusão.
- [x] 6.3 Revisar semanticamente os seis deltas e preparar snapshots locais e manifesto explícito conforme README; verificar cenários preservados, substituição da centralização antiga e impressão da aba por impressão unificada, sem conflitos com specs posteriores.
- [x] 6.4 Revisar arquivos/hunks próprios, staged diff e git diff --cached --check; preparar e inspecionar o manifesto explícito para o finalizador, verificando que somente os arquivos da mudança serão incluídos.

## Conclusão após o checklist

Executar pnpm openspec:finish --change refine-study-interface-and-unified-report --manifest .openspec-local/refine-study-interface-and-unified-report-manifest.json --message "[update] refinar interface de estudos e unificar relatório". O finalizador exige todas as tarefas de implementação e revisão concluídas antes de criar o commit; a criação do commit e o archive são pós-condições deste fluxo, verificadas após o comando. Confirmar archive e hash final, sem push; em falha posterior ao commit, retomar o journal sem criar outro commit.
