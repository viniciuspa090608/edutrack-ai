# Tasks

## 1. Preparação e reprodução

- [x] 1.1 Registrar branch, status e diff preexistente; usar branch codex/refine-assistant-achievements-and-import se necessário e verificar que alterações alheias ficam fora do escopo.
- [x] 1.2 Reproduzir a importação em conta nova com MySQL isolado e fixture OAuth, comparando onboarding e Conta; registrar retorno, preferências, seleção e primeira operação, com teste de regressão que falhe no comportamento encontrado.

## 2. Sugestões e respostas do assistente

- [x] 2.1 Substituir o texto do card de tarefas, ajustar categoria e descrição e adicionar o card de ajuda; verificar texto exato, filtro por módulos e preenchimento com foco sem envio automático nos testes de AssistantPage.
- [x] 2.2 Ajustar seleção de contexto e orientação do assistente para organização de tarefas e guia real do aplicativo; verificar tarefas fora da semana, ausência de dados, módulos desabilitados e ajuda sem escrita com fixtures determinísticas.

## 3. Conquistas e PDF

- [x] 3.1 Ampliar enum, catálogo e validação para nove conquistas e conferir restrições de persistência; verificar contratos e adicionar migration versionada apenas se necessária, validando-a no MySQL isolado.
- [x] 3.2 Projetar os novos critérios a partir do histórico válido, preservando concessões existentes; testar 13/14 dias, 99/100 avaliações, histórico anterior, data de obtenção, repetição e isolamento por usuário.
- [x] 3.3 Adicionar apresentação das novas conquistas com ícones, cores e estados existentes; verificar nove cards com progresso real nos dois temas e teclado em 320 px.
- [x] 3.4 Atualizar relatório unificado e fixtures para o catálogo ampliado; verificar totais, inclusão das novas obtidas, exclusão das bloqueadas na impressão e renderizar prévia/PDF com nove obtidas para revisar A4, duas colunas e paginação sem cortes.

## 4. Importação no onboarding e feedback

- [x] 4.1 Vincular origem interna onboarding/account à tentativa OAuth e retomar a etapa correta com preferências e conexão atualizadas; testar callback de sucesso/recusa, contexto inválido e rejeição de destino externo sem alterar callbacks autorizados.
- [x] 4.2 Corrigir a falha reproduzida na primeira importação mantendo ClassroomSection compartilhado; verificar conta sem disciplinas locais, novos destinos revisados, módulos desabilitados e fluxo completo sem passagem por Conta.
- [x] 4.3 Adicionar barra de progresso com fases e contagens reais, indeterminada sem total positivo; testar fila, processamento, total desconhecido/zero e 100% de processamento com resultado parcial.
- [x] 4.4 Adicionar toast de transição terminal com severidade correta e deduplicação por operação; testar sucesso, parcial, falha, resultado vazio, polling repetido, recarga e resposta tardia após desconexão, preservando resumo e detalhes.
- [x] 4.5 Validar integração onboarding→Conta com operação ativa, recarga e retry; comprovar recuperação da mesma operação, preservação dos sucessos e ausência de importações automáticas ou duplicatas no MySQL isolado.

## 5. Verificação e conclusão local

- [x] 5.1 Revisar assistente, nove conquistas e importação em desktop e 320 px, nos dois temas, com teclado e movimento reduzido; registrar evidências de legibilidade, foco e anúncios acessíveis.
- [x] 5.2 Executar pnpm lint, pnpm typecheck, pnpm test, pnpm build e validação estrita da mudança; registrar resultados sem ocultar falhas de infraestrutura com mocks.
- [x] 5.3 Preparar snapshots de specs com merge semântico e manifesto explícito conforme README; revisar cenários, arquivos próprios e diff staged, executar git diff --cached --check e concluir via pnpm openspec:finish --change refine-assistant-achievements-and-import --manifest .openspec-local/refine-assistant-achievements-and-import-manifest.json --message "[update] aprimorar assistente conquistas e importação"; verificar archive e commit único final sem push, informando hash final e arquivos incluídos.
