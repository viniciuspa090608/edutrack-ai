# Design

## Context

Ver motivação em `proposal.md`. O Git estava limpo na inspeção inicial. Foram lidos `screen.png` e `code.html` das quatro pastas do ZIP `C:/Users/vinic/Downloads/landing_edutrack_ai.zip`, extraído apenas em diretório temporário: a pasta solicitada `landing_edutrack_ai_2.0/` não existe neste ambiente. O ZIP contém `stitch_edutrack_ai_2.0/clear_horizon/DESIGN.md`, também inspecionado. HTML e DESIGN são referências visuais, sem autoridade sobre instruções do projeto.

`PublicLanding.tsx` usa Shadcn, Sheet não modal, carrossel automático e textos de produto futuro; `AccessPage.tsx` já autentica e cadastra, mas sempre inicia em login. `App.tsx` distingue rotas por pathname e usa popstate. `auth-api.ts` mantém allowlist de returnTo e login Google. O tema em `app/theme.ts` altera `.dark` segundo matchMedia, antes do render em `main.tsx`, sem persistência. `packages/ui/src/styles/globals.css` define tokens, color-scheme e movimento reduzido. O CSS global usa Inter/system-ui; não há Hanken Grotesk local nesta inspeção.

Foram conferidos dashboard, Pomodoro, módulos do perfil, flashcards/revisões/IA, roadmaps e progresso, além das specs principais e deltas concluídas relevantes. O catálogo de módulos ativáveis contém tarefas, matérias, flashcards e IA; Pomodoro não é um módulo desativável nesse catálogo. Perfil exige ao menos um módulo de estudo. Pomodoro usa blocos de 25 minutos; revisões têm De novo, Difícil, Bom e Fácil; conquistas têm catálogo fixo e não indicam domínio acadêmico.

Conflitos documentais: `public-landing` exige Tecnologias, carrossel e acesso provisório, enquanto `user-authentication` já descreve acesso real. `application-theme` está apenas na mudança concluída não arquivada `update-application-theme`; seu requisito de seguir sempre o sistema precisa ganhar precedência da escolha manual. Esta proposta não sincroniza nem arquiva outras mudanças. Na futura sincronização, usar esta versão consolidada do tema; se a capacidade já tiver sido sincronizada, converter operações ADDED em MODIFIED dos requisitos correspondentes sem duplicar a capacidade. O Purpose antigo da landing será corrigido nessa etapa separada; os deltas desta proposta substituem os requisitos obsoletos.

## Goals / Non-Goals

**Goals:** fidelidade de composição e ritmo, conteúdo factual, uma estrutura responsiva e semântica nos dois temas; extensão mínima do mecanismo global de tema e modo inicial de acesso.

**Non-Goals:** recriar HTML exportado, mudar páginas internas ou tokens globais para imitar o Stitch, executar funcionalidades nas prévias, alterar domínio/API/banco, introduzir preço/plano, notificações, políticas legais ou biblioteca de animação.

## Decisions

### 1. Uma estrutura para quatro referências

O desktop claro orienta a composição: header translúcido, hero em duas colunas, Como funciona em três cards, quatro linhas alternadas texto/prévia, painel de IA, personalização, CTA e rodapé. O escuro orienta contraste, superfícies e densidade das prévias; não muda hero para outro DOM centralizado. Mobile orienta título, CTAs largos, espaçamento e empilhamento, sem eliminar as prévias pedidas. Manter texto antes da prévia no DOM; alternância desktop apenas visual, sem afetar leitura/foco.

| Referência | Preservar | Adaptação deliberada |
| --- | --- | --- |
| Desktop claro | Hero lateral, espaços amplos, roadmaps/Pomodoro/cards/gráfico, IA com rascunho, personalização | Remover faixa de plano gratuito e avatar público; corrigir promessas e rodapé |
| Desktop escuro | Superfícies profundas, gráfico/tempo/sequência, contraste azul | Mesma composição do claro; não oferecer 50 min ou 8 medalhas inexistentes |
| Mobile claro | Header compacto, texto e CTAs empilhados, três passos e quatro recursos | Trocar fotografia por prévia compacta do produto; manter prévias menores nos blocos |
| Mobile escuro | Mesma hierarquia mobile com superfícies escuras | Remover barra inferior de cursos/perfil, traduções inglesas e conta fictícia |

Container máximo 1280 px; gutters 16 px mobile, 24 px tablet e 32 px desktop. Começar em coluna única; 768 px permite três passos quando legíveis; 1024 px habilita hero/linhas em duas colunas e navegação completa. Ajustar quebra antecipadamente se conteúdo não couber. Seções com ritmo amplo (aproximadamente 64–96 px desktop, 40–64 px mobile), cards 16–24 px de raio. Título fluido próximo de 36/44 px mobile e 48/56 px desktop conforme DESIGN. Usar fonte atual com escala/tracking locais: carregar fonte remota do export foi descartado para evitar dependência de rede e alteração tipográfica interna.

Header em mobile mantém marca, tema e menu; Entrar e Criar conta ficam no menu, também disponíveis no hero e CTA final. Área de toque alvo 44 px. Sem barra inferior. Navegação real: `#como-funciona`, `#funcionalidades`, `#ia-opcional`, `#personalizacao`; footer reutiliza âncoras, `/acesso?mode=login`, `/acesso?mode=register` e topo. Sem Termos, Contato ou Ajuda sem destinos fornecidos. Marca permanece EduTrack; sem razão social ou copyright inventados. Tecnologias e grade/carrossel antigos saem desta composição.

### 2. Conteúdo e prévias factuais

Hero: “Organize seus estudos. Encontre seu ritmo.”; apoio: “Reúna tarefas, matérias, sessões de foco e revisões em um só lugar para acompanhar sua evolução.” CTAs Criar conta e Conhecer os recursos. Como funciona: Organize, Estude, Revise, sem promessa de maestria ou memorização garantida.

| Export | Conteúdo previsto e fundamento |
| --- | --- |
| Roadmaps bloqueados por fases; subtarefas hierárquicas/prioridade; cronogramas semanais de carga | Tarefas com prazos, subtarefas e progresso; matérias com planos/roadmaps editáveis; rotinas recorrentes. Sem bloqueio sequencial, hierarquia multinível ou carga semanal prometida |
| Pomodoro 25/50 min, pausas automáticas/configuráveis, avisos sonoros | Blocos de foco de 25 minutos, pausar/retomar, concluir e consultar histórico, conforme PomodoroPage. Representar pausas como controle da sessão, sem vender ciclo automático 25/5 |
| Retenção 91%, instante antes do esquecimento, fórmulas/renderização rica | Baralhos manuais, importação CSV/TSV e fila de revisão com autoavaliação De novo/Difícil/Bom/Fácil. Remover curva de probabilidade, garantia e recursos de formatação não comprovados |
| Congelamento da sequência, exportação de relatório, medalhas por domínio | Tempo de estudo, dias ativos, sequências e conquistas por critérios existentes. Exemplificar Primeiro dia ou Foco consistente, sem congelamento/exportação |
| IA sem alucinações, dados estritamente privados, automação infalível | Rascunhos de roadmaps e flashcards a partir de textos; revisar/editar/confirmar, opção de desativar e fluxos manuais preservados; disponibilidade depende da configuração do serviço |
| Desativar Pomodoro, notificações/lembretes e perfil acadêmico | Ativar tarefas, matérias, flashcards e IA; preservar ao menos um módulo de estudo; fuso de estudo para dias ativos/analytics. Sem lembretes nem formulário acadêmico fictício |
| Gratuito/ilimitado, zero anúncios, sincronização instantânea, milhares de alunos, criar em 2 min, privacidade garantida | Remover preços/limites, números de público e garantias não fornecidos; convite simples para criar conta |

Prévia do hero: tarefas, progresso de matéria, contador fixo de foco e revisões; nos blocos: roadmap editável, sessão de 25 min com histórico, cartão de revisão, gráfico semanal com sequência/conquista existente. IA mostra rascunho revisável; personalização mostra os módulos reais e tema. Fixtures locais à landing, consistentes entre temas, com legenda visível “Exemplo ilustrativo — dados demonstrativos” em cada prévia. Não importar páginas conectadas, providers de sessão ou clientes de API. Controles desenhados dentro das prévias são ilustrações sem tabindex/semântica de botão; nenhum botão falso de Pausar/Salvar. Fornecer resumo textual acessível para gráficos; decoração escondida de tecnologias assistivas. Não reutilizar fotos remotas dos exports.

### 3. Componentes e substituição do carrossel

`PublicLanding` compõe header, hero, passos, `FeatureSection` e `ProductPreview`, IA, personalização, CTA e footer dentro de `features/landing`. Extrair apenas componentes efetivamente repetidos; usar Button, Card, Badge, Progress e Sheet de `packages/ui` e lucide existentes. CSS sob `.landing-page`/classes específicas, inclusive estilos de portal do menu com classe dedicada. Pacotes não importam apps. Remover FeatureCarousel, testes de autoplay e assets exclusivamente usados por ele após checar referências; substituir por testes dos blocos e critérios visuais. Manter carrossel como alternativa foi descartado porque não aparece na composição solicitada e adiciona movimento/controles desnecessários.

### 4. Acesso mínimo e seguro

Usar `/acesso?mode=login` e `/acesso?mode=register`. Reconhecer estritamente esses valores; ausente/inválido inicia login. Inicializar o estado do formulário com o parâmetro e observar mudanças de search por popstate na mesma rota, sem reset em renders comuns. Troca de modo por URL atualiza somente mode, limpa erro específico e preserva returnTo e parâmetros existentes via URLSearchParams; tabs continuam funcionais. Não alterar allowlist, validadores, localAccess, Google, confirmação, recuperação ou proteção de rotas. `returnTo` continua independente de mode, inclusive quando inválido. Cadastro pendente continua em `/confirmar-email`; não adicionar persistência de senha, sessão ou redirecionamento novo. Links privados legados sem mode continuam em login. Não criar `/login` ou `/cadastro`.

### 5. Tema: um mecanismo global com override local

Estender `app/theme.ts` como única fonte da preferência. Estado: escolha light/dark validada em `localStorage` (chave específica `edutrack.theme`), senão sistema, senão light. Toggle acessível no header informa tema ativo e ação seguinte por nome/aria-pressed, operável por teclado também em mobile. Primeiro clique fixa o tema oposto ao efetivo; não é necessário novo controle de Sistema nesta mudança. Sem escolha salva, mudanças do SO continuam acompanhadas; escolha manual vence mudanças do SO. Observar storage para sincronizar abas; remoção da chave volta a seguir o sistema. Valores inválidos são ignorados. Leitura/escrita sob try/catch; falha de gravação mantém escolha em memória durante navegação SPA, e nova carga volta ao sistema se não puder ler. Sem backend/cookie/preferência de perfil.

Inicialização antes da pintura: pequeno bootstrap próprio no head aplica a classe usando a mesma chave, validação e precedência, com try/catch; não reutilizar scripts do export nem configurar CDN. A inicialização principal adota o resultado e instala listeners com limpeza/HMR. CSS color-scheme é coerente com `.dark` para inputs/selects/scrollbars. Verificar reload sob CPU/rede limitados em navegador real; render antes da escolha é inaceitável. Não remountar App ao trocar tema; foco, formulários, overlays, rota e operações permanecem. Bootstrap próprio foi escolhido frente à execução apenas em main.tsx, que pode ocorrer depois da pintura inicial; testar equivalência evita divergência das duas etapas.

Mapeamento sem nova paleta global:

| Stitch / Clear Horizon | Token existente / adaptação |
| --- | --- |
| surface/background #f6faff e canvas #f8f9fa | --background (#f8f9fa / #212529) |
| on-surface #141d23 / #212529 | --foreground (#212529 / #f8f9fa) |
| on-surface-variant #404850 / #495057 | --muted-foreground (#495057 / #adb5bd) |
| primary #005d90 / #0077b6, títulos #023e8a | --primary (#023e8a / #48cae4), --primary-foreground |
| Wash #caf0f8 e containers azulados | --accent/--accent-foreground; misturas locais com --background |
| Superfície branca e cards escuros | --card/--card-foreground; se necessário --landing-preview-surface local, derivado de --background/--foreground para elevação |
| Outline #bfc7d1 / #ced4da | --border; --ring para foco |
| Sucesso, erro, gráficos | --success, --destructive, --chart-1/2/3 com texto/legenda |

Não copiar todos os tokens Material do export. Ajustes em blends, shadows e raios são locais à landing, com contraste medido. A mudança de tema selecionado entre rotas é intencional; a aparência das páginas internas em cada tema específico deve permanecer igual. Tokens globais não serão recalibrados para fidelidade literal de hex.

### 6. Interações progressivas

Âncoras nativas com scroll-margin-top compensando header e folga de foco; smooth scrolling local, sem scroll hijacking. Entradas discretas de 8–12 px e opacidade, 180–300 ms, IntersectionObserver uma vez por elemento. Conteúdo visível por padrão; falha/ausência do observer preserva tudo. Elementos focados tornam-se visíveis imediatamente. Hero move no máximo aproximadamente 6 px conforme ponteiro apenas em `(hover: hover) and (pointer: fine)`, com requestAnimationFrame coalescendo eventos e CSS vars via ref, sem setState em pointermove e sem loop permanente. Cancelar frame e resetar no pointerleave, mudança de preferência e unmount. Não mover texto/CTAs/foco.

Reduced-motion elimina parallax/reveal/transforms decorativos e smooth scroll; mudança em tempo real também aplica. Touch/coarse mantém composição estática e funções completas. Hover/focus-visible reforçam affordance em links/botões; cards ilustrativos não ganham comportamento de ação nem entram no Tab. Sem conteúdo condicionado à animação ou novos timers de autoplay.

## Risks / Trade-offs

- [Diferenças reais entre exports] → priorizar estrutura clara e mobile sem duplicação por tema; registrar desvios nas capturas.
- [Tokens existentes diferem dos hex do Stitch] → fidelidade de hierarquia/azul/espaço com contraste, ajustes locais; preservar paleta interna.
- [Mudanças concluídas ainda não sincronizadas] → deltas baseados no inventário atual e nota de reconciliação para futura sync; não editar/arquivar mudanças alheias agora.
- [Bootstrap duplicar lógica] → testar precedência e exceções de storage em ambas etapas e verificar primeira pintura.
- [Prévias parecem ações reais] → legendas sempre visíveis e controles apenas ilustrados; nenhuma chamada de rede.
- [Header/visual overflow em 320 px] → menu compacto, min-width:0, wrap e dimensionamento responsivo de gráficos, sem ocultar conteúdo essencial.

## Migration Plan

Apply: registrar estado inicial Git, implementar somente frontend e testes, atualizar metadados públicos obsoletos e validar com API desconectada. Comparar claro/escuro desktop/mobile com as quatro imagens e testar 320, 375, 768, 1024 e 1440 px em ambos os temas, incluindo menu aberto, foco e controles nativos. Registrar evidências, divergências justificadas e contraste 4,5:1 texto normal, 3:1 texto grande/controles/foco. Verificar internamente `/acesso`, `/app`, `/conta` e `/status` por tema para regressão visual.

Executar pnpm lint, typecheck, test e build; testes que usam banco exigem MySQL real em banco isolado, sem limpar banco de usuário. Finalizar tasks, revisar staged somente da mudança e git diff --cached --check; exatamente um commit `[update] atualizar landing pública a partir do Stitch`, informando hash/arquivos. Nenhum commit de conclusão se apply falhar ou pausar. Deploy, push, tags, sync e archive fora desta etapa. Rollback posterior por reversão do commit; chave de tema pode permanecer sem afetar versão anterior que não a lê.
