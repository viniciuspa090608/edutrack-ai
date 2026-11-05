# Design

## Context

Ver motivação e escopo em proposal.md. `ProfilePage.tsx` concentra resumo lateral, foto, preferências, aparência e acesso. `StudyTimeZoneSection` já é um card, mas está aninhado em Preferências. `AISettingsSection` e `ClassroomSection` têm estilos próprios; as correções devem ser locais aos componentes, evitando regras globais que deformem controles compartilhados.

`theme.ts` e o bootstrap de `index.html` já seguem o sistema quando a escolha manual está ausente; `useTheme` expõe apenas o tema efetivo. `AuthenticatedShell` lista Estatísticas e Progresso separadamente; `ProgressHeader` já oferece links entre suas rotas. `DashboardPage` recebe a sessão Pomodoro completa, mas só mostra seu estado. `PomodoroPage` deriva a contagem de `remainingSeconds` e tempo monotônico desde o recebimento, com reconciliação no limite do bloco.

O grid desktop usa duas linhas para Tarefas e uma linha para Matérias/Progresso, mas `align-items: start` impede o preenchimento. O resumo de matérias é uma matéria destacada ou null, não uma contagem da coleção: ausência de destaque não comprova ausência de cadastro. `listSubjects` já permite consulta paginada. Os testes próximos cobrem Conta, shell, tema, Dashboard, Pomodoro, Estatísticas, Progresso e Classroom.

## Goals / Non-Goals

**Goals:** usar os componentes, assets, contratos e fluxos atuais; preservar comportamento temporal e segurança; tornar verificáveis todos os ajustes das capturas em claro/escuro e desde 320 px.

**Non-Goals:** alterar APIs ou banco, regras de cota, estados Pomodoro, métricas, concessão de conquistas ou semântica dos fusos. Não implementar esta proposta durante o planejamento.

## Decisions

### Conta com composição local e menos redundância

Remover do resumo lateral os elementos após a verificação do e-mail, mantendo edição nas seções reais. Remover apenas os quatro subtítulos explicitamente indicados. Usar cabeçalhos flex com alinhamento vertical central. No Classroom, agrupar título e descrição em uma coluna ao lado do logo existente. Separar Fuso de estudo como irmão de Preferências, ajustando âncoras e observação de seção para preservar ordem e destaque do menu.

Na foto, usar grid com coluna de avatar e coluna flexível de input; requisitos ficam abaixo da foto em uma linha própria, podendo ocupar a largura necessária. Manter label, aria-describedby e ações. O input deve ter min-width: 0 e apresentação de arquivo adequada à largura disponível em 320 px. Evitar empilhar input sob avatar no mobile, pois isso contraria a solicitação.

Reutilizar o asset `features/auth/assets/google-g.png` no vínculo. Agrupar identificação e descrição à esquerda e ação à direita com space-between, adaptando quando a largura não comportar. Reduzir gaps e margens locais sem reduzir áreas de toque. No card de IA, formar um parágrafo dinâmico com os mesmos dados confirmados; mensagens de erro/sucesso permanecem independentes para anúncio acessível. Corrigir proporção e centralização do RadioButton no componente/estilo responsável, verificando outros usos se houver alteração compartilhada. Não substituir o controle por desenho sem semântica.

Alternativa descartada: esconder todos os parágrafos cinza por CSS, pois removeria validações e informações não incluídas no pedido.

### Preferência Sistema separada do tema efetivo

Expor a preferência local (system/light/dark) separadamente da aparência resolvida. Selecionar Sistema remove `edutrack.theme` e limpa a escolha manual em memória; aproveitar fallback já entendido pelo bootstrap, evitando migração ou novo valor persistido. Manter eventos entre abas, mudança de matchMedia e falhas de storage. O toggle do header continua escolhendo manualmente o oposto do tema efetivo; a seleção da Conta deve refletir essa escolha. Alternativa de persistir a string system exigiria mais caminhos de compatibilidade sem benefício neste caso.

### Relatório usa as rotas existentes

Trocar as duas entradas do shell por Relatório apontando para `/app/estatisticas`; reconhecer as duas rotas como o mesmo destino ativo. Reaproveitar navegação interna de `ProgressHeader` com rótulos Estatísticas e Progresso e identificação acessível da página atual. Não criar `/app/relatorio`, nem redirecionar acesso direto a Progresso. Links reais preservam clique modificado, histórico, parâmetros e navegação sem remontar o shell. Preferir navegação de páginas com aparência de abas à adoção indevida de role tab sem seu comportamento de teclado.

### Fuso: retirar avisos, preservar operações

Remover identificações redundantes em Dashboard, resultados de Analytics, Progresso, listagem/programação de Rotinas e proveniência Classroom. Preservar os campos funcionais de fuso em formulários de rotina/consulta, seus erros necessários, a configuração na Conta e referência UTC da cota de IA. Não alterar payloads, agrupamentos ou formatação temporal para realizar uma mudança textual. As specs antigas que exigem identificação visível em gráfico, progresso e rotinas são explicitamente substituídas nos deltas.

### Home com tempo real e vazio comprovado

Mover o time referente a `data.asOf` para o subtítulo do card principal, com ano de dois dígitos e frase solicitada. Manter seu fuso de apresentação atual; não transformar o instante da consulta em relógio corrente. Antes de carregar dados válidos usar só a orientação.

Compartilhar a derivação de tempo da sessão entre Home e Pomodoro, baseada em snapshot recebido e relógio monotônico, para evitar dois algoritmos divergentes. O timer atualiza a apresentação enquanto RUNNING, fica parado em pausa e limita em zero. Consultar o estado real ao entrar/recuperar foco/visibilidade e no limite, protegendo respostas antigas e liberando intervalos/listeners ao desmontar. Enquanto a Home estiver visível com sessão aberta, usar revalidação periódica de 5 segundos sem chamadas sobrepostas para refletir comandos de outra aba; suspender consultas em background e reconciliar ao voltar. Não executar comandos de conclusão a partir do card; preservar a autoridade do servidor e a reconciliação de início incerto. Falhas mostram indisponibilidade/estado não confirmado sem iniciar outra sessão. Alternativa de decrementar um contador isolado acumularia deriva e ignoraria pausas externas.

Reutilizar `CollectionEmptyState` para os quadros vazios. Tarefas está vazia quando todas as contagens são zero, não apenas quando upcoming está vazio. Se não houver matéria destacada, consultar a primeira página de `listSubjects` com tamanho mínimo para distinguir zero cadastros de ausência de destaque; proteger respostas antigas e tratar falha separadamente. Com matérias existentes, manter orientação neutra e acesso ao módulo, sem afirmar Nenhuma matéria cadastrada.

As ações Adicionar tarefa/matéria devem abrir os modais de criação reais dos módulos. Adotar um parâmetro de navegação explícito `?create=1`, consumido uma vez pelo destino após seus gates; removê-lo com replaceState para não reabrir após fechar ou atualizar. Preservar outros parâmetros, cancelamento e foco no acionador válido. Essa pequena integração evita duplicar formulários na Home; apenas navegar à listagem não cumpre a ação de cadastro.

Aplicar stretch somente aos cards vazios e suas áreas de conteúdo, sem alturas fixas. Tarefas ocupa as linhas disponíveis de Pomodoro/Flashcards; Matérias acompanha Progresso. Em coluna única ou sem vizinho, voltar à altura natural. Não reservar uma linha vazia para módulo omitido.

## Risks / Trade-offs

- [Foto e input em 320 px] → coluna flexível com mínimo zero, quebra de nomes longos e verificação visual real.
- [Tema efetivo confundido com preferência] → APIs distintas e testes de retorno ao sistema, recarga e abas.
- [Resumo null interpretado como coleção vazia] → confirmação pela API existente de matérias, com falha independente.
- [Polling e timer divergentes] → projeção compartilhada, consultas sem sobreposição, cleanup e testes com relógio controlado.
- [Remoção excessiva de informações de fuso] → revisão dos locais e preservação de controles funcionais e cálculo.
- [Alturas artificiais com módulos ocultos] → grid adaptado às seções presentes e altura natural no mobile.

## Migration Plan

Sem migration de dados ou preferência: valores light/dark continuam válidos e ausência significa Sistema. No apply, registrar Git, usar branch de trabalho adequada sem alterar master e preservar mudanças preexistentes. Executar verificações e revisão visual antes da conclusão. Preparar manifesto de arquivos próprios e seis snapshots de sync com merge semântico; executar `pnpm openspec:finish --change refine-dashboard-account-experience --manifest .openspec-local/refine-dashboard-account-experience-manifest.json --message "[update] refinar dashboard e configurações da conta"`, conforme README, resultando em um único commit final com archive, sem push. Em falha, retomar o journal sem segundo commit. Rollback de código preserva APIs, dados e preferências existentes.
