# Design

## Context

Ver proposal.md para motivação. O working tree estava limpo ao iniciar. DashboardPage renderiza um único objeto subjects; SubjectsService.dashboardSummary usa dashboardCandidate e retorna somente um candidato. O contrato dashboard.ts confirma essa limitação: não é apenas corte por CSS. dashboard.css limita a lista de disciplinas a 8rem e contém regras sobrepostas de altura. Há Progress compartilhado já disponível.

achievement-colors.css já define as sete cores por código e tema e seletores de borda, ícone e barra. A necessidade é garantir que classes e cascata realmente apliquem essa identidade em Progresso; a causa exata do desvio visual requer inspeção dos estilos computados durante o apply. ProgressHeader já compartilha a estrutura, mas UnifiedReportPrint contém motivo de indisponibilidade variável; não há evidência suficiente para atribuir o salto somente a esse texto.

ProfilePage tem seis rótulos e o shell inclui Rotinas entre Pomodoro e Relatório. Rotinas possui rotas autenticadas próprias e ainda precisa de preferência e gate. As specs atuais exigem destaque único no dashboard e grade com seis opções; estes deltas substituem explicitamente esses comportamentos. As outras mudanças abertas serão preservadas.

## Goals / Non-Goals

**Goals:** Usar fontes oficiais, serviços públicos dos módulos, carregamento limitado e layouts estáveis com critérios verificáveis.

**Non-Goals:** Alterar cálculo de progresso, concessão de conquistas, conteúdo impresso ou mínimo de módulos; criar dependências, módulos vazios ou implementar durante a proposta.

## Decisions

1. **Coleção paginada oficial na Home.** Alterar o resumo inicial para conter primeira página, total e metadados; disponibilizar páginas adicionais pelo módulo de disciplinas com o mesmo resumo oficial. Usar páginas de 10 itens com ação Carregar mais dentro da área rolável, preservando itens em falha e reiniciando a coleção na atualização da Home. Reutilizar autenticação e schemas estritos; ignorar respostas antigas após refresh/troca de conta. Pendentes primeiro por prazo ascendente, demais por updatedAt descendente, desempate por id. Alternativa de carregar tudo aumenta resposta sem limite; listar somente nomes perde o resumo pedido. Consultas devem agrupar os dados da página e evitar uma cadeia de chamadas HTTP por disciplina. Dashboard integra pelo serviço público, sem acessar repository interno de outro módulo.

2. **Espaço interno e barra existente.** Remover teto arbitrário e espaços ociosos do corpo de Disciplinas, redistribuindo a área já disponível por flex/grid e min-height: 0. Compactar margens dos itens mantendo nomes e indicadores legíveis; preservar dimensões externas na mesma composição desktop. Reutilizar Progress em SubjectsPage com o percentual oficial, texto e estado não calculável. Evitar aumentar o card ou reduzir tipografia para esconder o problema.

3. **Identidade por código.** Reutilizar achievement-presentation e achievement-colors.css, conferindo classes em StudyProgressPage e prioridade da cascata. Paleta escura de referência: #6ee7b7, #fbbf24, #d8b4fe, #93c5fd, #fda4af, #67e8f9 e #f0abfc na ordem dos códigos existentes. Preservar variantes claras de contraste. Evitar duplicar cores em componentes ou associá-las à posição do array.

4. **Cabeçalho estável desde o início.** Medir o botão antes/depois de dados, logo e mensagens; conferir importação tardia de CSS e dimensões de wrappers. Garantir regras estruturais carregadas no primeiro render, reservar a região da ação e colocar motivos de bloqueio em área que não altere o alinhamento do botão. Preservar disabled, aria-describedby e impressão unificada. Uma animação para mascarar salto não resolve estabilidade.

5. **Rotinas como capability independente.** Acrescentar routines aos contratos de preferências e cópias do dashboard, persistência, leitura de sessão e defaults de onboarding. Migration MySQL versionada ativa para contas existentes; synchronize permanece false. Aplicar gate antes de leitura/escrita em todos os fluxos públicos de Rotinas, inclusive agenda; integrar bloqueio de rota e sidebar. Manter mínimo restrito aos três módulos atuais e sem efeitos destrutivos sobre dados. Usar ordem compartilhada de capabilities para preferência e shell, preservando caminhos especiais de Relatório e IA. Ocultar somente o link foi descartado porque deixaria acesso direto operacional.

6. **Orientação da Conta.** Mover o bloco textual existente para abaixo de h1 Conta e ajustar grid do cabeçalho sem duplicação. Preservar formulário, drafts e salvamento explícito.

## Risks / Trade-offs

- [Paginação durante alterações concorrentes pode deslocar itens] → deduplicar por id, atualizar a coleção completa no refresh e usar ordenação estável.
- [Novos resumos por disciplina podem gerar N+1] → consultas limitadas por página e agregação no módulo proprietário.
- [Mudanças de schema quebram consumidores internos] → atualizar API, contratos, fixtures e web na mesma mudança.
- [CSS existente já contém a intenção das cores e do cabeçalho] → medir estilos computados e geometria no navegador antes e depois, sem declarar causa não comprovada.
- [Rotinas sem gate em algum endpoint] → cobrir CRUD, agenda, links diretos e outra aba com testes de integração.

## Migration Plan

No apply, registrar estado Git e usar branch adequada codex/refine-platform-progress-and-dashboard se necessário. Criar migration aditiva, atualizar contratos/API/web juntos e validar migration e isolamento em MySQL real dedicado. Rollback de aplicação requer versão compatível com o novo schema; reversão da coluna remove somente a preferência, nunca rotinas, e não deve ocorrer antes de retirar consumidores.

Depois de todas as tarefas e verificações aprovadas, revisar snapshots semânticos de specs preservando requisitos posteriores e preparar manifesto explícito conforme README. Executar pnpm openspec:finish --change refine-platform-progress-and-dashboard --manifest .openspec-local/refine-platform-progress-and-dashboard-manifest.json --message "[update] melhorar dashboard e preferências da plataforma". Preservar master, mudanças alheias e outras changes; sem push ou tag. Em falha retomar o journal sem segundo commit.
