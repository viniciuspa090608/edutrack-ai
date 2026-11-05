# Proposal

## Why

Hoje, o estudo programado começa em uma lista de cartões pendentes, separada da lista de baralhos. A disposição do Anki Desktop torna mais direto identificar o que estudar, iniciar uma sessão e avaliar cada resposta.

## What Changes

- Apresentar os baralhos em linhas compactas, com matéria ao lado do nome, filtro por matéria e três colunas de contagem da fila.
- Abrir uma visão de estudo com o nome do baralho ou da matéria, resumo da fila e a ação principal **Estudar agora**. O escopo por matéria reúne todos os seus baralhos vinculados.
- Organizar a revisão em área de leitura central e área inferior de ações. Após revelar a resposta, exibir as quatro avaliações com seus intervalos previstos, inclusive em telas estreitas.
- Reutilizar o tema, os componentes e a navegação autenticada do EduTrack. Manter acessíveis o gerenciamento, a consulta manual e o histórico.

## Capabilities

### New Capabilities

### Modified Capabilities

- `manual-flashcards` — lista compacta, contadores por baralho e filtro por matéria.
- `spaced-repetition` — resumo e sessão por escopo, disposição da revisão e prévia dos intervalos.

## Impact

A mudança abrange a interface web de flashcards, os contratos públicos e as consultas do módulo de flashcards na API. A prévia reutiliza a política de repetição espaçada vigente.
