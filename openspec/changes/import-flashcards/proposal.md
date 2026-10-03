# Proposal

## Why

Quem já mantém cartões em planilhas precisa transferi-los para um baralho sem recriá-los um por um. A importação deve permitir conferir o mapeamento e os resultados antes de gravar dados.

## What Changes

- Aceitar arquivos CSV e TSV UTF-8 de até **2 MiB** e até **1.000 linhas de cartões** por importação, com cabeçalho e campos entre aspas.
- Permitir escolher um baralho próprio, enviar o arquivo, mapear duas colunas distintas para frente e verso, visualizar uma amostra e os resultados previstos antes de confirmar.
- Na confirmação, importar apenas linhas válidas. Ignorar cartões duplicados no arquivo ou já existentes no baralho, comparando frente e verso após aparar espaços e sem diferenciar caixa; rejeitar linhas inválidas com motivo.
- Mostrar ao final contagens de importados, ignorados por duplicidade e rejeitados por erro, sem contar cabeçalho ou linhas totalmente vazias.
- Fazer a importação funcionar com IA desativada e respeitar a preferência de flashcards.

## Capabilities

### New Capabilities

- `flashcard-import`: validação, mapeamento, pré-visualização, confirmação e relatório de importação CSV/TSV em baralho próprio.

### Modified Capabilities

- `shared-contracts`: contratos públicos do mapeamento, da pré-visualização e do resultado da importação.

## Impact

- `apps/api`: parsing seguro, sessão temporária de importação, autorização do baralho, deduplicação e gravação transacional.
- `apps/web`: fluxo acessível de envio, mapeamento, pré-visualização, confirmação e resultado no módulo de flashcards.
- `packages/contracts`: schemas e DTOs de mapeamento e resultados.
- O apply depende de `add-manual-flashcards`, `add-user-authentication` e `add-profile-and-module-preferences`; não requer IA.
