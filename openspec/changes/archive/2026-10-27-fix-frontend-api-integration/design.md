# Design

## Context

Ver motivação em `proposal.md`. O projeto usa `App` com seleção por pathname e detalhes internos aos módulos. Não é necessário alterar o roteamento para corrigir os fluxos escolhidos.

As listas de retorno existem em `PrivatePage`, `auth-api.ts` e `google.service.ts`. As três omitem Flashcards. `progress-api.ts` serializa o PATCH de fuso, mas `send` não define Content-Type automaticamente e a API utiliza `express.json`. `ProfilePage` apresenta a mensagem de indisponibilidade sempre que a preferência é IA. `FlashcardAIFlow` referencia `/app/profile`, ausente de `App`.

Há mudanças concluídas ainda não arquivadas sobre perfil, IA e progresso. Esta proposta complementa seus comportamentos existentes; não altera seus artefatos nem suas tarefas. A especificação principal de autenticação já exige retorno interno seguro, e o delta acrescenta cobertura explícita de Flashcards.

## Goals / Non-Goals

**Goals:** corrigir integração nos pontos existentes e comprovar transporte HTTP, retorno seguro e navegação.

**Non-Goals:** centralizar todo o roteamento, introduzir pacotes compartilhados de navegação, criar páginas de detalhes ou alterar contratos públicos.

A ampliação autorizada durante o apply inclui restaurar exclusões locais e estabilizar fixtures/concorrência da suíte; nenhuma regra de produção do dashboard ou da demo será enfraquecida para satisfazer testes.

## Decisions

1. Corrigir o link para `/conta#account-preferences`. A seção já existe. Criar alias `/app/profile` ampliaria a superfície pública sem necessidade. Verificar o posicionamento no navegador, pois o conteúdo de conta surge após carregamento assíncrono; se necessário, tratar o fragmento após a seção montar, sem criar um roteador.
2. Acrescentar Flashcards às três listas existentes. Testes de paridade dos destinos previnem regressões. Uma refatoração global para catálogo compartilhado adicionaria acoplamento desnecessário entre aplicações nesta correção.
3. Definir Content-Type somente no PATCH JSON de fuso. Alterar `send` globalmente poderia afetar uploads de avatar e importações CSV/TSV, que usam tipos próprios.
4. Substituir a orientação desatualizada de IA mantendo regras de preferência e erros operacionais existentes. A presença do fluxo não comprova configuração do provedor.
5. Complementar testes de interface com uma regressão que inspecione a requisição real produzida por `saveStudyTimeZone`, sem mockar esse helper. O teste atual de apresentação usa mock do módulo e não detecta o cabeçalho ausente. Validar persistência pelo HTTP da API com MySQL real isolado e retorno Google com infraestrutura de testes OAuth existente.
6. Restaurar exclusões anteriores do `.gitignore`, mantendo `/especificacoes`, para que o Prettier não percorra `dist`. Não formatar saídas de compilação como solução.
7. Alinhar tracking e histórico inicial de fuso do fixture do dashboard a janeiro de 2026; usar `setInitialCardTime` existente para alinhar vencimento e criação do cartão ao relógio simulado, preservando a verificação do estado inicial real feita por esse helper.
8. Limitar `maxWorkers` da API a 2, como limite de recursos locais para migrations e seeds MySQL paralelos. A demo passou isoladamente, mas apresentou timeouts e bloqueios na execução completa sem limite de workers. Preservar timeouts de 20 segundos e confirmar pela suíte completa antes de concluir; aumentar timeouts ou usar mocks mascararia a falha.

## Risks / Trade-offs

- [Listas de retorno duplicadas] → conferir paridade e preservar rejeição de URLs externas, caminhos desconhecidos e formas malformadas; manter a lista restrita.
- [Fragmento resolvido antes da montagem da conta] → verificar abertura da seção no fluxo real e tratar montagem apenas se necessário.
- [Provedor Google ou IA não configurado localmente] → testes OAuth determinísticos existentes e mensagens operacionais; não exigir chamadas reais à IA para validar texto ou navegação.
- [Alterações preexistentes no working tree] → registrar baseline no início do apply e adicionar somente arquivos ou hunks pertencentes à mudança.

## Migration Plan

Sem migrations ou mudanças de configuração. Publicar frontend e API com a lista de retorno alinhada no processo habitual do projeto. Reversão pelos arquivos desta mudança, sem alteração de dados. O apply executará testes afetados por grupo e `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` antes do único commit de conclusão. Falha ou pausa impede esse commit; sem push, tag ou arquivamento automático.
