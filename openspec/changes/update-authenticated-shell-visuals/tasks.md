# Tasks

## 1. Baseline e limites do apply

- [x] 1.1 Registrar HEAD, status e diff do Git antes de editar; identificar alterações preexistentes, especialmente auth.css e refine-auth-desktop-layout, e verificar que o registro separa arquivos/hunks alheios.
- [x] 1.2 Registrar baseline visual dos nove destinos nos dois temas e dos estados relevantes; verificar evidências de conteúdo interno, navegação da Conta, preferências indisponíveis e retorno autenticado atual sem incluir correções funcionais.

## 2. Composição e navegação do shell

- [x] 2.1 Criar definição local de apresentação de destinos fixos e módulos retornados por availableModules, reutilizada por desktop/mobile; verificar ordem, condições delivered/preferência, ausência de destino IA e preservação de todos os hrefs em testes de UI.
- [x] 2.2 Simplificar o header com marca para /app, Button de tema e link de avatar para /conta, extraindo somente componentes locais necessários; verificar nomes acessíveis, ausência dos links principais no header e preservação dos branches/gates de PrivatePage por diff e testes relacionados.
- [x] 2.3 Compor sidebar com ícone/rótulo, itens ativos e Sair separado, usando leave e busy existentes; verificar destinos habilitados, Conta, bloqueio de saída e scroll até o último item em janela curta.
- [x] 2.4 Compor barra inferior com Início, módulos ativos e Mais em colunas sem lacunas; verificar combinações de preferências, prefs indisponíveis e destinos fixos sempre acessíveis em testes de UI.
- [x] 2.5 Implementar Mais com Sheet bottom existente, links reais, Conta e Sair, título/descrição e fechar em português; verificar abertura, Escape, foco/retorno, scroll e erro de logout visível após fechamento sem duplicar handlers.
- [x] 2.6 Aplicar identificação ativa compartilhada, igualdade exata de Início, fronteira de segmento dos módulos e indicação de destino dentro de Mais; verificar /app, cada destino, query/hash da Conta e ausência de marcação indevida por prefixo.

## 3. Tema e avatar confirmados

- [x] 3.1 Integrar useTheme/setTheme ao botão Sun/Moon com nome acessível para a próxima ação; verificar sincronização com Aparência da Conta, persistência atual, storage/sistema quando aplicável e ausência de reload/perda de estado pelos testes de tema e UI relacionados.
- [x] 3.2 Apresentar avatar com profile/avatar existentes somente após sessão válida, AvatarImage/Fallback e object URLs revogadas; verificar foto real, ausência de nome/foto, falha de leitura/imagem e descarte de resposta obsoleta sem bloquear módulos ou alterar contratos.
- [x] 3.3 Conectar onName e callback local opcional após confirmação de upload/remoção ao header sem receber selected/preview; verificar nome salvo, foto salva/removida, draft e falha de salvamento conservando identidade confirmada e requests/feedback existentes do editor.

## 4. Estilos e organização responsiva

- [x] 4.1 Aplicar tokens/Inter/ícones atuais, superfícies, bordas e estados ativo/hover/focus/disabled escopados ao shell; verificar contraste nos dois temas e ausência de novas dependências, cores equivalentes hardcoded ou alterações globais de primitives.
- [x] 4.2 Aplicar breakpoint de 1024 px, header consistente, coluna lateral com scroll e espaço externo de conteúdo; ajustar somente overrides externos da Conta e verificar por diff que sua sidebar interna, âncoras e módulos não foram redesenhados.
- [x] 4.3 Reservar altura da barra mais safe area e margem para foco/âncoras, usar largura flexível e controles de pelo menos 44 px; verificar última ação/mensagem visível, ausência de overflow ou sobreposição em 320 px e pouca altura.
- [x] 4.4 Impedir foco em layout oculto, fechar Mais ao cruzar o breakpoint e cobrir reduced motion inclusive no portal; verificar resize com menu aberto, liberação de scroll/foco, teclado e overlays nos dois temas.

## 5. Verificação diretamente relacionada e checks obrigatórios

- [x] 5.1 Executar/adaptar somente testes de UI de shell/Auth/Profile/App/tema relacionados: destinos, ativo/Mais, módulos on/off, prefs indisponíveis, sessão pendente/ausente/expirada e retry; verificar resultados sem criar suítes de backend para esta mudança.
- [x] 5.2 Verificar por testes relacionados avatar confirmado/fallback/preview, acesso à Conta, tema/persistência/estado preservado e logout pendente/sucesso/erro/retry nas duas navegações, mantendo Encerrar sessão da Conta com a mesma ação.
- [x] 5.3 Inspecionar no navegador 320, 375, 768, 1023, 1024 e 1440 px, 1024×480 e mobile de pouca altura/paisagem; verificar ambos os temas, teclado, foco, contraste, safe area, reduced motion e ausência de conteúdo encoberto, registrando evidências.
- [x] 5.4 Verificar os nove destinos por acesso direto/reload/voltar/avançar e parâmetros/âncoras/subfluxos existentes, incluindo drafts na Conta; comparar baseline e confirmar que conteúdo/layout interno de módulos e páginas públicas permanece preservado.
- [x] 5.5 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build obrigatórios pelo AGENTS.md; registrar resultados, usar MySQL real isolado se exigido e não mascarar falhas nem acrescentar suítes backend além da execução obrigatória da raiz.

## 6. Conclusão e versionamento

- [x] 6.1 Revisar diff e evidências de validação, confirmar escopo exclusivo do shell e atualizar tasks.md somente para tarefas verificadas; verificar ausência de alterações não autorizadas em APIs, contratos, autenticação, rotas ou páginas internas.
- [x] 6.2 Após todas as tarefas e checks aprovados, stage somente arquivos/hunks desta mudança com tasks.md final, revisar staged e executar git diff --cached --check; criar exatamente um commit [update] atualizar shell autenticado responsivo e confirmar hash/arquivos, sem commit vazio, tag, push ou archive e preservando alterações preexistentes.
