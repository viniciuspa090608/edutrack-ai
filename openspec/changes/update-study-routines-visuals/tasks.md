# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD e `git status --short` em `validation.md`; identificar e preservar alterações preexistentes, verificando que o diff desta mudança possa ser separado.

## 2. Apresentação local

- [x] 2.1 Atualizar cabeçalho, contexto, espaçamento e destaque das ações em RoutinesPage.tsx/routines.css usando as referências de Tarefas, Matérias e Pomodoro do design; verificar que título, Criar rotina e Atualizar programação estejam legíveis e acessíveis.
- [x] 2.2 Harmonizar cards da lista, metadados, paginação e grade dos sete dias, preservando somente os dados exibidos atualmente; verificar nomes/fusos/intervalos reais, dias sem horários e controles de página sem alterar filtros ou cálculos.
- [x] 2.3 Ajustar apresentação do formulário inline e dos slots com componentes existentes; verificar os mesmos campos, labels, ajuda, ações, disabled, valores e foco, sem modificar handlers, efeitos, refs ou validações.
- [x] 2.4 Estilizar loading, erro, vazio, sucesso e confirmação de exclusão com tokens existentes e classe local no portal; verificar que condições e mensagens permaneçam idênticas e que nenhuma variante dependa apenas de cor.

## 3. Verificação da página

- [x] 3.1 Revisar o diff e confirmar ausência de mudanças funcionais em Rotinas, dados fictícios, novos campos/ações, componentes globais, outras páginas, API e contratos; registrar o resultado em validation.md. Única exceção de backend autorizada: correção pontual descrita em 3.5.
- [x] 3.2 Executar somente os cinco testes UI diretos usando `pnpm --filter @study-platform/web test src/features/routines/RoutinesPage.spec.tsx -t 'creates and removes|validates overlaps|edits saved|confirms deletion|shows loading'`; ajustar somente expectativas afetadas e verificar renderização com dados/vazio, envio, falhas, edição, exclusão e foco. Não executar os dois casos de autenticação do arquivo nem outras suítes.
- [x] 3.3 Inspecionar a própria página nos temas claro/escuro em 320, 375, 768 e 1280 px, incluindo lista, programação, formulário e diálogo, com dados reais disponíveis; verificar overflow, quebra de textos, teclado, focus/hover/selected/disabled e movimento reduzido, registrando evidências e limitações reais em validation.md.
- [x] 3.4 Executar `pnpm lint`, `pnpm typecheck` e `pnpm build` como verificações estáticas/compilação e registrar resultados; não executar `pnpm test` geral, backend, banco, autenticação ou testes de outros módulos.
- [x] 3.5 Corrigir TS2412 no fallback de newEmail em email.repository.ts, conforme autorização do usuário; verificar no diff que o valor existente é preservado e que o fallback só é atribuído quando definido, confirmando aprovação de typecheck/build gerais sem modificar rotas ou contratos.

## 4. Conclusão e versionamento

- [x] 4.1 Finalizar tasks.md somente após implementação e verificações aprovadas; adicionar explicitamente somente arquivos/hunks desta mudança, revisar staged e executar `git diff --cached --check`; criar exatamente um commit `[update] alinhar visual das rotinas de estudo` e confirmar hash/arquivos incluídos. Não criar commit vazio ou de apply incompleto, tag, push ou archive.
