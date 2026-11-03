# Tasks

## 1. Preparação

- [x] 1.1 Registrar branch, HEAD e git status antes de editar; delimitar alterações preexistentes e sobreposição com refine-auth-desktop-layout, verificando que seus artefatos e trabalho serão preservados. Usar branch adequada ou codex/refine-platform-ui-details, preservando master.

## 2. Controles compartilhados

- [x] 2.1 Adicionar RadioGroup no padrão shadcn/ui de packages/ui usando radix-ui e tokens existentes; verificar build/typecheck do pacote e seleção por teclado com rótulos associados.
- [x] 2.2 Migrar selects de TasksPage, SubjectsPage, SubjectSelect e RoadmapsSection para o Select compartilhado; verificar filtros, campos, valores vazios, validação, reset e payloads preservados nas suítes pertinentes.
- [x] 2.3 Migrar selects de RoutinesPage, PomodoroPage, ClassroomSection e AISettingsSection; verificar associações opcionais, catálogos, filtros e ações existentes com os mesmos valores de domínio.
- [x] 2.4 Migrar selects de FlashcardAIFlow, ImportFlow e ReviewQueue e auditar usos restantes em apps/web; verificar ausência de seletor nativo visível no escopo e regressões das suítes de flashcards.
- [x] 2.5 Verificar Select em modais e listas longas, nos dois temas e em 320 px; confirmar teclado, Escape, retorno de foco, disabled, opção vazia, seleção atual, rolagem e portal sem quebra de contenção de foco.

## 3. Acesso e Dashboard

- [x] 3.1 Integrar animação login → recuperação ao fluxo de navegação e chegada existente e alinhar os links inferiores com gap/wrap; verificar uma única navegação, foco no título, fallback de animação e movimento reduzido com as suítes de acesso/recuperação.
- [x] 3.2 Formatar a linha de consulta da Dashboard como DD/MM/AAAA, HH:mm e reorganizar indicadores em descrição cinza acima de ícone/valor; verificar exemplo sem segundos/prefixos, atributo time preservado, valores e indisponibilidade nas suítes de Dashboard.

## 4. Configurações

- [x] 4.1 Unificar ordem das seções e menu e implementar destaque durante rolagem conforme design, incluindo fuso em Preferências; verificar rolagem nos dois sentidos, seções condicionais, âncoras, rodapé, aria-current único e preservação de foco/rascunhos.
- [x] 4.2 Distribuir Tarefas, Matérias e Flashcards na mesma linha com adaptação mobile; verificar checkboxes quadrados, persistência e recusa de desativar o último módulo ativo nas suítes de perfil.
- [x] 4.3 Aplicar RadioGroup ao modo de IA e alinhar Salvar maior e Recarregar fit-content; verificar ambos os modos, teclado, loading/disabled, erro, sucesso e preservação dos handlers e tratamento seguro da chave na suíte de IA.
- [x] 4.4 Agrupar ClassroomSection em card único e adicionar logo local fiel com origem oficial documentada; verificar estados desconectado/conectado, importação, erros e ações existentes sem duplicação de card ou alteração de OAuth.

## 5. Pomodoro e validação integrada

- [x] 5.1 Estender a coluna lateral e distribuir seus dois cards alinhando topo/base ao principal; verificar preparação, sessão ativa/pausada/entre blocos e altura natural no layout empilhado sem alteração de timer ou totais.
- [x] 5.2 Executar QA visual das áreas alteradas em ambos os temas em 320 px, tablet e desktop, incluindo teclado, zoom de 200%, movimento reduzido e textos longos; registrar evidências de alinhamento, contraste, ausência de overflow e estados loading/erro/vazio/sucesso aplicáveis.
- [x] 5.3 Ajustar testes de regressão somente onde os comportamentos mudam, usando interações acessíveis para Select/RadioGroup; verificar suites afetadas sem enfraquecer assertions de payloads, regras e bloqueios existentes.
- [x] 5.4 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build; registrar resultados aprovados, usando MySQL real isolado nos testes de banco sem mascarar configuração com mocks.
- [x] 5.5 Revisar artefatos e diff final e executar pnpm exec openspec validate refine-platform-ui-details --strict; verificar cobertura de todos os pedidos e ausência de alterações alheias.

## 6. Conclusão local do apply

- [x] 6.1 Preparar .openspec-local/refine-platform-ui-details-manifest.json com arquivos próprios explícitos e plano sync conforme README; produzir snapshots por merge semântico dos cinco deltas, verificando todos os cenários, requisitos posteriores e ausência de conflitos.

### Procedimento obrigatório de encerramento

As etapas abaixo são executadas pelo finalizador após a checklist de implementação, evitando autorreferência: o comando exige todas as tarefas de implementação concluídas antes de criar o commit.

Após implementação e verificações aprovadas, finalizar tasks.md e executar pnpm openspec:finish --change refine-platform-ui-details --manifest .openspec-local/refine-platform-ui-details-manifest.json --message "[update] refinar interface de acesso e estudo"; garantir revisão staged e git diff --cached --check antes do commit, verificação das refs reais e um único commit final com sync/archive por amend controlado, sem push/tag. Em falha, registrar pendência e retomar o journal sem criar segundo commit.

Confirmar hash final, arquivos incluídos, archive e estado Git, informando-os; verificar preservação de alterações preexistentes e ausência de conclusão/archive de outras mudanças.
