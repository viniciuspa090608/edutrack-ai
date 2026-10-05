# Design

## Context

Ver `proposal.md` para motivação e a delta `authenticated-shell-visual-experience` para critérios observáveis. Inspeção somente de leitura: `PrivatePage.tsx`, `App.tsx`, `auth-api.ts`, `module-catalog.ts`, `ProfilePage.tsx`, `profile-api.ts`, `app/theme.ts`, CSS auth/account/main, tokens de UI, Avatar/Sheet, testes Auth/Profile/App/tema e specs relacionadas.

| Área | Implementação observada | Limite da mudança |
| --- | --- | --- |
| Shell | `PrivatePage` contém sessão, preferências, `leave`, vínculo Google e composição das páginas; header com marca, todos os links e Sair | Alterar composição externa; manter gates, handlers e branches internos |
| Rotas | `App` usa pathname, `popstate` e chaves de `PrivatePage`; links são anchors e `navigate` usa history | Não introduzir router nem alterar semântica de links/remontagem |
| Destinos fixos | `/app`, `/conta`, `/app/pomodoro`, `/app/rotinas`, `/app/estatisticas`, `/app/progresso` | Continuam disponíveis independentemente dos três toggles |
| Destinos condicionais | `availableModules(prefs)` exige `delivered` e preferência para `/app/tarefas`, `/app/materias`, `/app/flashcards` | IA não é destino; não criar toggle ou condição para destinos fixos |
| Preferências | Refresh por focus, visibilitychange e `edutrack:preferences`; `prefs=null` tanto inicialmente como após falha | Não criar máquina de estados ou fallback que habilite módulos |
| Sessão | `checking` bloqueia shell; erro oferece retry; 401/EMAIL_VERIFICATION_REQUIRED redireciona | Preservar sem exposição privada antecipada |
| Foto | `AuthUser` não tem `avatarVersion`; `/profile` tem versão; `profile-api.avatar()` obtém Blob autenticado | Usar API existente somente para apresentação no header |
| Conta | Foto/preview e object URL são locais a `ProfilePage`; `onName` só publica nome salvo; não há callback de foto | Acrescentar notificação local de identidade confirmada, sem mudar mutações |
| Tema | `useTheme`/`setTheme`, `edutrack.theme`, `.dark`, sistema e storage; Conta já usa o mesmo mecanismo | Nenhuma preferência de tema no backend |
| Logout | `leave` compartilha `busy` com vínculo Google; await logout, depois `/acesso`, erro/retry sem confirmação | Mesmo handler para sidebar, Mais e Encerrar sessão na Conta |
| UI | Button, Avatar e Sheet disponíveis; ícones lucide; não há Tooltip/dropdown/popover compartilhado no inventário | Usar labels visíveis, sem criar primitive por antecipação |
| CSS | Auth define `.private-*`; Conta sobrescreve largura do shell para 1180 px e possui sidebar interna própria | Ajustar só seletores externos; manter sidebar/âncoras internas da Conta |

Os destinos solicitados foram confirmados. `moduleAtPath` aceita prefixos descendentes, mas isso não autoriza criar páginas novas. `allowedReturnTo` e o cálculo de retorno da sessão não incluem Flashcards; preservá-los sem inserir correção funcional nesta mudança. O plano não promete restaurar essa rota após login além do comportamento atual.

Specs principais de autenticação, runtime e qualidade foram lidas. Mudanças concluídas ainda não arquivadas contêm `application-theme` (tema e landing), `user-profile`/`module-preferences` (perfil e módulos) e `account-profile-visual-experience` (Conta). O design antigo de tema descreve apenas sistema, mas o código e a delta posterior da landing/Conta já incluem escolha manual local: estes são a base vigente. A solicitação de distinguir loading/falha de preferências encontra limitação real: ambos usam `null`; não corrigir isso neste escopo, nem transformar indisponibilidade em vazio ou módulo desativado.

Referência inspecionada: `C:/Users/vinic/Downloads/dashboard_edutrack_ai.zip`, entradas `stitch_edutrack_ai_2.0/student_dashboard_desktop_claro`, `student_dashboard_desktop_escuro`, `edutrack_ai_student_dashboard` e `edutrack_ai_student_dashboard_mobile_escuro`, respectivos PNGs e trechos de HTML do shell. Não foi fornecido ZIP específico de shell; estas referências existentes são a base visual assumida. Desktop mostra coluna lateral, itens com ícones e destaque preenchido, superfícies suaves e separadores; mobile mostra header compacto e navegação fixa inferior. Mobile tem logo quebrado, labels ingleses e avatar fictício. Busca global, notificações, plano Pro, curso/período, destinos Study e estatísticas fictícias não possuem equivalência para incorporar. Não executar scripts, importar CDN/fontes ou copiar o dashboard interno.

Estado Git observado durante propose: alterações preexistentes em `AccessPage.tsx`, `styles/auth.css`, assets de auth e mudança `refine-auth-desktop-layout`. Preservadas. O futuro apply deverá obter novo baseline; particularmente CSS auth exige staging por hunks se a sobreposição permanecer.

## Goals / Non-Goals

**Goals:** isolar a apresentação do shell, compartilhar a definição real de destinos entre duas composições responsivas e atualizar sua identidade confirmada sem expor drafts.

**Non-Goals:** alterar estado global, roteamento, APIs, contratos, regras de disponibilidade, chamadas de logout, upload/editor de perfil, páginas internas ou autenticação pública. Não criar módulos vazios nem componentes destinados a uso futuro.

## Decisions

### 1. Composição local e definição única de navegação

Manter `PrivatePage` responsável pelos mesmos estados/handlers/branches; extrair apenas componentes locais de shell em `features/auth` quando reduzirem a duplicação real. Usar descritores de apresentação com href, label e ícone: destinos fixos mais resultado atual de `availableModules`. Não duplicar catálogo ou assumir todos os módulos habilitados quando `prefs` faltar. A ordem desktop será Início, Tarefas, Matérias, Flashcards (os habilitados), Pomodoro, Rotinas, Estatísticas, Progresso e Conta; Sair separado.

Estado ativo: `/app` exige igualdade exata; módulos usam fronteira de segmento já reconhecida por `moduleAtPath`; destinos fixos usam suas rotas reais. Query/hash não alteram destino; `/conta#...` permanece Conta. Links correntes usam `aria-current="page"`. Mais é botão com `aria-expanded`, identificação do painel e comunicação acessível de que contém a página atual; não usar href fictício ou `aria-current="page"` como se Mais fosse destino. Não ampliar roteamento de subfluxos.

Alternativas descartadas: duplicar listas de destinos e condições nos layouts, adotar biblioteca de roteamento ou navegação genérica em `packages/ui`; aumentariam divergência ou escopo.

### 2. Breakpoint e geometria externa

Adotar desktop em `min-width: 1024px`, padrão já usado na landing. Abaixo disso usar a barra inferior, inclusive tablet de 768 px, preservando largura útil para módulos e para a Conta com layout próprio. Breakpoints existentes variam 800–1000 px; escolher 1024 reduz compressão ao adicionar sidebar e não altera esses breakpoints internos.

Header alvo de 64 px, logo/logotipo à esquerda e dois controles de pelo menos 44 px à direita, com gutters compatíveis com 320 px. Marca em texto/ícone local já disponível, sem logo remoto ou rebranding. Usar fluxo/grid externo e header sticky com espaço próprio; sidebar em coluna aproximadamente 224 px, `min-width:0` no conteúdo e altura útil baseada em `100dvh` menos header. Navegação lateral com `min-height:0` e `overflow-y:auto`; região Sair separada e alcançável, permitindo scroll do conjunto em alturas extremas. Não fixar largura mínima desktop no conteúdo.

Barra inferior fixa alvo de 64 px mais `env(safe-area-inset-bottom, 0px)`, colunas calculadas pelos itens efetivamente visíveis (Início + módulos ativos + Mais). Reservar no wrapper de conteúdo o mesmo espaço e margem de segurança; usar scroll-padding/scroll-margin para foco e âncoras sob header/barra. Preservar limites/gutters específicos de conteúdo de cada área, inclusive Conta, ajustando somente a área disponível. Não tocar cards/grids internos nem resolver sua responsividade nesta mudança.

Layouts ocultos usam `display:none` ou desmontagem correspondente para não receber Tab. Ao atravessar 1024 px com Mais aberto, fechar Sheet controlado e liberar portal/foco/scroll; levar foco a controle visível equivalente quando o acionador desaparecer. Não introduzir listener global de navegação ou mudança de sessão.

Alternativas descartadas: sidebar tablet estreita, todas as rotas em uma linha mobile ou sidebar fixa sem espaço reservado; comprimem páginas ou encobrem controles.

### 3. Mais como Sheet existente

Usar `Sheet` com `side="bottom"`, título Mais e descrição acessíveis, botão de fechar com nome em português, links reais e Sair separado. Reutilizar o fechamento com `SheetClose` em links; limitar altura pelo viewport dinâmico e disponibilizar scroll do conteúdo em paisagem/pouca altura. Escape, foco inicial, contenção e restauração seguem Radix. Estados ativos dentro do painel correspondem aos mesmos descritores usados no desktop. Conta continua acessível também pelo avatar, redundância intencional solicitada.

Logout chama apenas `leave`: fechar o painel pode revelar o alerta já presente no conteúdo; garantir sua visibilidade e anúncio sem criar erro paralelo. Não oferecer confirmação obrigatória. Preservar `busy` compartilhado com ações da Conta e o bloqueio da saída enquanto pendente.

Alternativa descartada: criar dropdown/popover/Tooltip novos quando Sheet já atende teclado, portal e foco. Não mudar o Sheet global para necessidades locais; overrides de fechamento/movimento reduzido pertencem ao uso do shell.

### 4. Identidade confirmada separada do preview

O header atualmente não possui avatar e `AuthUser` não contém versão de foto. Após sessão válida, obter perfil com `profile-api.profile()` e Blob pelo helper `avatar()` quando `avatarVersion` existir. É uma leitura adicional necessária para apresentar recurso já existente, não novo fluxo de perfil. Manter a identidade de apresentação no componente local do avatar/shell; não condicionar conteúdo ou autenticação ao sucesso desta leitura. Em falha, usar identidade confirmada disponível e fallback, sem apresentar falha como remoção confirmada.

Reutilizar `Avatar`, `AvatarImage`, `AvatarFallback`, inicial maiúscula como no perfil e, para nome ausente, `UserRound` com link acessível Abrir conta. Imagem circular com `object-fit:cover`. Blob confirmado recebe object URL revogada em substituição/desmontagem; descartar respostas obsoletas quando conta/versão mudar. Falha de imagem usa fallback Radix e não bloqueia acesso à Conta.

Adicionar somente callback opcional de foto confirmada à composição `ProfilePage` → shell, acionado após respostas reais de upload/remoção, com versão confirmada e sem transmitir `selected`/preview. Reaproveitar `onName` após save real para atualizar a inicial; a notificação de foto provoca refresh pelo helper existente. Não mudar requests, ordem de mutação/validação nem feedback do editor; efeito do header não deve lançar erros para o formulário. Em remoção confirmada, limpar imagem imediatamente; em versão substituída, não reutilizar bytes antigos como nova foto. No carregamento inicial da Conta, usar apenas perfil retornado pelo servidor, nunca o estado editável de nome ou imagem. Sem cache global novo; nova montagem lê novamente o perfil existente.

Alternativas descartadas: estender `AuthUser`/`/auth/me`, usar foto Google fictícia ou compartilhar `image` de `ProfilePage`, pois alterariam contratos ou vazariam preview não salvo.

### 5. Tema e acabamento com tokens existentes

Botão icon-only Button usa `useTheme` e `setTheme`, Sun/Moon lucide decorativos e nome acessível indicando a próxima ação. Não criar persistência: `edutrack.theme` é local, segue sistema quando não há escolha válida e sincroniza storage; a Conta usa o mesmo store, sem preferência de servidor. Não modificar bootstrap, providers nem keys de páginas durante alternância.

Manter Inter e tokens `background`, `foreground`, `card`, `popover`, `muted-foreground`, `primary`, `accent`, `border`, `ring`, `destructive` e `overlay`, com pares foreground corretos. Inspiração Stitch: coluna com separador, espaçamento regular e item ativo com superfície destacada; hover/foco distintos e texto/ícone adicional à cor. Validar contraste 4,5:1 em texto normal e 3:1 em texto grande/controles/foco conforme aplicável. Não copiar paleta literal, Hanken Grotesk, fontes externas ou ícones Material Symbols. CSS escopado ao shell; rever overrides `.account-shell .private-*` sem editar `.account-sidebar` ou elementos internos. Reduced motion deve cobrir o Sheet portaled que não é descendente de `.private-page`.

Alternativa descartada: trocar tokens globais ou redefinir estilos globais de Button/Avatar; afetaria módulos e páginas públicas.

## Risks / Trade-offs

- [Foto requer leituras que o header não fazia] → somente depois da sessão, helper existente, cancelamento lógico de respostas obsoletas e fallback sem bloquear módulos.
- [Preview confundido com imagem salva] → notificação exclusiva após confirmação e fetch independente; testar draft, falha, remoção e versão concorrente.
- [Loading e erro de preferências têm o mesmo estado atual] → preservar lógica e apresentação existentes; não inventar distinção nem habilitar módulo por ausência de dados. Eventual correção pertence a outra mudança.
- [Retorno autenticado não inclui Flashcards] → registrar baseline e preservar allowlist; não corrigir autenticação em mudança visual.
- [Conta contém sidebar interna e overrides externos] → seletores locais e preservação de âncoras/drafts; verificar composição sem redesenhar Conta.
- [Sheet aberto durante resize mantém scroll/foco capturados] → fechamento controlado no breakpoint, cleanup e verificação por teclado.
- [Pouca altura, safe area e portal encobrem mensagens] → alturas dinâmicas, scroll interno, espaço reservado e alerta fora de Mais visível.
- [Sobreposição com alterações públicas preexistentes em auth.css] → registrar baseline no apply, editar/stage somente hunks do shell e nunca sobrescrever a outra mudança.

## Migration Plan

Não há migração de dados, API ou configuração. Aplicar apenas composição/estilos de shell e integração mínima de identidade confirmada. Antes de editar, registrar status/diff/HEAD novamente e preservar mudanças externas.

Validação futura: testes de UI diretamente relacionados em Auth/Profile/App/tema, acrescentando casos do shell onde necessário. Cobrir destinos desktop/mobile, ativo/Mais, módulos habilitados/desabilitados e prefs indisponíveis, foto/fallback/preview/save/erro, Conta, tema/persistência e ausência de remontagem, logout pendente/sucesso/erro/retry e gates de sessão. Não criar ou executar suítes extras de backend por causa do visual.

Inspeção no navegador em 320, 375, 768, 1023, 1024 e 1440 px; desktop 1024×480 e mobile paisagem/pouca altura; ambos os temas, teclado, reduced motion, safe area, último botão/mensagem da página, zoom e resize com Mais aberto. Conferir acesso direto, reload, voltar/avançar, query/hash e layout interno preservado em todos os nove destinos. Testes DOM não substituem validação real de geometria e foco.

Executar exclusivamente os checks adicionais obrigatórios `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` antes de concluir. O `pnpm test` da raiz inclui API por convenção existente; isso é a exceção obrigatória, não justificativa para ampliar testes backend. Se houver banco, usar MySQL real isolado; registrar falhas e não mascarar nem concluir apply com checks obrigatórios falhos.

Após tarefas e verificações aprovadas, revisar diff final/staged, executar `git diff --cached --check` e criar exatamente um commit `[update] atualizar shell autenticado responsivo` com apenas arquivos/hunks desta mudança e `tasks.md` final. Sem commit vazio, tag, push ou archive automático. Confirmar hash/arquivos. Reversão limitada ao commit da mudança preserva alterações externas. Nesta proposta não executar nenhum desses testes ou commits.
