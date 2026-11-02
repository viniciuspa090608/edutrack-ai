# Proposal

## Why

Antes de alterar provedores de IA por conta, a EduTrack precisa de uma base de regressão reproduzível que demonstre o funcionamento dos fluxos existentes e detecte dependências indevidas da IA. O projeto já possui muitos testes; a mudança deve consolidá-los, preencher lacunas concretas e corrigir defeitos reproduzidos, sem substituir a suíte nem antecipar a implementação dos novos provedores.

## What Changes

- Inventariar testes existentes e entregar matriz de fluxos, riscos, cenários cobertos e lacunas, usando contratos/specs atuais como referência.
- Executar os quatro checks obrigatórios, classificar falhas de configuração, produto ou teste e registrar uma baseline sem segredos.
- Ampliar testes de integração HTTP com MySQL real, contratos e componentes para isolamento entre contas, perfil, módulos de estudo, indisponibilidade de IA e confirmação de prévias.
- Cobrir configuração sem IA, configuração completa atual e configuração parcial rejeitada, incluindo `AI_RECEIPT_KEY` isolada, sem flexibilizar a validação para esconder erros.
- Corrigir defeitos atuais demonstrados por teste de regressão que falha antes da correção e passa depois, preservando os requisitos e dados existentes.
- Consolidar execução local/CI e relatório de evidências para servir de comparação antes e depois de `add-account-ai-provider-settings`.

## Capabilities

### New Capabilities

Nenhuma. A mudança amplia a capacidade de qualidade já existente.

### Modified Capabilities

- `quality-commands`: matriz de regressão dos fluxos atuais, diagnóstico de falhas e evidência reproduzível de correções e validação.

## Impact

Testes de `apps/api`, `apps/web`, `packages/contracts` e `scripts`; configurações Vitest, scripts de qualidade e `.github/workflows/quality.yml` somente quando houver lacuna comprovada; README e relatório de baseline. Código de produção somente para defeitos reproduzidos contra requisitos atuais. Não inclui novos provedores, credenciais pessoais, mudanças de produto, refatorações amplas, reset do banco de desenvolvimento nem consumo de APIs pagas. Deve ser aplicada e concluída antes de `add-account-ai-provider-settings`; essa proposta permanece separada e não é implementada ou arquivada por esta mudança.
