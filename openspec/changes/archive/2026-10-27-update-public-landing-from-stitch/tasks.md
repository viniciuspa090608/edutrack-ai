# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD, git status --short e diffs staged/unstaged antes de editar; identificar alterações preexistentes e entregar registro que permita preservar esses arquivos/hunks.
- [x] 1.2 Confirmar inventário atual de specs e disponibilidade das quatro referências no ZIP/pasta; se application-theme já foi sincronizada, ajustar os deltas desta mudança para MODIFIED preservando os requisitos consolidados, sem alterar/arquivar outras mudanças. Verificar com openspec validate update-public-landing-from-stitch --strict e registrar a dependência documental.

## 2. Tema e acesso

- [x] 2.1 Estender o mecanismo global em app/theme.ts para escolha light/dark local, precedência manual > sistema > claro, eventos do sistema/storage e memória em falha de storage; verificar testes para valores inválidos, exceções de leitura/escrita, remoção da chave, sincronização entre abas e limpeza dos listeners.
- [x] 2.2 Implementar bootstrap próprio anterior à pintura, coerente com inicialização principal e color-scheme, sem scripts do export/CDN; verificar equivalência de precedência e primeira pintura em recarga/acesso direto com rede/CPU limitadas nos dois temas.
- [x] 2.3 Adicionar controle acessível de tema consumindo o mecanismo global, para header desktop/mobile; verificar teclado, nome/estado acessível e persistência entre landing, /acesso e páginas internas sem perda de foco/formulário/overlay.
- [x] 2.4 Adaptar minimamente AccessPage para mode=login/register com fallback login e mudanças de search/popstate na mesma rota; verificar acesso direto, recarga, histórico e tabs sem reset em renders comuns, preservando returnTo e parâmetros existentes.
- [x] 2.5 Acrescentar testes de acesso para cadastro pendente, mode inválido, retorno permitido/externo/malformado e Google, mantendo testes de autenticação existentes; verificar que allowlist, confirmação, validação de senha e proteção de rotas não mudaram.

## 3. Composição e conteúdo da landing

- [x] 3.1 Construir header fixo com marca, âncoras, Entrar/Criar conta e menu mobile usando componentes existentes; verificar destinos, fechamento por seleção/Escape, retorno de foco, estado aria, breakpoint e seletor sempre disponível em 320 px.
- [x] 3.2 Criar hero com título aprovado, CTAs e dashboard estático identificado como exemplo; verificar API/sessão não consultadas, dados legíveis e ausência de botões ilustrativos no Tab.
- [x] 3.3 Construir Como funciona e componentes locais reutilizáveis para blocos alternados/prévias; verificar ordem semântica Organize/Estude/Revise e empilhamento mobile sem duplicar DOM por tema.
- [x] 3.4 Implementar quatro blocos com prévias de roadmap, foco de 25 min, flashcard e gráfico/sequência/conquista; verificar legendas de exemplos e resumos acessíveis, rótulos de revisão e conquista existente conforme matriz de conteúdo do design.
- [x] 3.5 Construir IA opcional e personalização com rascunho revisável, temas e módulos reais; verificar textos de disponibilidade/manual, ao menos um módulo de estudo e ausência de notificações, proteção de sequência ou configurações fictícias.
- [x] 3.6 Construir convite final e rodapé com âncoras/rotas reais e separar todos os CTAs de login/cadastro; verificar todos os href e eliminar razão social, termos/ajuda/contato não fornecidos, barra inferior e avatar público.
- [x] 3.7 Substituir CSS da landing por composição responsiva escopada, mapeando tokens conforme design sem alterar paleta global, tipografia ou aparência interna; verificar que desktop claro/escuro mantém a mesma composição e que os ajustes locais não atingem páginas internas ou outros portais.
- [x] 3.8 Remover FeatureCarousel, testes de autoplay e assets exclusivos após checar referências; substituir cobertura por blocos públicos/links/menu, atualizar título/description obsoletos e verificar ausência de imports/claims de recursos futuros ou acesso provisório.

## 4. Interações progressivas

- [x] 4.1 Aplicar rolagem de âncoras com compensação do header, hover/focus e entrada discreta por viewport com conteúdo visível por padrão; verificar título/foco não encobertos, fallback sem observer e conteúdo imediatamente visível ao receber foco.
- [x] 4.2 Adicionar movimento limitado à composição decorativa do hero por ponteiro preciso/hover, com frames coalescidos e sem setState contínuo; verificar cancelamento/reset no pointerleave/unmount e ausência de loop permanente ou movimento de texto/CTAs.
- [x] 4.3 Integrar prefers-reduced-motion inicial e alterado durante uso para scroll/reveal/parallax e touch sem hover; verificar conteúdo completo e controles utilizáveis sem movimento e sem interceptar scroll.

## 5. Validação integrada

- [x] 5.1 Verificar a landing em navegador com API indisponível e sem sessão, registrando ausência de chamadas da página para API e funcionamento de prévias/âncoras/tema; executar testes de integração de rotas e destinos de todos os CTAs.
- [x] 5.2 Comparar capturas desktop claro/escuro e mobile claro/escuro às quatro screen.png, registrando evidências e desvios deliberados do design; validar ainda 320, 375, 768, 1024 e 1440 px em ambos os temas, menu aberto/fechado e ausência de overflow horizontal.
- [x] 5.3 Verificar teclado, ordem/foco visível, Escape, rótulos do menu/tema, legibilidade de prévias e contraste renderizado de texto/controles/estados nos dois temas; registrar resultados e corrigir falhas antes de concluir.
- [x] 5.4 Verificar primeira pintura, storage indisponível, preferência do SO, escolha manual entre rotas/abas, movimento reduzido e dispositivo sem hover em navegador real; registrar resultados e regressão visual de /acesso, /app, /conta e /status por tema.
- [x] 5.5 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build, registrando resultados; testes de banco usam MySQL real em banco isolado sem limpar banco de usuário ou esconder falhas com mocks. Corrigir falhas antes da conclusão.
- [x] 5.6 Validar coerência final de proposal/design/deltas/tasks com implementação e evidências, executar openspec validate update-public-landing-from-stitch --strict e git diff --check; verificar que alterações de domínio/API/banco não entraram no escopo.

## 6. Commit único de conclusão

- [x] 6.1 Após todas as implementações e verificações aprovadas, finalizar tasks.md e selecionar apenas arquivos/hunks desta mudança, incluindo os artefatos finais; revisar diff staged e executar git diff --cached --check, preservando alterações preexistentes e sem git add .
- [x] 6.2 Criar exatamente um commit `[update] atualizar landing pública a partir do Stitch`, incluindo implementação e tasks.md final; verificar e informar hash e lista de arquivos por git show. Não criar commit vazio, commit de conclusão para apply falho/pausado, tag, push ou arquivamento.
