# Evidências de validação

## Escopo e estado inicial

- Branch inicial: master, base bda2a3557b4e4e3a68b9b5e332a2dfd5aa55adeb.
- Única alteração preexistente: diretório ainda não versionado da própria proposta. Nenhum código de implementação preexistente modificado.
- Branch de trabalho: codex/refine-platform-navigation-and-ai-experience.
- Normalização local de finais de linha em 61 arquivos detectados pelo Prettier: verificado que não havia diferenças de conteúdo; esses arquivos externos ao escopo não geraram diff Git nem entram no manifesto.

## Comportamentos revisados

- Dashboard real da conta demonstrativa: 00:00 com Iniciar pomodoro, sem criação automática ou duplicada.
- Sidebar: Início, Disciplinas, Tarefas, Flashcards, Pomodoro, Rotinas, Relatório, Assistente de IA e Conta; estrelas no assistente e ausência de IA isolada.
- Conta em desktop 1440 × 600: cabeçalho termina em y=64, coluna começa em y=80, altura útil de 504 px e conteúdo de 675 px alcançável por rolagem interna; Preferências e último item Integrações acessíveis por teclado, sem overflow horizontal.
- Preferências: Disciplinas antes de Tarefas; demais controles e persistência mantidos.
- Assistente em 1440 × 900 e 320 × 740, claro e escuro: cabeçalho, aviso, cards e compositor legíveis, histórico recolhível em mobile, sem overflow horizontal.
- Área mobile reduzida a 320 × 480: mensagem e botão Enviar alcançáveis acima da barra inferior. Sugestão preenche texto e Shift+Enter insere nova linha sem enviar.
- Reflow em 320 px cobre a largura lógica equivalente a ampliação de uma viewport desktop de 1280 px; os atalhos de zoom do navegador embutido não alteraram a escala. Movimento reduzido preservado pelo shell existente, sem novas animações no assistente ou na coluna da Conta.
- Testes pertinentes: sessão zerada confirmada, pausa e limite com falha de sincronização, histórico e mensagens paginados, retry com identificador original, texto extenso com prévia e confirmação preservada, Shift+Enter, composição IME e bloqueio de envio duplicado.
- Evidência visual local: .openspec-local/refine-platform-assistant-desktop.jpg. Nenhuma chamada manual ao provedor foi necessária para a inspeção visual; testes de integração usam MySQL real isolado.

## Checks

- pnpm lint: aprovado.
- pnpm typecheck: aprovado.
- pnpm build: aprovado; mantém o aviso de tamanho de chunk da aplicação.
- pnpm test: aprovado; 22 testes de workflow, 42 de contratos, 309 de API e 316 de web (689 no total). Logs locais preservados.
- 65 testes focados das áreas alteradas aprovados.
- openspec validate refine-platform-navigation-and-ai-experience --strict: aprovado.

## Revisão de sync

Cinco snapshots locais revisados, com todos os cenários anteriores preservados e somente mudanças previstas: Conta (32 → 34 cenários), Assistente (11 → 16), shell (26 → 27), dashboard (38 → 40), preferências (18 → 18). Requisitos posteriores de relatório, continuidade, segurança, retenção, idempotência e módulos independentes preservados. Corrigida a descrição do cenário de Pomodoro disponível para expressar o CTA contextual sem conflito com o zero.

Manifesto explícito em .openspec-local/refine-platform-navigation-and-ai-experience-manifest.json. A conclusão controlada executa novamente os checks, stage limitado ao manifesto, diff staged --check, commit, sync, validação e archive no mesmo commit via amend; nenhuma publicação remota faz parte da mudança.

## Arquivos incluídos

- apps/web/src/features/assistant/AssistantPage.spec.tsx
- apps/web/src/features/assistant/AssistantPage.tsx
- apps/web/src/features/assistant/assistant.css
- apps/web/src/features/auth/AuthenticatedShell.spec.tsx
- apps/web/src/features/auth/AuthenticatedShell.tsx
- apps/web/src/features/dashboard/DashboardPage.spec.tsx
- apps/web/src/features/dashboard/DashboardPage.tsx
- apps/web/src/features/dashboard/DashboardPomodoro.tsx
- apps/web/src/features/profile/ProfilePage.spec.tsx
- apps/web/src/features/profile/ProfilePage.tsx
- apps/web/src/features/profile/module-catalog.ts
- apps/web/src/styles/account.css
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/.openspec.yaml
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/proposal.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/design.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/tasks.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/validation.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/specs/account-profile-visual-experience/spec.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/specs/ai-study-assistant/spec.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/specs/authenticated-shell-visual-experience/spec.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/specs/dashboard-presentation/spec.md
- openspec/changes/archive/2026-11-19-refine-platform-navigation-and-ai-experience/specs/module-preferences/spec.md
- openspec/specs/account-profile-visual-experience/spec.md
- openspec/specs/ai-study-assistant/spec.md
- openspec/specs/authenticated-shell-visual-experience/spec.md
- openspec/specs/dashboard-presentation/spec.md
- openspec/specs/module-preferences/spec.md
