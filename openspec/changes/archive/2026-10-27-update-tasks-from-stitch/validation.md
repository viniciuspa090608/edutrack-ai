# Validação — update-tasks-from-stitch

Data: 04/10/2026. Implementação restrita à apresentação de Tasks e à classe de escopo da rota em PrivatePage.

## Resultado

- Listagem, filtros, cards, detalhe inline, criação/edição, subtarefas, progresso, confirmações e feedback compartilham superfícies, controles e tokens locais.
- Tema claro usa cards claros e faixas suaves; tema escuro usa superfícies próprias e acentos ajustados pelos tokens do produto. Portais recebem explicitamente o escopo de tema.
- Conclusão em lote usa ação primária; exclusões usam ação destrutiva; erros continuam destrutivos em ambas as situações.
- APIs, contratos, handlers de negócio, ordenação, paginação, preferências, cálculos e rotas foram preservados. Nenhum arquivo de backend, contratos ou componente de Subjects foi modificado.
- O shell recebeu somente `tasks-module` na rota `/app/tarefas` para ajustar seu título existente sem duplicar h1 ou afetar outras rotas.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| UI focada de Tasks: TasksPage, SubtasksSection e TaskConfirmation | 3 arquivos, 22 testes aprovados |
| Confirmações/subtarefas após o último ajuste de aparência do alerta | 2 arquivos, 9 testes aprovados |
| `pnpm lint` | Aprovado, incluindo formatação |
| `pnpm typecheck` | Aprovado |
| `pnpm build` | Aprovado; aviso do bundle web acima de 500 kB, sem falha |
| `openspec validate update-tasks-from-stitch --strict` | Aprovado |
| `git diff --check` | Aprovado |

Os quatro testes adicionados verificam dados reais do contrato e campos opcionais em cada tema, preservação de formulário/portal ao alternar tema e payload de edição sem status manual nem matéria quando há subtarefas e a preferência está desativada. Os testes existentes continuam cobrindo autenticação, CRUD, intervalos de data, paginação, erros/retry, retenção de valores, duplicação de submissão, foco/teclado, reordenação, conflitos, confirmação explícita e arredondamento de progresso.

Não foram executados testes gerais do projeto, de backend, banco ou outros módulos. As chamadas HTTP locais descritas abaixo são verificação manual do fluxo existente, não execução das suítes do backend.

### Execução no ambiente

O wrapper `pnpm` disponibilizado inicialmente ao agente apresentou falha de carregamento da dependência nativa do Tailwind no bundler. Processos do Vitest também encontraram `spawn EPERM` no sandbox. As verificações passaram usando Node do sistema e o mesmo CLI pnpm disponibilizado no runtime, com permissão para iniciar processos. O Vitest usou `--configLoader native`, mantendo a configuração do projeto intacta:

```text
node node_modules/vitest/vitest.mjs run --config vitest.config.ts --configLoader native src/features/tasks/TasksPage.spec.tsx src/features/tasks/SubtasksSection.spec.tsx src/features/tasks/TaskConfirmation.spec.tsx
```

Diretório: apps/web. Nenhuma mudança de dependência, lockfile, configuração de Vite/Vitest ou script de projeto foi necessária. Web/API já acessíveis em localhost foram usadas; o processo de API iniciado pelo agente que falhou foi encerrado, sem interromper os serviços existentes.

## Navegador e dados reais

Conta demonstrativa local existente, sem seed/reset ou dados estáticos na aplicação. O ZIP foi extraído somente em diretório temporário; seus scripts não foram executados.

Fluxos observados:

- Criar tarefa com título longo e descrição; abrir detalhe após salvar.
- Editar importância e status manual, confirmando o salvamento.
- Trocar tema pela landing existente, com formulário aberto, preservando título e seleção de status.
- Adicionar duas subtarefas à tarefa criada, concluir uma e observar 1/2 e 50%.
- Mover a segunda para cima e verificar ordem persistida e anúncio de posição.
- Cancelar a conclusão em lote, reabrir a confirmação, confirmar e observar 100%; reabrir um passo e retornar a 50%.
- Editar título de subtarefa; abrir/cancelar exclusão de subtarefa e de tarefa, com foco retornando aos controles apropriados.
- Aplicar/limpar filtros de status e importância reais sem ordenar a lista no cliente.
- Submeter formulário vazio no tema escuro e observar validação, campo inválido, foco e alerta.

A atualização do prazo date-only foi confirmada por chamada real da API; validação e envio do campo na UI são cobertos pela suíte focada. A automação do input de calendário do navegador não confirmou o envio do valor preenchido via `fill`, portanto não é apresentada como evidência de edição de prazo pela UI.

Ao terminar, uma chamada autenticada à API verificou a ordem e o estado parcial, alterou o prazo da tarefa temporária, excluiu sua subtarefa pendente (total 1, progresso 100%, status COMPLETED), excluiu a tarefa temporária e confirmou GET 404 e total original de 18 tarefas. Exclusões efetivas foram feitas via API somente nos registros criados nesta validação; confirmações visuais de exclusão foram canceladas no navegador. Ver `live-api-validation.json`. Nenhum registro preexistente foi editado/excluído.

## Responsividade, tema e acessibilidade

`browser-layout-validation.json` registra 36 medições de listagem/filtros, criação, detalhe/subtarefas, edição com status derivado e confirmação nas larguras 320, 375, 768 e 1280 px, nos dois temas. Todas apresentam scrollWidth do documento menor ou igual à viewport, e scrollWidth dos containers/modal menor ou igual ao seu clientWidth. Um crescimento intrínseco do grid de subtarefas encontrado em 320 px foi corrigido com tracks `minmax(0, 1fr)` e quebra de texto.

- Seletores nativos, títulos/descrições longos, ações flexíveis e scroll vertical de modais foram inspecionados.
- Inputs têm foco visível; estados selected e disabled permanecem semânticos. Controles continuam rotulados, com nomes completos acessíveis mesmo quando o texto visual da ação é compacto.
- Mensagens usam status/alert existentes e ícones decorativos têm aria-hidden.
- Contagens e aria de progresso continuam usando os valores recebidos; tarefas sem subtarefas não recebem percentual.
- Regras locais de `prefers-reduced-motion: reduce` removem transições/animações de Tasks; a regra global existente também cobre overlays dos portais. Essas regras foram revisadas; não houve mudança da preferência de movimento do sistema operacional.
- Amostras de texto principal/secundário, badges de importância/status, progresso e botão primário foram medidas contra backgrounds computados: mínimo 5,15:1 no claro e 5,05:1 no escuro, acima de 4,5:1. Não se trata de auditoria exaustiva de todos os pixels/estados.
- Tema inicial claro foi restaurado; overrides de viewport foram removidos ao terminar.

Evidências visuais:

- `tasks-light-desktop.jpg`: cards claros, dados demo preexistentes após limpeza.
- `tasks-dark-desktop.jpg`: cards escuros e progresso completo com dados demo preexistentes.
- `tasks-dark-editor-mobile.jpg`: criação em 320 px no tema escuro.

## Observação preexistente fora do escopo

Na amostra demo, o filtro PENDING com importância HIGH ou LOW retornou tarefa cujo DTO exibe IN_PROGRESS por conter subtarefas parcialmente concluídas. O repository atual filtra o status persistido enquanto o service deriva o status do DTO pelas contagens. Essa inconsistência já pertence à API/dados existentes; a web continua exibindo a resposta confirmada e não adiciona filtro local para ocultá-la. Nenhuma correção de negócio foi incluída nesta alteração visual.

## Isolamento e revisão

O início do apply foi registrado em `baseline-git.txt`: HEAD `36c980afbe4b636e92e9e4d4226a5d2a5319418b`, branch master, nenhum diff tracked/staged; apenas esta proposta estava untracked. Subjects já estava commitado quando o apply começou. Revisão confirmou alterações de markup/estilos e testes locais, com preservação dos handlers/payloads. Os artefatos e evidências desta mudança serão incluídos no commit único, sem push, tag ou archive.
