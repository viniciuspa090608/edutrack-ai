# Design

## Context

Ver `proposal.md` para a motivação. `RoutinesPage.tsx` concentra a apresentação e o estado atual; `routines.css` define regras básicas locais. A página já utiliza Button, Input, NativeSelect, Card, FieldSet, Alert, Skeleton, Pagination e AlertDialog de `packages/ui`.

Inventário observado: criar/editar formulário inline; nome e fuso IANA; slots com dia, início e fim; adicionar/remover slots; salvar/cancelar; listar nome, fuso e quantidade de horários; editar/excluir com confirmação; atualizar programação; paginação; sete dias com nome, intervalo local e fuso ou “Sem horários.”. Não há matéria, ativação, duração calculada, métricas ou status de rotina. Loading, erros e mensagens de sucesso já possuem condições próprias, com preservação de valores após falha e retorno de foco.

Referências concretas: `tasks.css` e `pomodoro.css` usam superfície suave, gap de 1.5rem, padding de 1.25rem, contorno semântico, raio de 1rem em cards e sombra discreta. Cabeçalhos usam tipografia fluida próxima de 1.65–2.25rem, textos secundários de 0.875rem e toolbar flexível. `subjects.css` reforça espaçamento e hierarquia similares. `CollectionEmptyState.tsx` e `collection-empty-state.css` oferecem o padrão existente para vazio. O shell autenticado controla a largura externa.

## Goals / Non-Goals

**Goals:** aplicar os padrões observados com CSS local e composição JSX pontual; manter legibilidade e ações acessíveis nos dois temas em 320 px, mobile, tablet e desktop.

**Non-Goals:** extrair abstrações, alterar componentes globais, substituir o formulário inline por modal, alterar lógica/estado, adicionar dados ou atualizar telas de referência.

## Decisions

1. **Superfície e hierarquia locais.** Manter largura do shell; organizar cabeçalho/contexto/ações, formulário quando aberto, lista com paginação e programação semanal. Reutilizar escala de espaçamento, raio e sombra das referências. Criar rotina e Salvar rotina são ações primárias; atualizar/editar/cancelar/remover horário são secundárias; exclusão usa a variante destrutiva existente. Uma nova identidade ou layout com painéis sem dados seria incompatível com o escopo.
2. **Cards compactos e programação legível.** Nome é o título; fuso e quantidade de horários permanecem metadados da lista. Na programação, manter os sete dias, os intervalos locais existentes e seu fuso, sem conversão, cálculo de duração, badges de status ou novas consultas. A grade se adapta à largura e empilha em mobile; textos longos e controles devem quebrar sem overflow.
3. **Formulário preservado.** Ajustar classes, agrupamento visual e distribuição de campos, preservando labels, descrição IANA, ajuda de horários, índices/keys, disabled, validação, handlers e refs. Não alterar montagem condicional, seleção de dias, limites ou requisições. Manter foco inicial, foco após remover horário e retorno após salvar/cancelar/excluir.
4. **Tokens e componentes existentes.** Consumir background, card, foreground, muted-foreground, border, primary, ring e destructive; aliases locais derivados desses tokens se necessários. Reutilizar os componentes atuais; usar CollectionEmptyState somente se couber sem adicionar ação ou fluxo. Não modificar o componente compartilhado. Escopar CSS à página e aplicar classe própria ao AlertDialogContent, pois o portal fica fora dela. Preservar semântica acessível do diálogo e suas condições de fechamento.
5. **Estados sem mudança de significado.** Estilizar as condições atuais de busy, error, message, list, schedule, editing e deleting; não unificar loading/erro/vazio. Manter botões bloqueados, mensagens existentes e ausência de sucesso antes da confirmação. Evitar remontagem ou novo estado para fins visuais.
6. **Verificação focada.** O arquivo `RoutinesPage.spec.tsx` mistura UI de rotinas e autenticação. Executar apenas os cinco casos diretos da página com filtro por nome: `pnpm --filter @study-platform/web test src/features/routines/RoutinesPage.spec.tsx -t 'creates and removes|validates overlaps|edits saved|confirms deletion|shows loading'`. Não executar os casos `protects direct routes` ou `renders authenticated routines`, nem suites de backend/banco/outros módulos. Ajustar somente expectativas afetadas pela apresentação; acrescentar cobertura de renderização somente para lacuna concreta. Mocks de transporte nos testes existentes não autorizam mocks na aplicação. Executar `pnpm lint`, `pnpm typecheck` e `pnpm build` como verificações estáticas/compilação exigidas pelo projeto, sem rodar testes adicionais.

## Risks / Trade-offs

- [Mudanças JSX interferem em foco ou eventos] → manter handlers/refs/efeitos e verificar os fluxos UI existentes e teclado.
- [CSS vaza para outras telas ou não alcança o portal] → seletores locais e classe explícita para a confirmação, sem editar estilos globais.
- [jsdom não comprova tema e layout] → inspecionar a própria página em navegador nos dois temas, a 320, 375, 768 e 1280 px, com textos longos, controles e diálogo; verificar movimento reduzido.
- [Estados dependem da API local] → usar os dados reais disponíveis e testes UI focados para falhas/pending; registrar o que não puder ser inspecionado sem declarar validação concluída. Não criar fixtures de produção, seed ou reset.

## Migration Plan

Exceção autorizada após a implementação visual: corrigir somente o fallback de `presentation.newEmail` em `EmailRepository.deliverOne`. Guardar o e-mail consultado em variável local e verificar sua existência antes da atribuição, mantendo a preferência pelo valor já presente no payload. Quando não houver e-mail consultado, preservar a ausência do campo opcional. Não modificar endpoints, consultas, destinatário, entrega ou contratos. Validar por typecheck/build e revisão do diff; permanece a restrição do usuário contra testes backend/banco/autenticação.

Não há migração de dados. No apply registrar novamente Git, preservar alterações preexistentes, implementar apenas os arquivos locais e registrar resultados/limitações em `validation.md` nesta mudança. Após tarefas e verificações concluídas, criar exatamente um commit com implementação e `tasks.md` final, revisar staged e executar `git diff --cached --check`. Mensagem sugerida: `[update] alinhar visual das rotinas de estudo`. Confirmar hash e arquivos; sem commit vazio, push, tag ou archive automático. Rollback reverte somente o commit desta mudança.
