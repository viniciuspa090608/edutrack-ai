# Integração obrigatória das preferências

As preferências são persistidas por usuário. A API é a autoridade; a web nunca substitui a autorização do servidor. Desativar um módulo altera apenas a preferência, preservando seu conteúdo.

Ao menos um entre tarefas, matérias e flashcards deve permanecer ativo; IA não conta. PATCH é validado contra a linha persistida sob lock em transação. Uma combinação inválida retorna `409 LAST_MODULE_REQUIRED` sem alterar flags. A interface também valida localmente, mas deve tratar esse erro quando outra aba tornar sua cópia desatualizada. Teste a corrida entre duas desativações dos últimos módulos.

## API

- Use `requireSession` antes do guard e obtenha o usuário da sessão, nunca do corpo/URL.
- Injete `PreferencesService` e use `guard('tasks' | 'subjects' | 'flashcards')` antes de controllers de leitura e escrita: lista, detalhe, criação, edição, exclusão, importação, exportação e processamento de jobs.
- Serviços e jobs devem chamar `requireEnabled(userId, capability)` novamente em cada ação, antes de acessar dados do módulo.
- IA exige o módulo consumidor e `ai`: use `guard(module, true)` antes do provedor e de alterações de dados. Em jobs, confira ambos novamente na execução. Criação manual só exige o módulo.
- A consulta vai ao MySQL em cada requisição. Não cacheie flags na sessão. `MODULE_DISABLED` e `AI_DISABLED` são 403; ausência de registro é 503 `PREFERENCES_MISSING`, registrada como falha operacional, sem criar defaults permissivos.
- Não apague, arquive nem desvincule conteúdo ao desativar. Reativação só muda a flag.
- Teste leitura/escrita bloqueadas sem acesso ao repository; IA bloqueada sem invocar provedor; alternância preserva os dados reais; isolamento de usuários e sessões antigas.

## Web e dashboard

- Registre funcionalidades entregues em `module-catalog.ts` e use `availableModules(preferences)` na navegação e nos widgets. Não marque como entregue antes de implementar o módulo.
- Páginas privadas exigem sessão e preferências atualizadas antes de renderizar dados. `moduleAtPath` reconhece URLs diretas/subpáginas. Módulo desativado exibe explicação e link `/conta`; módulo ativo não entregue exibe indisponibilidade.
- Revalide ao voltar à aba (`focus`/`visibilitychange`) e após salvamento. Requisições continuam sujeitas aos guards; ao receber `MODULE_DISABLED`, descarte dados visíveis e mostre o estado de reativação. Falha de consulta nunca permite renderizar dados sem autorização.
- Use `canUseAI(preferences, module, delivered)` para controles como **Aprimorar com IA**. IA desligada não impede controles manuais.
- Cada widget do dashboard deve declarar seu módulo e usar a mesma seleção, sem recalcular regras internas do produtor.
- Teste URL direta, outra aba, navegação, widget, IA oculta, teclado, 320 px e falha de rede. Os módulos de estudo e seus widgets ainda não existem nesta mudança.

## Contratos da conta

`GET/PATCH /profile` lê/altera o nome; `GET/PUT/DELETE /profile/avatar` lê, substitui e remove a foto binária. O PUT recebe um único arquivo em corpo bruto JPEG/PNG/WebP (até 2 MiB); usa origem autorizada e sessão. Nenhuma resposta JSON inclui a foto.

`POST /profile/identity/password` confirma a senha atual; Google usa `/auth/google/reauth/start`, com PKCE, state, nonce, mesmo sub/sessão e `auth_time` recente. A prova dura 5 minutos e é consumida ao solicitar troca.

`POST /profile/email/request`, `/email/resend` e `/email/confirm` reutilizam códigos/outbox criptografados da autenticação. A reserva dura 15 minutos enquanto aguarda envio e passa a 10 minutos após envio; código confirmado troca o endereço, revoga sessões/códigos/grants e enfileira aviso ao endereço antigo. O lock do endereço é compartilhado com novos cadastros, impedindo corrida pela reserva.

`POST /profile/password` altera somente senha já existente e exige a atual. `GET/PATCH /profile/preferences` lê/altera flags, com PATCH parcial e defaults tarefas/matérias/flashcards ativos e IA desativada. Todas as escritas exigem origem autorizada; erros não expõem segredos.
