# Tasks

## 1. Preparação e contratos

- [x] 1.1 Registrar branch, HEAD e alterações preexistentes; usar branch codex adequada e confirmar que somente arquivos próprios entrarão no manifesto.
- [x] 1.2 Acrescentar routines aos contratos de preferências, sessão/onboarding e dashboard e definir coleção paginada de resumos; verificar schemas e consumidores com testes de contrato e typecheck.

## 2. Disciplinas na Home

- [x] 2.1 Implementar resumo paginado pelo serviço público de disciplinas com 10 itens, total, ordem estável e progresso oficial, evitando N+1; verificar integração em MySQL isolado com mais de dez disciplinas, pendentes, concluídas, sem plano e duas contas.
- [x] 2.2 Integrar primeira página no dashboard e Carregar mais na lista local, preservando resultados em falha e descartando respostas obsoletas; verificar acesso à última disciplina, retry, atualização após cadastro e omissão por preferência.
- [x] 2.3 Redistribuir espaço interno e compactar itens sem aumentar o card; comparar geometria antes/depois na mesma viewport, confirmar ao menos dois nomes curtos visíveis, rodapé fixo e rolagem até o último item por teclado e toque.

## 3. Progresso visual e relatório

- [x] 3.1 Adicionar Progress com percentual textual oficial nos cards de SubjectsPage; verificar 0%, 75%, 100%, valores próximos dos extremos e não calculável sem barra falsa.
- [x] 3.2 Conferir classes e cascata das conquistas e aplicar os tokens existentes a borda, ícone e barra; verificar as sete identidades no mural e dashboard nos dois temas e estados pendente, parcial e obtido.
- [x] 3.3 Reproduzir e medir o salto de Imprimir relatório sob carregamento lento, logo e mensagens variáveis; corrigir estrutura/estilos iniciais e confirmar posição estável em recarga e alternância Progresso/Estatísticas, mantendo gates e impressão unificada.

## 4. Preferências e Conta

- [x] 4.1 Criar migration aditiva e persistência de routines ativa por padrão em contas novas e existentes; verificar migration em MySQL real dedicado, leitura após login e independência das demais preferências.
- [x] 4.2 Aplicar gate de Rotinas em CRUD, agenda, rotas diretas e sidebar; verificar rejeição antes de leitura/escrita, outra aba, reativação sem perda de dados e manutenção do mínimo dos três módulos de estudo.
- [x] 4.3 Compartilhar a ordem de apresentação e incluir Rotinas na grade; verificar ordem Tarefas, Disciplinas, Flashcards, Pomodoro, Rotinas, Relatório, Recursos de IA por leitura visual e teclado, salvamento confirmado e retry em falha.
- [x] 4.4 Mover a orientação de salvamento para abaixo de Conta e remover a cópia lateral; verificar ocorrência única, navegação entre seções e preservação de drafts e salvamento explícito.

## 5. Validação e conclusão local

- [x] 5.1 Verificar no navegador desktop e 320 px, temas claro/escuro, teclado e movimento reduzido; registrar evidências de cores, barras, dimensões, scroll e estabilidade do botão, incluindo loading, erro e vazio aplicáveis.
- [x] 5.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build com testes de banco em MySQL real isolado; concluir somente se todas as verificações passarem.
- [x] 5.3 Validar a change com openspec validate refine-platform-progress-and-dashboard --strict; revisar merge semântico dos sete deltas em snapshots locais e manifesto explícito com plano sync conforme README, preservando requisitos posteriores e alterações alheias.
- [x] 5.4 Preparar a conclusão controlada: revisar os arquivos individuais do manifesto e o diff staged, executar git diff --cached --check e confirmar que somente os arquivos desta mudança estão preparados.

A finalização Git ocorre após o checklist de pré-requisitos: executar `pnpm openspec:finish --change refine-platform-progress-and-dashboard --manifest .openspec-local/refine-platform-progress-and-dashboard-manifest.json --message "[update] melhorar dashboard e preferências da plataforma"`, conferir commit único final, arquivos e archive idempotente, sem push/tag. Em falha, retomar o journal sem segundo commit. Esta obrigação permanece parte da conclusão do apply; o journal registra sua execução depois dos pré-requisitos porque o comando exige o checklist concluído antes de começar.
