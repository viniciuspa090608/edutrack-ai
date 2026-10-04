# Proposal

## Why

As sessões e o histórico do Pomodoro ainda usam uma apresentação básica, distante do novo padrão de Tasks e Matérias. Aplicar a intenção visual do Stitch ao fluxo inteiro torna tempo, estado, contexto e ações mais claros sem mudar seu funcionamento.

## What Changes

- Atualizar visualmente preparação/início, execução, pausa, espera entre blocos, conclusão/cancelamento, histórico, totais, seleção de matéria/tarefa, confirmação, loading, erros e vazios existentes do Pomodoro.
- Usar cards suaves, hierarquia consistente, timer em destaque, progresso do bloco, badges e controles coerentes com Tasks e Matérias, em temas claro e escuro e desde 320 px.
- Derivar superfícies sem referência completa; corrigir a intenção visual de protótipos quebrados ou incompatíveis em vez de copiar HTML.
- Preservar APIs, estados, handlers, sincronização, duração, contabilização, preferências e vínculos existentes. Não criar timer de intervalo, ciclos fixos, configurações, novas rotas ou telas de detalhe/conclusão.
- Conforme esclarecimento do usuário, “Sessões de Estudo” nesta mudança significa as sessões e histórico do Pomodoro. Revisão de flashcards e seu histórico ficam fora do escopo.

## Capabilities

### New Capabilities

- `pomodoro-visual-experience`: requisitos visuais observáveis para todas as interfaces existentes de sessões Pomodoro, com fidelidade aos dados, estados, temas, acessibilidade e responsividade.

### Modified Capabilities

Nenhuma. Não há especificação principal específica do Pomodoro em `openspec/specs`; a mudança adiciona somente seu contrato de apresentação. As regras documentadas nas mudanças concluídas continuam preservadas.

## Impact

Principalmente `apps/web/src/features/pomodoro/PomodoroPage.tsx`, `apps/web/src/styles/pomodoro.css` e testes de UI próximos. Componentes de apresentação locais podem ser extraídos quando usados concretamente. Reutilizar componentes UI, tokens de tema, `SubjectSelect` e `SubjectName` sem redesenhar módulos compartilhados. Sem alteração em backend, contratos, persistência, dependências ou navegação global. Testes executados no apply limitados à UI diretamente afetada, conforme pedido; lint/typecheck/build continuam verificações de qualidade sem suíte geral.
