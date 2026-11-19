# Tasks

## 1. Navegação e preferências

- [x] 1.1 Registrar branch e estado Git, identificar alterações preexistentes e usar codex/refine-platform-navigation-and-ai-experience se necessário; verificar registro e preservação de master.
- [x] 1.2 Atualizar AuthenticatedShell e module-catalog com ordem, rótulo e Sparkles, removendo IA isolada e mantendo configuração na Conta; verificar ordem desktop/mobile, gates, estados ativos e preferências nos testes pertinentes.

## 2. Conta e Pomodoro

- [x] 2.1 Corrigir offset, altura útil e rolagem da account-sidebar e âncoras; verificar perfil e último item acessíveis em desktop baixo, zoom e 320 px, sem perder drafts ou destaque de seção.
- [x] 2.2 Integrar CTA contextual ao estado reconciliado em DashboardPage/DashboardPomodoro; verificar zero sem sessão, zero com sessão aberta/BETWEEN_BLOCKS, tempo positivo e falha de sincronização, sem criação duplicada ou início automático.

## 3. Assistente de IA

- [x] 3.1 Reorganizar cabeçalho, histórico paginado, aviso persistente, boas-vindas e três sugestões em cards condicionais; verificar dados reais, seleção da conversa e preenchimento editável sem envio ao clicar sugestão.
- [x] 3.2 Aplicar composição responsiva com tokens existentes, histórico mobile recolhível, mensagens roláveis e compositor inferior integrado; verificar 320 px, pouca altura, ambos os temas, textos longos e teclado virtual sem controles encobertos.
- [x] 3.3 Implementar Enter para envio e Shift+Enter para quebra, protegendo composição IME e bloqueios atuais; verificar limite, texto vazio, envio pendente e foco por teclado.
- [x] 3.4 Preservar e verificar carregamento, vazio, erros, retry sem duplicação, paginação de mensagens, prévias e confirmação idempotente nos testes do assistente e em uma conversa longa.

## 4. Validação e conclusão local

- [x] 4.1 Revisar integração visual por teclado nos dois temas, desktop, 320 px, zoom e movimento reduzido; registrar evidências de sidebar, Conta, Pomodoro e Assistente sem cortes ou overflow.
- [x] 4.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build e registrar resultados reais; testes de banco, quando executados, devem usar MySQL real isolado sem mocks de configuração.
- [x] 4.3 Revisar deltas e preparar snapshots por merge semântico e manifesto .openspec-local/refine-platform-navigation-and-ai-experience-manifest.json com arquivos próprios explícitos conforme README; verificar cenários e requisitos posteriores preservados, tasks final e diff staged com git diff --cached --check.
- [x] 4.4 Com todas as tarefas de implementação e verificações aprovadas, executar pnpm openspec:finish --change refine-platform-navigation-and-ai-experience --manifest .openspec-local/refine-platform-navigation-and-ai-experience-manifest.json --message "[update] melhorar navegação e experiência do assistente de IA"; verificar journal, sync, archive, hash final e arquivos do commit único sem push, retomando journal se houver falha posterior ao commit.
