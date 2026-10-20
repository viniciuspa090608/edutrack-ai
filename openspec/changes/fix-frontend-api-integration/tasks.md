# Tasks

## 1. Baseline

- [x] 1.1 Registrar branch, HEAD, `git status --short` e diffs preexistentes no início do apply; verificar que o registro distingue arquivos desta mudança de alterações anteriores, sem exibir conteúdo de `.env`.

## 2. Navegação e orientação de IA

- [x] 2.1 Corrigir o atalho de `FlashcardAIFlow` para `/conta#account-preferences`; verificar com teste do destino e navegação no navegador que a seção assíncrona fica acessível por teclado, ajustando o tratamento do fragmento se necessário.
- [x] 2.2 Atualizar a orientação da preferência de IA em `ProfilePage`; verificar nos testes de perfil que o texto de indisponibilidade futura não aparece para IA, que a alternância persiste e que os fluxos manuais continuam acessíveis; executar os testes afetados deste grupo.

## 3. Retorno seguro de autenticação

- [x] 3.1 Incluir `/app/flashcards` no retorno construído em `PrivatePage` e na lista permitida de `auth-api.ts`; verificar nos testes de autenticação o acesso sem sessão, retorno após login local, preferência desabilitada e preservação dos destinos anteriores.
- [x] 3.2 Alinhar a lista de retorno em `google.service.ts`; verificar nos testes OAuth existentes que Flashcards é preservado do início ao callback, com MySQL real isolado para persistência, mantendo rejeição de destinos externos, malformados e desconhecidos; executar testes afetados de web e API deste grupo.

## 4. Transporte da atualização de fuso

- [x] 4.1 Definir `Content-Type: application/json` no PATCH de `saveStudyTimeZone`; verificar por teste do helper sem mocká-lo que método, cabeçalho e corpo enviados estão corretos e executar os testes afetados de progresso.
- [x] 4.2 Verificar salvar e reler o fuso pelo HTTP da API com MySQL real isolado, preservando as datas históricas, e verificar na interface sucesso após confirmação, falha recuperável e manutenção do último valor confirmado; registrar os resultados dos testes afetados deste grupo.

## 5. Validação e conclusão

- [x] 5.0 Restaurar as exclusões anteriores do `.gitignore` preservando `/especificacoes`; alinhar o início do acompanhamento no fixture do dashboard ao relógio dos cenários e limitar workers MySQL da API sem aumentar timeouts; verificar dashboard/demo isoladamente e suíte completa com MySQL real, registrando a ampliação autorizada e os resultados.

- [x] 5.1 Validar os fluxos alterados no navegador com teclado e viewport de 320 px, preservando foco, estados de carregamento/erro/sucesso e preferência de movimento reduzido; registrar evidências sem segredos.
- [x] 5.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; verificar sucesso dos quatro comandos e registrar falhas de ambiente sem substituí-las por mocks ou marcar conclusão indevida.
- [x] 5.3 Finalizar `tasks.md`, adicionar somente arquivos ou hunks desta mudança, revisar o diff staged e executar `git diff --cached --check`; verificar que alterações preexistentes permanecem fora do staged antes de criar exatamente um commit de conclusão no formato `[fix] corrigir integração dos fluxos existentes`, incluindo implementação e tarefas finais; confirmar hash e arquivos por `git show --stat --oneline HEAD`, sem push, tag ou arquivamento. Não criar commit de conclusão se o apply estiver pausado ou falhar, nem commit vazio se não houver novo diff.
