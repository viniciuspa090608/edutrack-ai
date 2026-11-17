# Spec Delta

## ADDED Requirements

### Requirement: Troca e conclusão na revisão de baralho

A revisão de um baralho SHALL manter a página sem rolagem durante a sessão, acomodando textos excepcionalmente longos em uma área interna de leitura quando necessário. A troca de cartão SHALL usar um fadeInLeft sutil e respeitar movimento reduzido. Ao salvar com sucesso a última avaliação da sessão, SHALL retornar ao resumo do mesmo baralho atualizado e exibir uma vez o toast “Revisão concluída”.

#### Scenario: Troca e conclusão na revisão de baralho

- **WHEN** a pessoa avança entre cartões e conclui a última avaliação com sucesso
- **THEN** a troca preserva o layout, a sessão retorna ao resumo do baralho e o toast aparece uma vez.

### Requirement: Falha na última avaliação

Ao falhar o salvamento da última avaliação, a revisão SHALL permanecer disponível para nova tentativa e comunicar o erro.

#### Scenario: Falha na última avaliação

- **WHEN** a avaliação final falha
- **THEN** a pessoa permanece na revisão e o toast de conclusão não aparece.
