# Validação

## Estado inicial

Branch inicial master, sem diff de implementação. Apenas os artefatos próprios desta proposta estavam sem rastreamento. Implementação realizada em codex/refine-assistant-achievements-and-import.

## Regressão e integração

O teste novo reproduziu a perda de origem da autorização do onboarding no MySQL real isolado, com fixture OAuth assinada; os 20 testes anteriores de Classroom passaram no mesmo ensaio. A correção vincula account/onboarding à tentativa autenticada por migration versionada e retoma /app ou /conta. Os callbacks Google, escopos, porta padrão e origem da API foram preservados.

Testes cobrem retorno OAuth com sucesso e recusa nas duas origens, contexto inválido, rejeição de URL externa, conta sem disciplinas, destino novo, recuperação da operação ao concluir onboarding, idempotência e retry existentes. Nenhuma chamada real ao Google foi necessária para os testes.

As conquistas novas usam os fatos rastreados existentes; armazenamento de códigos é varchar(40), sem enum de sete valores. A reconciliação reconhece histórico anterior na leitura com lock por usuário e concessão única. Testes verificam 13/14 datas, 99/100 avaliações, primeiro instante elegível, concorrência, preservação dos sete marcos originais e isolamento entre contas. O perfil demo conserva seus fatos: dois marcos novos podem permanecer bloqueados se seus critérios ainda não foram cumpridos.

## Revisão visual

Navegador Edge headless com dados sintéticos: temas claro/escuro, larguras 320/1440 px e movimento reduzido. Verificados cards do assistente, preenchimento com foco via teclado sem envio, nove conquistas, onboarding, barra real e toast parcial. Sem overflow horizontal ou erros JavaScript nas quatro combinações. O onboarding recebeu espaçamento próprio para evitar compressão por padding aninhado em 320 px.

Evidências em validation/: assistant-desktop.png, achievements-mobile.png, import-mobile.png e report-nine-achievements.png. São dados sintéticos para revisão, não resultados de uma conta real.

Relatório A4 gerado pela impressão real do navegador, rasterizado com Poppler e inspecionado: nove conquistas, critérios, datas e progresso, duas colunas, notas de interpretação e paginação contínua. O exemplo final ocupa três páginas, sem fixar esse número no produto. Corrigidas margens escuras causadas por color-scheme inline; impressão permanece clara mesmo a partir do tema escuro. PDF e demais matrizes de evidência ficam localmente em .openspec-local/refine-assistant-import-qa/.

## Qualidade e conclusão

Typecheck e build aprovados. Lint aprovado após normalizar a formatação de arquivos já existentes; isso não gerou mudança semântica nesses arquivos. Suíte completa aprovada: 22 testes do fluxo local, 45 de contratos, 321 da API/MySQL e 335 da web (723 no total). A migration local foi aplicada com sucesso (uma migration, sem exclusão de dados). O finalizador controlado revalida lint, typecheck, test e build antes de criar o commit único e incorporar sync/archive.
