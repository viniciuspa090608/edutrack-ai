# Design

## Context

Ver motivação em proposal.md. Estado Git inicial limpo. `App.tsx` usa pathname e popstate, mas fornece keys distintas a PrivatePage. Os anchors de AuthenticatedShell não interceptam navegação; `navigate` já fornece history/popstate. PrivatePage.check depende de page e troca todo o shell por loading, mesmo sem mudar usuário. O pathname usado pelos módulos é lido de window, exigindo rerender explícito na navegação.

Animate.css 4.1.1 já é dependência, e main.css define duração de 0,55 s e desativação por movimento reduzido. Dialog e AlertDialog compartilhados usam Radix. Button contém transition-all. Os tokens escuros em packages/ui/src/styles/globals.css começam em background #212529 e card/popover #343a40.

Inventário: TasksPage já abre TaskForm em Dialog, mas cancela sem proteção de dados; SubjectsPage apresenta SubjectForm inline; FlashcardForms contém formulários de baralho e card; RoutinesPage apresenta formulário inline; RoadmapsSection apresenta editor manual inline. Subtarefas são ações contextuais dentro da tarefa; importação, geração IA, revisão, configurações de perfil e plano de estudo não são cadastros equivalentes independentes e conservam seus fluxos. Edição pode compartilhar o mesmo formulário sem exigir sua conversão integral.

Não há favicon fornecido no projeto ou anexo disponível. `index.html` não declara favicon. A mudança aberta refine-auth-desktop-layout toca acesso/CSS de autenticação: preservar seus requisitos e evitar sobrescrever seus artefatos.

## Goals / Non-Goals

**Goals:** manter uma única árvore privada por sessão, compor movimento por contexto de navegação, compartilhar comportamento acessível de modal sem transferir regras de negócio dos módulos.

**Non-Goals:** novo roteador, cache global de páginas, manter todos os módulos montados, alterar contratos/backend/banco, redesenhar identidade ou tema claro, converter todos os fluxos multietapas em modal, gerar um ícone substituto.

## Decisions

1. **Roteamento SPA existente e shell persistente.** Resolver os destinos privados antes de renderizar uma única PrivatePage sem key por rota e passar identidade da rota/conteúdo como props reativas. Separar bootstrap da sessão de seleção do conteúdo: não executar check por mera mudança de page, mantendo gates de entrada e tratamento atual de erros de autenticação. Remontar somente conteúdo que precisa resetar entre destinos. Reutilizar navigate com interceptação restrita a links locais suportados, conservando href, clique modificado, download, target e âncoras. Aplicar também a marca, avatar e atalhos internos relevantes; histórico e parâmetros permanecem funcionais. Alternativa de adicionar router aumenta migração sem necessidade. Não persistir dados de sessão em armazenamento para resolver problema visual.

2. **Estado do shell vive no shell.** Não mover sidebar para dentro de conteúdo com key. Preservar nó e scroll nativos no desktop; conservar expansão que existir, sem introduzir modo colapsado novo. Menu Mais fecha ao selecionar destino e mantém limpeza de foco/scroll ao mudar breakpoint. Atualizar aria-current a partir da rota reativa; navegação leva foco ao título/conteúdo de destino sem deslocar sidebar. Persistência vale durante a sessão SPA, não exige recuperação após reload.

3. **Movimento por evento, não por render.** Registrar origem transitória da navegação pública e consumi-la uma vez no conteúdo de AccessPage; conservar modo cadastro/login e returnTo. Chave/token de transição por destino efetivamente diferente para fadeIn apenas no main. Não animar header, sidebar ou consultas. Usar as classes Animate.css existentes, com duração inicialmente 550 ms, limite explícito de espera derivado da duração e pequena margem. Escutar término/cancelamento apenas no elemento correto, remover listeners/timers no cleanup e concluir imediatamente com movimento reduzido. Não depender exclusivamente de animationend. Acesso direto e alternância de formulários não reproduzem backInLeft.

4. **Logout único e independente da animação.** Ao acionar shell ou Conta, iniciar imediatamente a chamada existente de logout e a saída backOutLeft em paralelo; usar guarda síncrona contra acionamento duplo. A chamada não é abortada por cleanup visual. Em sucesso, impedir novas interações privadas e redirecionar após término/fallback visual limitado; se a resposta demorar, esperar a resposta real. Em falha, remover estado de saída, restaurar opacidade/interação e expor erro acessível para retry. Evento ausente, troca de preferência ou desmontagem não podem aprisionar a operação. O cliente não pode garantir invalidação se o servidor falhar: não simular sucesso. Alternativa de aguardar animação para enviar logout foi descartada porque condicionaria segurança ao CSS.

5. **Tokens escuros e botões compartilhados.** Propor base neutra #101214, sidebar #16191d e superfícies elevadas #1c2025 como ponto inicial de QA; valores finais dependem de medição de contraste renderizado. Ajustar tokens dark e estilos locais que sombreiem tokens, incluindo overlay, campos e estados, sem editar valores light. Manter azul, avisos e erros e validar 4,5:1 para texto normal, 3:1 para texto grande, foco e controles. Substituir transition-all em Button por lista explícita (color, background-color, border-color, box-shadow e opacity se utilizada) e duration 500 ms. Auditar overrides locais e controles equivalentes, inclusive fechar modal, sem atrasar feedback de foco/loading; override reduzido desativa transições.

6. **Composição compartilhada sobre Radix.** Usar Dialog existente como base de um modal de formulário em packages/ui, com título, descrição, área de conteúdo rolável e ações; comportamento reutilizável de confirmação sem dependências de apps. Schemas, payloads, campos e mutações continuam nas features. Estado dirty compara valores editáveis ao snapshot inicial, incluindo seleções e listas. Esc/Cancelar/fechar/outside permitido convergem para uma única intenção de fechamento. Dirty abre AlertDialog; recusar mantém campos e devolve foco ao modal, confirmar fecha. Durante envio, bloquear fechamento e reenvio com guarda síncrona; erro mantém dados; sucesso redefine dirty, fecha, atualiza coleção pelo mecanismo atual e anuncia sucesso fora do modal. Radix fornece trap, inert e retorno de foco, com fallback lógico quando acionador some. Não usar window.confirm como padrão nem reimplementar focus trap. Preservar associações opcionais, preferências de módulos e permissões. Modal com largura limitada à viewport, max-height por altura disponível e rolagem interna; botões alcançáveis a 320 px.

7. **Escopo das conversões.** Adaptar criação de tarefas, matérias, baralhos, cards, rotinas e roadmap manual. Preservar edições que compartilham formulário, importação e IA sem forçar nova composição para suas etapas. A confirmação de descarte cobre tentativas de fechar modal; não acrescentar bloqueio global de saída/logout nem nova confirmação de logout.

8. **Favicon condicional.** Quando recebido, guardar asset local em apps/web/public e declarar rel/icon com tipo correto e caminho resolvido pelo Vite/base. Conferir acesso direto às rotas e build servido. Na ausência, registrar pendência concreta e não adicionar referência fictícia. Essa ausência não impede os outros ajustes, mas impede declarar o favicon entregue.

## Risks / Trade-offs

- [Remover keys sem separar check ainda desmonta shell] → teste de identidade DOM e contagem de bootstrap em navegação, além do teste de link sem reload.
- [Shell persistente retém usuário antigo ou chamadas atrasadas] → limpar na saída/mudança de identidade e ignorar resultados obsoletos; preservar gates e erros de sessão.
- [CSS de acesso ou tema afeta mudança aberta] → revisar refine-auth-desktop-layout e preservar seus critérios de altura, feedback e botão Google branco.
- [Transform de animação muda clipping/posição de overlays] → animar wrapper de conteúdo, manter portais fora dele e conferir overflow/foco no navegador.
- [Dialog dirty e confirmação competem por foco] → testar Esc, Tab, recusa e confirmação com retorno ao elemento correto.
- [Coleção filtrada não mostra registro recém-criado] → preservar filtros/paginação existentes e anunciar sucesso sem inserir item incompatível.
- [Favicon ausente] → manter pendência visível; não marcar a etapa condicional como implementada.

## Migration Plan

Mudança somente frontend, sem migração de banco. Implementar primeiro shell/links e suas regressões, depois movimento, tokens/botões e modais por feature. Validar nos dois temas em 320 px e desktop, pouca altura, teclado, histórico, rede lenta/falha e movimento reduzido. Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build, com MySQL real isolado para testes de banco existentes. No apply, seguir manifesto explícito e sync semântico conforme README, então openspec:finish após checks; sem push. Reversão futura pelo commit final controlado, sem alterar commits publicados nem dados persistidos.

## Open Questions

- Resolvida durante o apply: o usuário forneceu logoTipo.png. O PNG original foi copiado para apps/web/public/favicon.png, com referência %BASE_URL% em index.html e integridade verificada por HTTP nas rotas públicas e privadas.
