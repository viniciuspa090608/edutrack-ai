# Tasks

## 1. Preparação e preservação

- [x] 1.1 Registrar Git no início do apply e separar alterações preexistentes da landing/tema em registro de status/diff; confirmar acesso ao ZIP de referência.
- [x] 1.2 Registrar baseline dos testes do dashboard com execução filtrada; confirmar disponibilidade dos builds workspace sem executar testes de outros módulos.

## 2. Apresentação do dashboard

- [x] 2.1 Refatorar renderização de DashboardPage e extrair somente componentes locais necessários, preservando load, begin, listeners e chamadas existentes; verificar os testes atuais de recarga e Pomodoro.
- [x] 2.2 Compor saudação, indicadores, tarefas, matéria destacada, foco, revisões e progresso conforme mapeamento do design; preservar todas as informações e links existentes; conferir os seis resumos e destinos com payload válido.
- [x] 2.3 Representar prioridade/subtarefas e progresso oficial de tarefas e matéria com primitives existentes, distinguindo null de zero e preservando ordem, prazos e aviso de tarefas sem prazo; verificar fixtures de percentual nulo, zero e progresso parcial.
- [x] 2.4 Criar gráfico semanal local de barras com week.series e alternativa textual; preservar todas as métricas, frequência, unidades, fuso, período, cobertura e asOf sem preenchimento fictício; verificar valores das barras contra série conhecida e valores ausentes.
- [x] 2.5 Adaptar loading inicial/atualização, vazio por seção, erro global/parcial e módulos desabilitados; evitar indicadores duplicados ou valores inventados; verificar cenários loading, empty, error e módulo omitido.
- [x] 2.6 Aplicar estilos limitados ao dashboard, tokens globais, layout flexível desktop/mobile e movimento reduzido sem alterar shell, outras páginas ou dependências; conferir em navegador ambos os temas e largura mínima.

## 3. Validação restrita ao front-end afetado

- [x] 3.1 Atualizar DashboardPage.spec.tsx preservando cenários existentes: loading/retry, falha parcial, preferências, prazo local, link contextual, sessão/autenticação e reconciliação de Pomodoro.
- [x] 3.2 Acrescentar cenários relevantes de apresentação: métricas reais, série/zeros/valores ausentes, null de progresso, histórico indisponível, seção desabilitada e alternativa textual do gráfico.
- [x] 3.3 Executar somente `pnpm --filter @study-platform/web exec vitest run --config vitest.config.ts src/features/dashboard/DashboardPage.spec.tsx` e arquivos de teste locais novos explicitamente enumerados. Não executar pnpm test, suíte completa da web, backend ou testes de módulos não alterados.
- [x] 3.4 Executar `pnpm --filter @study-platform/web lint`, `pnpm --filter @study-platform/web typecheck`, `pnpm --filter @study-platform/web build` e check de formatação apenas nos arquivos alterados; registrar resultados e falhas preexistentes sem editar escopo externo.
- [x] 3.5 Comparar visualmente telas preenchidas/vazias com Stitch em claro/escuro e larguras 320/375/768/1024/1440; validar teclado, foco, contraste, movimento reduzido e ausência de overflow, incluindo cenários de erro.
- [x] 3.6 Revisar diff para confirmar ausência de alterações em API, contratos, backend, shell, landing, outras páginas e dados mockados em runtime.

## 4. Conclusão do apply

- [x] 4.1 Atualizar tasks com resultados reais, revisar diff staged e executar git diff --cached --check, adicionando somente arquivos/hunks desta mudança.
- [x] 4.2 Se todas as tarefas/verificações estiverem concluídas, criar exatamente um commit `[update] atualizar apresentação do dashboard` incluindo tasks final; confirmar hash e arquivos. Não criar commit de conclusão em caso de falha, nem commit vazio, push ou archive.


## Registro do apply

- Git inicial: somente a pasta desta proposta estava untracked; nenhum arquivo de implementação preexistente modificado. ZIP disponível. Baseline: 9 testes do dashboard aprovados. Dependências restauradas com lockfile congelado; execução requer ambiente com acesso aos executáveis instalados.


- Implementação: somente apresentação de DashboardPage, DashboardWeeklyChart e dashboard.css; lógica load/begin preservada, sem alterações em contratos, APIs, dependências ou shell.
- Verificação: 13 testes aprovados em DashboardPage.spec.tsx e DashboardWeeklyChart.spec.tsx; lint, typecheck e build da web aprovados. Build informa aviso de bundle acima de 500 kB.
- Validação visual com Edge/Playwright e fixtures contratuais interceptadas apenas no teste: 30 variantes (empty/populated/error, claro/escuro, 320/375/768/1024/1440), sem overflow ou pageerror. Capturas desktop/mobile inspecionadas; foco com outline visível e preferência reduce aplicada.
- A pasta update-auth-screens-from-stitch surgiu durante o apply e será preservada fora do commit.
