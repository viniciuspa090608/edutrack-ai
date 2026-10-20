# Validação do apply

## Implementação

- Atalho de IA aponta para `/conta#account-preferences`; a seção recebe foco após montagem assíncrona, sem rolagem animada solicitada pela aplicação.
- Orientação de IA descreve complemento opcional, preservando os módulos manuais.
- Web e API Google permitem retorno a Flashcards, mantendo listas restritas de destinos.
- PATCH do fuso envia JSON com Content-Type explícito.

## Primeira execução: resultados e bloqueios encontrados

- Testes afetados de web: 5 arquivos e 52 testes aprovados na execução inicial; regressão adicional sobre último fuso confirmado incluída na suíte posterior.
- Testes afetados de API: 2 arquivos e 35 testes aprovados com MySQL real e bancos isolados, incluindo callback OAuth HTTP e persistência de fuso.
- `pnpm typecheck`: aprovado.
- `pnpm build`: aprovado; aviso de bundle grande já fora do escopo desta mudança.
- `pnpm lint`: ESLint aprovado; Prettier falhou em 179 arquivos gerados sob `dist`, que deixaram de ser ignorados pela alteração preexistente em `.gitignore`. Não foram formatados arquivos gerados nem alterado o `.gitignore`.
- `pnpm test`: contratos aprovados (37 testes); API com 216 testes aprovados e 4 falhas. A execução recursiva interrompeu antes da web, executada separadamente para completar a informação.
- Suíte completa da web executada separadamente: 28 arquivos e 255 testes aprovados, incluindo as regressões finais desta mudança. O pacote UI não define script de testes.
- Falha em `dashboard.http.spec.ts:303`: esperava streak `ready`, recebeu `empty`; tracking começa em 2026-10-20, enquanto o cenário usa outubro anterior. Arquivo não alterado por este apply; causa fora do escopo, sem afirmar confirmação por execução do baseline.
- Falhas em `demo.spec.ts`: timeout no teste de rollback, timeout no beforeEach seguinte e bloqueio de operação de demo. Arquivo não alterado por este apply; causa fora do escopo.
- `openspec validate fix-frontend-api-integration --strict`: aprovado.
- `git diff --check`: sem erros.

## Primeira tentativa no navegador

- Acesso direto sem sessão a `/app/flashcards` mostrou `/acesso?returnTo=%2Fapp%2Fflashcards` e link Google com o mesmo destino.
- Login de conta fictícia na tentativa de validação foi recusado; não foi possível confirmar que o frontend existente na porta 5173 estava ligado à API isolada iniciada para o teste. Não considerar esse fluxo validado no navegador.
- Permanecem pendentes validação completa de navegação, foco, viewport de 320 px e estados no navegador; checkboxes correspondentes não foram concluídos apenas com testes jsdom.
- Sem staging, commit, push, tag ou arquivamento. Conclusão depende de resolver as verificações e concluir a validação visual.
- Banco isolado `study_platform_test_integration_ui_1d6e0e37`, criado apenas para esta tentativa de validação, removido ao encerrar. Conta fictícia não permanece no banco de desenvolvimento.

## Ampliação autorizada e nova validação

- O usuário autorizou restaurar exclusões de `.gitignore` e investigar/corrigir as falhas de dashboard e demo para concluir o apply.
- `.gitignore` restaura exclusões anteriores e preserva `/especificacoes`; `.env`, dependências e saídas de build não entram no commit. Configuração OpenSpec preexistente permanece fora do staged.
- Dashboard: alinhados tracking/histórico inicial e criado cartão com o helper de fixture já existente; o relógio dos cenários não depende da data real. Não alterada a regra de produção que rejeita atividades anteriores ao tracking.
- Demo: seis cenários passaram isoladamente com MySQL real. A suíte API foi limitada a dois workers para evitar contenção entre migrations e seeds locais; timeouts originais preservados. Dashboard e demo passaram juntos: 13 testes.
- Nova execução de `pnpm lint`: aprovada, incluindo ESLint e Prettier.
- Nova execução de `pnpm typecheck`: aprovada.
- Ambiente de navegador corrigido: API em `127.0.0.1:3019`, frontend em `localhost:5189`, MySQL isolado e conta fictícia. Serviços preexistentes nas portas padrão preservados.
- Navegador: abertura sem sessão e login por Enter retornam a Flashcards. O link Google também preserva esse destino; conclusão OAuth validada nos testes HTTP com provedor determinístico, sem usar conta Google real.
- Em 320 x 740 px: fuso salvo por Enter, confirmação após resposta da API, valor persistido após recarga e erro recuperável com fuso inválido mantendo o último valor confirmado. Nenhuma rolagem horizontal: largura de documento 305 px para viewport de 320 px.
- Fluxo real de IA: preferência da conta fictícia habilitada para abrir formulário e desabilitada no banco isolado antes da geração; guard da API recusou sem chamar provedor. Atalho de erro acionado por Enter abriu `/conta#account-preferences` e foco foi confirmado em `account-preferences` após montagem.
- A IA desabilitada preservou as opções manuais de Flashcards. Loading, erro e sucesso também cobertos pelos testes de componentes existentes e regressões.
- Revisão de movimento reduzido: regra existente de `account.css` desativa animação, transição e rolagem suave; a mudança de foco não solicita animação e não altera essa regra. Não foi emulada a preferência do sistema no navegador.
- Evidência visual: `preferences-320.png`, com foco visível e controles utilizáveis em largura mínima. Override de viewport removido após a captura.

## Resultado final

- Os quatro comandos obrigatórios passaram: pnpm lint, pnpm typecheck, pnpm test e pnpm build.
- Último pnpm test executado sem build ou servidores de QA em paralelo: contratos 16 arquivos/37 testes, API 37 arquivos/220 testes, web 28 arquivos/255 testes; total de 512 testes aprovados. MySQL real com bancos isolados.
- Houve uma execução intermediária da web com falhas por tempo enquanto o build também rodava; a execução completa sequencial passou sem alterar timeouts ou código de Tarefas.
- Build final aprovado; permanece o aviso de chunk JavaScript maior que 500 kB (1.095,14 kB; gzip 289,40 kB). Otimização de bundle permanece fora desta correção de integração.
- Banco fictício study_platform_test_integration_ui_a196cfa7 removido; portas temporárias 3019/5189 sem servidores em execução. Scripts temporários desta validação removidos.
- Alterações preexistentes de openspec/config.yaml e arquivos não relacionados preservados fora do commit. Sem push, tag ou arquivamento.
- O registro textual baseline.diff teve espaços finais normalizados para satisfazer diff --check; é evidência de leitura, não um patch destinado a reaplicação.

## Arquivos incluídos no commit

- .gitignore
- apps/api/src/modules/auth/google.service.ts
- apps/api/test/dashboard.http.spec.ts
- apps/api/test/google.spec.ts
- apps/api/test/study-progress.http.spec.ts
- apps/api/vitest.config.ts
- apps/web/src/features/auth/Auth.spec.tsx
- apps/web/src/features/auth/PrivatePage.tsx
- apps/web/src/features/auth/auth-api.ts
- apps/web/src/features/flashcards/FlashcardAIFlow.spec.tsx
- apps/web/src/features/flashcards/FlashcardAIFlow.tsx
- apps/web/src/features/profile/ProfilePage.spec.tsx
- apps/web/src/features/profile/ProfilePage.tsx
- apps/web/src/features/study-progress/StudyProgressPage.spec.tsx
- apps/web/src/features/study-progress/progress-api.spec.ts
- apps/web/src/features/study-progress/progress-api.ts
- openspec/changes/fix-frontend-api-integration/.openspec.yaml
- openspec/changes/fix-frontend-api-integration/baseline-status.txt
- openspec/changes/fix-frontend-api-integration/baseline.diff
- openspec/changes/fix-frontend-api-integration/baseline.txt
- openspec/changes/fix-frontend-api-integration/design.md
- openspec/changes/fix-frontend-api-integration/preferences-320.png
- openspec/changes/fix-frontend-api-integration/proposal.md
- openspec/changes/fix-frontend-api-integration/specs/frontend-api-integration/spec.md
- openspec/changes/fix-frontend-api-integration/specs/quality-commands/spec.md
- openspec/changes/fix-frontend-api-integration/specs/user-authentication/spec.md
- openspec/changes/fix-frontend-api-integration/tasks.md
- openspec/changes/fix-frontend-api-integration/validation.md
