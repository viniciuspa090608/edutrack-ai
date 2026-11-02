# Validação de add-account-ai-provider-settings

Data: 02/11/2026. Branch: codex/add-account-ai-provider-settings.

## Estado inicial e escopo

Estado inicial registrado: branch codex/establish-project-regression-baseline, sem diff rastreado/staged, somente o diretório desta proposta não rastreado. Foi criada uma branch própria; master e demais mudanças OpenSpec foram preservadas. O .env privado não foi alterado e não integra o manifesto. Não houve chamada paga, uso de chave real em testes, tag ou push.

## Verificações

- pnpm lint: aprovado (ESLint e Prettier).
- pnpm typecheck: aprovado em todos os workspaces.
- pnpm test: aprovado; 22 testes de workflow, 38 de contratos, 255 da API e 259 da web. Após ampliar as asserções de roteamento/cotas, a suíte final ai-settings.http.spec.ts passou com 15 testes (inclui 1 caso adicional; 256 casos únicos da API verificados).
- pnpm build: aprovado; aviso não impeditivo do Vite sobre tamanho de chunk.
- openspec validate add-account-ai-provider-settings --strict: aprovado.
- Bundle: 9 arquivos inspecionados, sem canários nem nomes de variáveis privadas do servidor. Testes não entram no bundle.
- Persistência: MySQL real em bancos temporários isolados, aplicação/reversão de migrations, cascade, duas contas, revisão concorrente, última cota entre duas conexões, limites globais e pessoais, UTC e leases expirados/liberados. Nenhuma falha de banco foi substituída por mock.
- Provedores: fronteira HTTP simulada, catálogo inteiro nos três schemas e matriz de cinco provedores nos três fluxos via API; host e cabeçalho de credencial verificados por chamada. Recibos, expiração, adulteração e repetição continuam cobertos pelas suítes existentes; confirmação após troca de configuração não gera nova chamada.
- Divulgação: chaves sintéticas somente no cabeçalho do destino correto; rejeição de reflexão inclusive JSON com caracteres escapados, mensagens/erros/logs sanitizados, dados e armazenamento de resposta sem credenciais, validação local antes de reservar cota. Nenhuma telemetria ou persistência de segredo no navegador foi introduzida.
- Interface: testes de carregamento, vazio, indisponibilidade, erro/sucesso, substituição/remoção confirmadas, alteração apenas de modelo, foco e limpeza após salvar/falhar/sair. Navegador local com seção real e HTTP simulado: viewport 320 px, scrollWidth 305 px, seletor de modelos dependente e Tab até ai-key; regra existente de movimento reduzido preservada. A prévia temporária e seu servidor foram removidos/encerrados.

## Revisão de specs e implantação

Snapshots revisados em .openspec-local: account-ai-settings e ai-provider-routing são capacidades novas; environment-validation recebe somente o novo requisito. Seus 3 requisitos e 4 cenários anteriores foram preservados, sem substituição ou remoção. Não há conflito de specs. O fluxo openspec:finish repete os quatro checks, revisa staged/check, verifica refs reais do servidor e incorpora sync/archive ao próprio commit controlado.

Aplicar a migration e configurar os novos segredos no ambiente de implantação continuam operações operacionais conforme README. A validação não instala ou testa a chave real, não modifica .env e não altera o banco de desenvolvimento.

## Arquivos do commit final

A lista abaixo cobre implementação, testes, documentação, artefatos arquivados e specs sincronizadas (a exclusão do adaptador antigo também é incluída):

- .env.example
- README.md
- apps/api/src/app.ts
- apps/api/src/config/env.ts
- apps/api/src/database/migrations/20261102010000-CreateAccountAISettings.ts
- apps/api/src/demo/database.ts
- apps/api/src/modules/ai-settings/ai-settings.repository.ts
- apps/api/src/modules/ai-settings/ai-settings.routes.ts
- apps/api/src/modules/ai-settings/ai-settings.service.ts
- apps/api/src/modules/ai-settings/ai-usage.repository.ts
- apps/api/src/modules/ai-settings/credential-crypto.ts
- apps/api/src/modules/ai/flashcard-ai.service.ts
- apps/api/src/modules/ai/roadmap-ai.service.ts
- apps/api/src/modules/ai/roadmap-provider.ts
- apps/api/src/shared/openai-structured-provider.ts
- apps/api/src/shared/structured-provider.ts
- apps/api/test/ai-credential-crypto.spec.ts
- apps/api/test/ai-provider-fixtures.ts
- apps/api/test/ai-providers.spec.ts
- apps/api/test/ai-settings.http.spec.ts
- apps/api/test/env.spec.ts
- apps/api/test/flashcard-ai.http.spec.ts
- apps/api/test/roadmap-ai.spec.ts
- apps/api/test/roadmap-revisions.http.spec.ts
- apps/api/test/roadmaps.http.spec.ts
- apps/api/test/study-progress.http.spec.ts
- apps/api/test/test-env.ts
- apps/web/src/features/flashcards/FlashcardAIFlow.tsx
- apps/web/src/features/profile/AISettingsSection.spec.tsx
- apps/web/src/features/profile/AISettingsSection.tsx
- apps/web/src/features/profile/ProfilePage.spec.tsx
- apps/web/src/features/profile/ProfilePage.tsx
- apps/web/src/features/profile/ai-settings-api.ts
- apps/web/src/features/subjects/RoadmapRevisionTools.tsx
- apps/web/src/features/subjects/RoadmapsSection.tsx
- apps/web/src/styles/account.css
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/.openspec.yaml
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/design.md
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/proposal.md
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/specs/account-ai-settings/spec.md
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/specs/ai-provider-routing/spec.md
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/specs/environment-validation/spec.md
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/tasks.md
- openspec/changes/archive/2026-11-02-add-account-ai-provider-settings/validation.md
- openspec/specs/account-ai-settings/spec.md
- openspec/specs/ai-provider-routing/spec.md
- openspec/specs/environment-validation/spec.md
- packages/contracts/src/ai-settings.spec.ts
- packages/contracts/src/ai-settings.ts
- packages/contracts/src/index.ts
