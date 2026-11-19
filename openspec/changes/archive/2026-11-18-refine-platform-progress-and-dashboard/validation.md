# Evidências de validação

## Estado inicial

- Branch inicial: master; HEAD b97d1a620440c5a9a43e05f55fda3c137e697a8c.
- Alteração preexistente: somente a proposta não rastreada desta mudança.
- Implementação isolada em codex/refine-platform-progress-and-dashboard; outras changes preservadas.

## Verificação funcional

- Integração MySQL real com bancos temporários: paginação de 12 disciplinas em duas páginas, isolamento entre contas, ordenação, resumo oficial e bloqueio de módulo desativado.
- Respostas MODULE_DISABLED de leitura, agenda e exclusão de Rotinas disparam atualização das preferências; a rota autenticada passa ao estado explicativo com link de reativação, também quando a mudança veio de outra sessão.
- Rotinas: preferência persistida por conta/sessão; bloqueio de CRUD, agenda e serviço; reativação com dados intactos; regra do último módulo mantida. Migration aplicada, revertida e reaplicada em banco isolado; contas existentes recebem padrão ativo.
- Web: retry da mesma página sem perder itens, deduplicação e descarte de resposta obsoleta após refresh; acesso direto a Rotinas bloqueado e restaurado após preferências.
- Barras de disciplinas: null, 0%, valor positivo mínimo, 75%, valor próximo de 100% e 100%, sem arredondar extremos parciais como conclusão ou ausência.

## Navegador real

Conta de demonstração local autorizada explicitamente pelo usuário. Viewports 1440 × 1000 e 320 × 800; temas claro e escuro.

- Card Disciplinas em desktop: altura mantida em 304,8 px e largura 456 px. Área da lista aumentada de 128 para 154 px. TypeScript e Banco de dados ficam integralmente visíveis como nomes antes da rolagem. A tecla End alcança o fim e Home restaura o início; Matemática permanece acessível.
- Em 320 px, dashboard, disciplinas, relatório e conta têm scrollWidth igual ao clientWidth (310 px úteis com o gutter). A lista mantém rolagem local (168 px); End alcançou scrollTop 348 de scrollHeight 516. Barras acessíveis reais: Matemática 100, Banco de dados 75, TypeScript 0.
- Sete conquistas: borderColor, cor do ícone e background da barra correspondem aos sete tokens distintos nos dois temas. A regra de estado obtido deixou de sobrescrever a paleta.
- Botão Imprimir relatório em desktop: x 1139,95, y 168,71, 128,85 × 44 px durante loading, após disponibilidade e ao alternar Progresso/Estatísticas; erro recuperável também preserva a posição. Gutter estável elimina o deslocamento horizontal quando aparece rolagem. Em 320 px, título inteiro antecede botão em linha própria.
- Conta: orientação encontrada uma única vez abaixo de Conta; ordem real dos controles conferida: Tarefas, Disciplinas, Flashcards, Pomodoro, Rotinas, Relatório, Recursos de IA.
- Movimento reduzido: regras existentes de navegação preservadas e transição das barras novas explicitamente desativada por prefers-reduced-motion. Conferência por CSS, sem alterar a preferência do sistema operacional.
- Viewport e tema foram restaurados após a conferência. Nenhum dado de estudo foi alterado pela validação visual.

## Qualidade

pnpm lint, pnpm typecheck, pnpm test e pnpm build aprovados na validação da implementação. Suíte completa: 22 testes do workflow, 42 de contratos, 287 da API e 302 da web na primeira execução completa, mais três cenários posteriores para atualização de preferências após MODULE_DISABLED. O fluxo openspec:finish repete os quatro comandos antes do commit. O aviso existente de bundle maior que 500 kB não impede o build.

## Specs e conclusão

Sete snapshots locais revisados; requisitos não modificados e cenários posteriores preservados. Totais antes/depois: Conta 17/18; dashboard visual 17/18; preferências 10/11; conquistas 9/9; impressão 2/3; disciplinas 12/12; dashboard funcional 7/7. Manifesto declara arquivos individuais e fontes revisadas. Commit e archive devem ser confirmados pelo journal local e pelo resultado do comando de conclusão; não há push ou tag.
