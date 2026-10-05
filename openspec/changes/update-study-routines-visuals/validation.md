# Validação do apply

## Estado inicial

- Branch: `master`.
- HEAD: `c115ef34ef90391e0d832e4252fa90741cffd1fb`.
- `git status --short`: somente `?? openspec/changes/update-study-routines-visuals/` (planejamento criado nesta conversa).
- Sem alterações preexistentes de implementação ou arquivos staged. Planejamento preservado e incluído na mudança.
- Escopo confirmado: apresentação local de Rotinas; handlers, efeitos, refs, condições e API client preservados.

## Verificações

- Testes focados: 5 aprovados, 2 casos de autenticação excluídos por filtro. Nenhuma suíte geral, teste de banco, backend, autenticação ou outro módulo foi executado.
- O sandbox inicialmente bloqueou subprocessos do Vite/Vitest com EPERM; a mesma seleção passou com execução aprovada fora do sandbox. Prettier foi executado via Node local porque o fallback `pnpm exec` não encontrou seu binário.
- `pnpm lint`: aprovado, incluindo Prettier.
- `pnpm --filter @study-platform/web typecheck`: aprovado.
- `pnpm --filter @study-platform/web build`: aprovado; somente o aviso já conhecido de chunk acima de 500 kB.
- `pnpm typecheck` e `pnpm build`: bloqueados por TS2412 em `apps/api/src/modules/auth/email.repository.ts:466`, atribuição de `string | undefined` a propriedade opcional `string` com `exactOptionalPropertyTypes`. Trecho comparado ao HEAD: idêntico. Backend preservado, sem correção fora do escopo.
- Comparação AST com HEAD: statements anteriores ao retorno do componente e todas as propriedades funcionais JSX (`on*`, disabled, value, ref, required, maxLength, type, key, aria-busy, aria-label, aria-describedby, open, autoFocus, tabIndex) idênticos. Somente imports decorativos, wrappers, classes e variantes visuais diferem.
- `git diff --check`: aprovado.

## Matriz UI em navegador

Script focado `browser-validation.cjs` usa Chromium, a API local existente e duas contas de demonstração previamente cadastradas. Nenhum seed, reset, criação, gravação ou exclusão de rotina. Dados de lista/programação e campos de edição recebidos da API real; texto longo é digitado somente no formulário não salvo. Loading atrasa o transporte e erro interrompe somente requisições de Rotinas no navegador, sem respostas de dados inventadas.

- 62 combinações aprovadas, registradas em `validation/results.json`.
- Claro/escuro × 320/375/768/1280 px: lista real e vazio real, formulário, texto longo não salvo; confirmação de exclusão para conta com rotina.
- Sem overflow horizontal no documento ou cards/inputs/selects/botões fora da largura disponível.
- Programação com sete dias preservada: uma coluna em mobile, duas em tablet e três em desktop; nomes, fuso e intervalos locais originais, sem conversão ou duração calculada.
- Foco inicial no nome, adicionar/remover horário sem salvar, cancelamento com foco no título, confirmação com foco em Manter rotina e Escape devolvendo foco ao botão Excluir.
- Loading e erro inicial inspecionados em 320 px nos dois temas: nenhum vazio durante loading/erro, botões disabled no carregamento, retry retorna à lista real. Hover/focus nas ações após retry.
- Movimento reduzido respeitado: transições computadas de 0.01 ms conforme regra global existente; CSS local suprime animações/transições da página e portal.
- Screenshots inspecionadas para lista desktop clara, formulário mobile escuro, confirmação mobile clara e vazio tablet escuro. Evidências PNG mantidas fora do repositório em `C:/Users/vinic/.codex/visualizations/2026/10/05/01a10e4b-86ca-7c30-b2a7-b8a47c972fde/routines/`.
- Sucesso, falha de gravação/exclusão e envio cobertos pelos cinco testes UI existentes; não foram geradas mutações persistentes para produzir screenshots desses estados. Não há paginação nos dados reais disponíveis; composição e propriedades funcionais da paginação foram comparadas ao HEAD.

## Estado de conclusão

O apply foi inicialmente pausado com 8/10 tarefas, aguardando correção do backend conforme escolha do usuário. Em seguida, o usuário autorizou explicitamente incluir essa correção no mesmo apply.

## Retomada e correção autorizada de e-mail

- Estado Git da retomada: somente RoutinesPage.tsx e routines.css modificados e esta pasta de planejamento untracked; nenhum novo diff externo.
- Adicionada tarefa 3.5 e documentada exceção em proposal.md/design.md: somente o fallback de `newEmail` em email.repository.ts.
- O valor consultado é guardado em variável local e atribuído somente se definido e se o propósito for email_changed. O operador `||=` continua preservando o valor válido já recebido. Sem mudança de endpoints, consultas, destinatário, contratos ou fluxo de entrega.
- `pnpm lint`, `pnpm typecheck` e `pnpm build` gerais: aprovados após a correção. Build mantém apenas aviso de chunk acima de 500 kB.
- Testes UI e evidências anteriores permanecem válidos: nenhuma alteração adicional da web na retomada. Nenhuma suíte backend, banco, autenticação ou geral executada, respeitando a restrição do usuário.
- `git diff --check`: aprovado. Escopo final de código: somente os dois arquivos locais de Rotinas e o guard pontual autorizado em email.repository.ts.
- Conclusão: tarefas finalizadas e arquivos explícitos preparados para o commit único; sem push, tag ou archive.
