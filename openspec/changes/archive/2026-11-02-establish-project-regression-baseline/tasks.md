# Tasks

## 1. Estado inicial e diagnóstico

- [x] 1.1 Registrar branch e `git status`, preservar `.env` e a proposta preexistente `add-account-ai-provider-settings`, criando branch `codex/establish-project-regression-baseline` se necessário; verificar inventário inicial sem valores secretos.
- [x] 1.2 Criar `validation/regression-matrix.md` relacionando requisitos atuais, fluxos, assertions e testes existentes em contratos/API/web; verificar cenário positivo, falha relevante e isolamento aplicável para cada fluxo crítico da spec.
- [x] 1.3 Conferir MySQL e permissões em banco temporário próprio, configuração sintética e guardas de cleanup; verificar que bancos de desenvolvimento e teste diferem e que falha de conexão não vira skip ou mock.
- [x] 1.4 Executar baseline inicial de `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` em sequência, documentando falhas e resultados em `validation/baseline-results.md`; verificar classificação entre infraestrutura, fixture e defeito, sem alterar código antes do registro.

## 2. Cobertura de regressão dos módulos atuais

- [x] 2.1 Completar lacunas de contratos, autenticação/sessão, confirmação e recuperação de e-mail, perfil e preferências; verificar cenários negativos relevantes e isolamento de duas contas reutilizando suites existentes.
- [x] 2.2 Completar lacunas de tarefas/subtarefas, matérias e roadmaps manuais e rotinas; verificar persistência, validação, permissões e ausência de alteração em recursos de outra conta com MySQL real.
- [x] 2.3 Completar lacunas de Pomodoro, flashcards manuais/importação/revisão, dashboard, analytics e conquistas; verificar transições críticas, idempotência prevista e fixtures de tempo determinísticas nos testes associados à matriz.
- [x] 2.4 Completar testes de componentes para estados de loading/erro/vazio/sucesso e ações críticas dos fluxos da matriz; verificar comportamento visível, teclado e preferências de módulos, sem duplicar testes que já comprovem o cenário.

## 3. Proteções antes da mudança de IA

- [x] 3.1 Cobrir parser com IA ausente, trio global atual completo e combinações parciais incluindo apenas `AI_RECEIPT_KEY`; verificar rejeição por nome de variável e ausência de segredos nas mensagens, sem mudar o contrato atual para aceitar fixtures inválidas.
- [x] 3.2 Cobrir geração de roadmap, regeneração e flashcards com HTTP externo simulado, saída válida/inválida/excessiva, recusa e timeout; verificar contratos e ausência de persistência antes da confirmação em serviços reais.
- [x] 3.3 Cobrir IA/módulo desativados e recurso alheio; verificar nenhuma chamada ao provedor e continuidade das operações manuais com IA ausente ou indisponível.
- [x] 3.4 Cobrir confirmação, recibos adulterados/vencidos, repetição e proteção de progresso conforme cada spec; verificar resultados persistidos em MySQL sem duplicação ou perda de dados anteriores.

## 4. Correções demonstradas

- [x] 4.1 Para cada defeito encontrado, registrar requisito violado e reprodução mínima com teste falhando antes de corrigir; verificar evidência no relatório e separar erros de infraestrutura/configuração de defeitos de produto.
- [x] 4.2 Corrigir somente os defeitos reproduzidos com mudanças mínimas e verificar os testes focados e fluxos afetados; se nenhum defeito for encontrado, registrar explicitamente que não houve correção de produção necessária.
- [x] 4.3 Corrigir fixtures, relógios, lifecycle e descoberta de testes quando houver causa comprovada; verificar execução determinística sem enfraquecer assertions, skips, retries indiscriminados ou aumento de timeout.
- [x] 4.4 Verificar visualmente páginas se alguma correção afetar layout, com teclado e largura de 320 px; registrar evidência ou justificar que nenhuma alteração visual ocorreu, distinguindo testes jsdom de validação de navegador.

## 5. Execução reproduzível e conclusão

- [x] 5.1 Conferir alcance dos comandos raiz e do workflow existente e ajustar somente lacunas comprovadas; verificar suites executadas, propagação de falhas e paridade da configuração com MySQL nativo e lockfile congelado, sem alegar execução remota não realizada.
- [x] 5.2 Atualizar README com execução, configuração de testes e diagnóstico de IA parcial; finalizar matriz e relatório com testes reutilizados/adicionados, resultados antes/depois e limitações, verificando ausência de segredos e lacunas críticas pendentes.
- [x] 5.3 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` finais com MySQL real isolado; registrar aprovação dos quatro sem consumo de APIs comerciais e sem resetar dados de desenvolvimento.
- [x] 5.4 Preparar manifesto próprio e snapshots de `quality-commands` com merge semântico preservando requisitos existentes, revisar diff staged e executar `git diff --cached --check`; verificar que proposta de IA e alterações preexistentes não integram o manifesto.
- [x] 5.5 Após todas as tarefas e checks aprovados, executar `pnpm openspec:finish --change establish-project-regression-baseline --manifest .openspec-local/establish-project-regression-baseline-manifest.json --message "[update] consolidar testes de regressão e corrigir falhas comprovadas"`; verificar commit único final, sync/archive e hash/arquivos, sem push ou tag. Em falha, manter conclusão pendente e retomar journal conforme README.
