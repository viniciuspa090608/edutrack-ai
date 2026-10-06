# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD, status e diff preexistentes antes de editar; verificar que alterações anteriores, inclusive arquivos de planejamento, estão identificadas e preservadas.

## 2. Layout de Flashcards e checkboxes

- [x] 2.1 Agrupar ações principais e do baralho aberto de Flashcards com o padrão flexível existente, mantendo handlers, IDs, textos e painéis condicionais; verificar linha única quando há espaço e quebra sem compressão ou overflow em 320 px e desktop.
- [x] 2.2 Corrigir a interferência dos estilos de botões da Conta nos checkboxes de Módulos; verificar largura igual à altura e ausência de deformação nos estados checked, unchecked e disabled, preservando toggle, hover e foco.

## 3. Paginação

- [x] 3.1 Aplicar chevrons Lucide às ações direcionais das paginações existentes de Flashcards (baralhos, cartões, revisão, histórico e IA), Matérias (lista, roadmaps e revisões), Tarefas, Rotinas e Pomodoro, usando os componentes visuais existentes e mantendo nomes acessíveis e handlers; verificar que somente controles de paginação tiveram textos substituídos.
- [x] 3.2 Verificar e preservar disabled nativo e apresentação perceptível quando anterior/próximo não existem, inclusive lista vazia, página única e estados busy existentes; executar somente os testes/casos de paginação diretamente afetados e verificar primeira/última página e navegação nas duas direções.

## 4. Visibilidade de senha

- [x] 4.1 Incorporar somente os ícones oficiais locais eye e eye-slash do Font Awesome, preservando atribuição/licença; verificar que os SVGs usam a cor do tema e não exigem CDN ou biblioteca completa.
- [x] 4.2 Adicionar controle reutilizável restrito a Input explicitamente password, com ocultação inicial, botão sem submit, ícone e aria-label alternáveis, ref e atributos preservados; executar testes relacionados para mostrar/ocultar, manter valor, validações, envio, autocomplete, foco/seleção quando suportados, teclado e disabled.
- [x] 4.3 Verificar integração nos campos existentes de login/cadastro, recuperação e Perfil/Conta, incluindo senha de confirmação de identidade; executar somente testes relacionados de AccessPage, PasswordRecoveryPage e ProfilePage e confirmar ausência do olho em códigos de e-mail/recuperação/troca de e-mail e inputs comuns, sem criar confirmações inexistentes.

## 5. Verificação integrada e conclusão

- [x] 5.1 Validar no navegador as áreas alteradas em temas claro/escuro, desktop, breakpoint existente e 320 px: ações legíveis, quebra adequada, ausência de overflow, checkboxes quadrados, hover/focus/disabled, navegação por teclado e senha preservada; registrar resultados observáveis, sem tratar jsdom como medição de layout.
- [x] 5.2 Executar somente testes de frontend/UI diretamente relacionados e lint/typecheck dos pacotes frontend/UI alterados; registrar comandos e resultados, sem suíte completa, backend, banco ou testes não relacionados. Rever diff e confirmar exclusividade frontend, sem mudanças de regras, APIs, contratos, rotas ou estado global.
- [x] 5.3 Após concluir tarefas e verificações, preparar tasks.md final e um único commit da mudança com mensagem `[fix] ...`, adicionando somente seus arquivos/hunks; revisar staged, executar `git diff --cached --check` e confirmar hash e arquivos incluídos após commit, sem push, tag ou arquivamento.

Registro inicial: branch master, HEAD fcca98012072ae2f08984f31a90c8baddd899335; sem diff tracked; apenas esta proposta estava untracked.

## Evidências de verificação

- UI build, UI/web lint e UI/web typecheck passaram. Build web passou com Node e vite build --configLoader native.
- Vitest com Node e --configLoader native: sete arquivos diretamente relacionados, 64 testes passaram. Casos filtrados de paginação em seis arquivos: sete passaram, 52 ignorados. Após atualizar integrações de senha/códigos, seis casos selecionados passaram (incluindo dois novos de login/cadastro), 24 ignorados.
- O carregador padrão falhou ao empacotar dependências nativas Tailwind; carregador nativo e Node resolveram sem alterar configurações. Workers de teste e Edge headless precisaram de permissão para subprocessos.
- Edge headless, componentes reais e respostas HTTP simuladas: 1440, 800 e 320 px, claro/escuro. Ações de Flashcards em uma linha a 1440/800 px, três a 320 px, sem overflow. Checkboxes 16 × 16 px em checked, unchecked e disabled; toggle e bloqueio durante atualização verificados. Tab apresenta anel de foco de 3 px nas cores dos temas.
- Paginação de baralhos navega nos dois sentidos, anterior bloqueado na primeira e próximo na última. Ambos bloqueados no baralho de página única. SVGs sem texto visível e nomes acessíveis preservados.
- Senha oculta inicialmente, alternância preserva valor, seleção e foco. Testes verificam ref, autocomplete, validação, envio, teclado e disabled. Login/cadastro com um controle; Conta com três campos existentes. Códigos e inputs comuns permanecem sem olho.
- Capturas dos dois temas inspecionadas. Regra restrita ao pseudo-elemento de senha do Edge remove olho nativo duplicado.
- Nenhuma suíte completa, teste API/banco ou mudança de regra, API, contrato, rota ou backend.
