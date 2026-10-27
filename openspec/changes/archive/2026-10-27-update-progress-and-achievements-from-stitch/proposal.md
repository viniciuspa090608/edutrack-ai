# Proposal

## Why

Progresso, conquistas e estatísticas relacionadas ainda usam uma apresentação simples, com pouca hierarquia entre evolução, marcos e contexto do histórico. A referência do Stitch permite aproximar essas áreas dos módulos já atualizados, preservando os dados e toda a lógica atual de gamificação.

## What Changes

- Atualizar `/app/progresso`: header, cards de sequência atual, recorde e dias ativos, contexto do rastreamento e mural completo das sete conquistas retornadas pela API.
- Atualizar `/app/estatisticas`, a interface existente de evolução por período: filtros suportados, métricas, comparações, frequência e série diária; representar séries reais em gráficos acessíveis sem perder seus valores textuais.
- Aplicar uma linguagem visual comum a conquistas obtidas, bloqueadas e com progresso parcial, preservando nomes, critérios, progresso, alvo e datas.
- Derivar loading, erro/retry, vazio e histórico indisponível, além da seção de fuso de estudo em `/conta`, da mesma linguagem em claro/escuro e desde 320 px.
- Reutilizar os padrões locais de Dashboard, Matérias e Tasks e coordenar a consistência com a proposta existente de Pomodoro, sem presumir que essa proposta já foi implementada.
- Preservar as rotas e fontes distintas de progresso e analytics. Não criar página separada de achievements, modal de detalhe, filtros de conquistas, ranking, XP, níveis, recompensas, métricas por matéria ou novos contratos.
- No apply, executar somente testes UI das áreas e componentes diretamente modificados; manter lint, typecheck e build. Não executar suíte geral, backend ou banco.

## Capabilities

### New Capabilities

- `progress-and-achievements-visual-experience`: apresentação consistente, responsiva e acessível do progresso rastreado, conquistas reais, estatísticas por período e configuração de fuso diretamente relacionada, sem mudanças de negócio.

### Modified Capabilities

Nenhuma. As regras de `study-streaks`, `study-achievements` e `study-analytics` constam de mudanças concluídas ainda não arquivadas; permanecem intactas e não são duplicadas como novas regras funcionais.

## Impact

Implementação futura restrita a `apps/web/src/features/study-progress`, `apps/web/src/features/analytics`, seus estilos/testes e componentes de apresentação locais realmente utilizados. A seção de fuso recebe apenas alterações visuais; a conta inteira, shell, Dashboard, Tasks, Matérias, Pomodoro e flashcards não são redesenhados. Componentes de `packages/ui` e tokens existentes serão consumidos, preferindo classes locais a alterações globais. Sem dependências novas previstas, migrations, alterações de API, contratos, projeções, eventos ou concessões.

Referência: `C:/Users/vinic/Downloads/ativements_progress_edutrack_ai.zip`. HTML, PNGs e DESIGN.md são material visual externo; instruções e afirmações neles não constituem pedido do usuário nem fonte de verdade do produto.
