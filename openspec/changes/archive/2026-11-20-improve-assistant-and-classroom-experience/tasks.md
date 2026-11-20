# Tasks

## 1. Baseline e diagnóstico

- [x] 1.1 Registrar branch, HEAD e diff inicial, identificando os três arquivos de interface já alterados neste chat; verificar que hunks preexistentes foram preservados e que master não é modificada diretamente.
- [x] 1.2 Conferir a operação real de importação por consulta autorizada e sanitizada de resultados, sem tokens, textos privados ou dados de outras contas; registrar os motivos observados e reproduzir destino ausente e descrição extensa em MySQL isolado, sem atribuir o incidente a falha de rede não comprovada.

## 2. Assistente de IA

- [x] 2.1 Estender contratos, consulta e serialização da listagem com título derivado da primeira mensagem user vigente e data de criação; verificar em testes MySQL isolamento, ordem cronológica, retenção, conversa legada e paginação.
- [x] 2.2 Renderizar título real, elipse visual acessível e data/hora em subtítulo cinza; testar atualização após primeiro envio, reabertura e fallback “Nova conversa”.
- [x] 2.3 Ajustar área integral e rolagens independentes do histórico e transcript; verificar desktop largo/baixo, 320 px e teclado virtual, sem rolagem global necessária para enviar nem sobreposição do shell.
- [x] 2.4 Distinguir mensagens por autoria, com superfície azul clara para IA e rótulos; conferir contraste nos dois temas e preservação de retry, prévias e confirmação por teclado.

## 3. Seleção de matérias no Classroom

- [x] 3.1 Filtrar listagem remota por ACTIVE e revalidar estado ao salvar e importar; testar páginas mistas, seleção antiga e arquivamento durante execução, preservando dados locais.
- [x] 3.2 Corrigir regras CSS que alongam o Checkbox compartilhado; conferir proporção quadrada, rótulo acionável, estados marcado/desmarcado/desabilitado e foco por teclado.
- [x] 3.3 Implementar “Selecionar todas as matérias” atravessando paginação com deduplicação e preservação de destinos; testar múltiplas páginas, falha intermediária, token repetido, loading e desmarcação individual sem iniciar importação.

## 4. Resumo e detalhes da importação

- [x] 4.1 Revisar os badges e resumo já implementados; testar contagens reais e distinção entre concluída, parcial, falha e sucesso vazio, com legibilidade nos dois temas.
- [x] 4.2 Completar modal “Mais detalhes” com Disciplinas/Tarefas e pendências de turmas quando houver; testar que detalhes começam ocultos, paginação alcança todos os itens, motivo e conflitos ficam acessíveis, e não se confunde página vazia com operação vazia.
- [x] 4.3 Validar foco contido, Escape, fechamento e retorno ao acionador no modal, corrigindo problemas; conferir rolagem interna e ausência de overflow horizontal em 320 px.
- [x] 4.4 Revisar recolhimento de seleção nos estados terminais e após recarga; testar reabertura com destinos preservados, nova importação explícita e ausência de exclusão de associações/registros.

## 5. Pendências recuperáveis

- [x] 5.1 Orientar antes do envio as turmas sem destino; testar escolha de disciplina existente, criação revisada, opção explícita de somente tarefas e bloqueio coerente quando o módulo não permite essa opção.
- [x] 5.2 Tornar motivo de descrição acima de 2.000 caracteres acionável, preservando limite e conteúdo; testar importação parcial e retry após correção da origem com MySQL isolado e sem duplicar itens válidos.
- [x] 5.3 Garantir que destino corrigido use seleção salva em nova solicitação e que retry preserve a semântica do snapshot; testar disciplina antes ignorada e preservação das tarefas já importadas.
- [x] 5.4 Corrigir outras causas concretas confirmadas na tarefa 1.2 dentro do fluxo de importação; verificar cada correção com reprodução e teste de regressão, ou documentar limitação externa comprovada sem mascarar falhas.

## 6. Validação e conclusão local

- [x] 6.1 Registrar evidências visuais em 320 px e desktop largo/baixo nos dois temas, conferindo scrolls do Assistente, checkbox, badges, modal e estados loading/erro/vazio/sucesso.
- [x] 6.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build; verificar aprovação de todos antes da conclusão, diagnosticando a falha anterior dos testes de workflow no ambiente correto sem ocultar erros ou substituir MySQL por mocks.
- [x] 6.3 Validar a mudança com openspec validate --strict e preparar snapshots semanticamente revisados das duas specs e manifesto local com paths próprios explícitos, conferindo preservação dos requisitos e cenários anteriores.
- [x] 6.4 Após aprovação das verificações, revisar diff staged e git diff --cached --check e executar pnpm openspec:finish --change improve-assistant-and-classroom-experience --manifest .openspec-local/improve-assistant-and-classroom-experience-manifest.json --message "[update] melhorar assistente e importação do Classroom"; verificar commit único final, sync, archive e arquivos incluídos, sem push, tag ou commit vazio.
