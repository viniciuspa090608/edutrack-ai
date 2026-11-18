# Design

## Context

Ver motivação em proposal.md. O working tree estava limpo na branch master ao iniciar o planejamento. SubjectsPage renderiza a coleção mesmo com detail aberto; filtros também ficam fora do ramo do detalhe. TasksPage mantém seu painel de filtros antes do conteúdo selecionado. DashboardPreviewList e dashboard.css já oferecem rolagem e efeitos de borda, mas a grade fixa linhas em minmax(16.5rem, auto) e 14.5rem. ProgressHeader chama window.print e prepara somente o .study-report da aba montada.

SubjectsService.dashboardSummary calcula progresso com o roadmap selecionado por listRoadmaps(pageSize: 1), senão plano manual; subjectListSchema ainda contém somente subjectSchema, sem resumo. dashboardSchema.streak já usa studyProgressSchema, incluindo conquistas: não é necessário novo endpoint de conquistas.

Referência lida: C:/Users/vinic/Downloads/edutrack_relatorio_unificado.pdf, três páginas. Apresenta cabeçalho destacado, faixas de contexto, indicadores, comparação tabular, gráficos diários, tabela consolidada e conquistas. Sua ordem termina em conquistas, divergindo da solicitação: a ordem explícita do usuário prevalece. Registrar essas características aqui mantém a orientação disponível mesmo sem acesso futuro a Downloads.

## Goals / Non-Goals

**Goals:** composição responsiva, detalhe isolado, resumo oficial eficiente e um fluxo de impressão comum com dados reais e identidade EduTrack.

**Non-Goals:** alterar critérios de concessão, agregar todos os roadmaps sob uma nova regra, recalcular analytics, criar biblioteca de PDF no servidor, alterar rotas públicas ou implementar código durante o propose.

## Decisions

1. **Filtros e detalhes por modo de visualização.** Grid para as duas linhas de Tarefas e flex/grid para Disciplinas, com busca flexível maior que os botões. Em largura insuficiente, permitir quebra. Renderizar filtros, coleção e paginação somente no modo listagem, preservando seu estado para retorno. Compartilhar o padrão de cabeçalho título/Voltar sem criar abstração geral desnecessária. Remover seleção anterior antes de carregar outra e proteger contra respostas antigas; componentes relacionados recebem IDs e keys da entidade selecionada. Esconder apenas com CSS deixaria conteúdo e foco indevidos acessíveis, por isso não é a abordagem escolhida.

2. **Progresso oficial na resposta paginada.** Acrescentar resumo tipado de leitura a cada item da lista (origem, total, concluídos, percentual), mantendo schema de escrita independente. Extrair/reutilizar no módulo Subjects a regra de dashboardSummary para evitar divergência. Buscar resumos em lote no repository para a página autenticada, sem consulta web por card e sem N+1 de roadmaps. Preservar o critério atual de seleção do roadmap, inclusive desempate. Sem itens significa percentual null; plano manual com itens usa sua proporção real. Não usar a disciplina destacada como fonte da lista. A mudança de contrato é intencional e substitui, somente neste ponto, a restrição visual anterior de não adicionar consultas/contratos; os demais dados permanecem iguais.

3. **Uma única região rolável por conteúdo.** Rever min-height: 0, flex, contenção, margem da lista e overflow no wrapper de Disciplinas para que o fim do conteúdo fique alcançável. Cabeçalho/rodapé permanecem externos. Transferir altura da linha de Pomodoro para Flashcards mantendo soma e gap; reduzir também espaços internos para que o ganho chegue à lista. Medir os dois estados de Pomodoro. A centralização vertical antiga é explicitamente substituída pelo grupo compacto. Não impor número fixo de baralhos, pois nomes e zoom variam.

4. **Catálogo visual compartilhado.** Criar mapeamento por código estável da conquista com ícone e tokens de cor diferentes por conquista, com variantes legíveis em claro/escuro. Usar earnedAt para filtrar a prévia; aproveitar os dados já recebidos pelo Dashboard. Grid com gap: 4px e overflow-y somente no contêiner de ícones, com nome acessível e identificação por foco/toque. Manter no mural todos os estados e critérios existentes. Regras de raridade e recompensas permanecem fora do escopo.

5. **Composição única de impressão.** Separar apresentação imprimível de controles de rota. Coordenador compartilhado carrega progresso e analytics autenticados, congela o snapshot ao imprimir e monta uma única raiz imprimível com Progresso completo seguido de Estatísticas. Não montar duas páginas interativas com listeners e botões duplicados. Reutilizar formatadores e blocos de dados existentes. Manter impressão pelo navegador em vez de mesclar arquivos PDF binários, evitando dependência nova e diferenças entre os pontos de entrada.

6. **Consulta e disponibilidade comuns.** Estado compartilhado nas rotas de Relatório preserva a última consulta de analytics aplicada durante a sessão autenticada; inicialização usa os mesmos defaults existentes. Rascunhos não alteram o documento. Limpar estado na troca de conta/logout. Bloquear durante carregamento/erro de qualquer fonte necessária; permitir relatório com seção vazia explícita quando a outra contém atividade. Preservar gates e omissão de módulos. beforeprint só prepara dados já prontos; afterprint, cancelamento e desmontagem restauram DOM, foco e estado. Carregar logo antes de liberar a ação.

7. **Referência visual adaptada.** Usar a hierarquia do modelo, não seus números nem a ordem das páginas. Tokens do tema claro em escopo de impressão, favicon de apps/web/public/favicon.png e cores de conquista compartilhadas quando aplicáveis. Preservar indicadores de Progresso, conquistas e notas antes de iniciar Estatísticas. A4 com quebras semânticas, tabelas com cabeçalho repetido, listas sem altura máxima e paginação contínua. Não fixar três páginas. Não reproduzir gráfico decorativo como série real. Conservar cobertura, dados ausentes, fim exclusivo e comparação parcial.

## Risks / Trade-offs

- [Resumo por disciplina pode gerar N+1] → consultas em lote para IDs da página e verificação de isolamento com MySQL real.
- [CSS antigo de grade interfere no ganho de Flashcards] → verificar dimensões conjuntas e área útil com módulos ligados/desligados e ambas as apresentações de Pomodoro.
- [Respostas antigas misturam detalhes] → invalidar requisições/seleções e testar troca rápida entre duas entidades.
- [Impressão varia por navegador] → renderizar/salvar PDF no navegador alvo e revisar todas as páginas; usar CSS de impressão suportado.
- [Dados mudam durante impressão] → congelar snapshot e timestamp único até afterprint.
- [Modelo contém dados e ordem diferentes] → usar somente referência visual; priorizar specs e fontes autenticadas.

## Migration Plan

Implementar em codex/refine-study-interface-and-unified-report ao iniciar apply se não houver branch de trabalho adequada. Atualizar contratos/API e web juntos, sem migrations de banco previstas. Executar verificações e QA antes de finalizar. Revisar snapshots semânticos dos seis deltas; preservar specs posteriores e demais mudanças abertas. Preparar manifesto explícito e concluir via pnpm openspec:finish conforme README e AGENTS.md, sem push. Rollback consiste em reverter a mudança conjunta de aplicação/contratos; não há migração de dados.
