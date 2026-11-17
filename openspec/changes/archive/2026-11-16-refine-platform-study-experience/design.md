# Design

## Context

A Home já tem uma área de rolagem com desfoque para Tarefas em `DashboardPage.tsx`. O card Matérias renderiza uma matéria destacada. A web usa primitivas compartilhadas `dialog`, `alert-dialog` e `form-modal` no pacote de UI.

## Goals / Non-Goals

**Goals**

- Reutilizar as primitivas compartilhadas e preservar o comportamento dos fluxos manuais.
- Entregar preferências por conta compatíveis com registros existentes.

## Decisions

- Estender os contratos e a persistência de preferências existentes. Usar gates de rota e operações de sessão para Pomodoro e usar o controle de Relatório na composição do menu. Preservar histórico e dados ao alternar preferências.
- Reutilizar a rolagem de Tarefas na Home com variação de desfoque. Obter uma prévia de baralhos ordenada a partir dos totais completos autorizados da conta, evitando ordenar só a página atual da listagem. Preservar a matéria destacada e os rodapés.
- Usar o contêiner do diálogo como superfície visual, ajustando os formulários que hoje adicionam outra borda. Manter as primitivas de foco e confirmação e usar um elemento visual menor para o hover de fechar.
- Usar origem interna explícita e um destino padrão por recurso para os botões de retorno. Manter a composição da navegação móvel conforme o shell existente.
- Manter pergunta, resposta e avaliações dentro da altura disponível para a revisão. Aplicar a animação apenas na troca de cartão e navegar após confirmação da avaliação final pelo servidor. Entregar o toast uma única vez no destino.

## Risks / Trade-offs

- Textos longos ou pouca altura podem exigir rolagem na área interna de leitura. Os controles de avaliação permanecem alcançáveis.
- Uma sessão Pomodoro pode estar em andamento quando a preferência muda. Preservar seu registro e validar a retomada após reativação sem duplicar eventos.

## Migration Plan

Adicionar as preferências com migration versionada e valores iniciais ativos. Implantar a API compatível com atualizações parciais antes da interface que envia os novos campos.
