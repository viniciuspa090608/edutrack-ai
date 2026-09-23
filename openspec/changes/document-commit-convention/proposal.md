# Proposal

## Why

O projeto exige um commit por apply OpenSpec, mas ainda fixa a mensagem `Apply OpenSpec change: <nome-da-mudança>`. Isso conflita com a convenção de tipos solicitada e deixa a escolha do formato ambígua para os próximos commits.

## What Changes

- Documentar em `AGENTS.md` o formato `[tipo] descrição objetiva da alteração`, os cinco tipos permitidos, seus significados e os exemplos fornecidos.
- Preservar a regra de um único commit por apply concluído, com cada commit representando uma alteração lógica.
- Durante o apply, alinhar a orientação de commit em `openspec/config.yaml` ao formato documentado e verificar que não resta uma instrução contraditória.
- Não criar commit nesta etapa de proposal. O commit desta mudança será feito durante o apply.

## Capabilities

### New Capabilities

Nenhuma. Esta mudança documenta uma convenção de trabalho, sem alterar comportamento do produto.

### Modified Capabilities

Nenhuma. O arquivo `.openspec.yaml` declara `skip_specs: true` porque não há requisito funcional de produto a acrescentar às specs.

## Impact

- Documentação e orientação de agentes em `AGENTS.md` e `openspec/config.yaml`.
- Nenhum código de aplicação, API, contrato, dependência ou dado de usuário é alterado.
- Commits futuros usarão o novo formato; commits já existentes permanecem como estão.
