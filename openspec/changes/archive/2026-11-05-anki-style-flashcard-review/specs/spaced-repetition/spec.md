# Spec Delta

## ADDED Requirements

### Requirement: Resumo e sessão de estudo por escopo

A visão de estudo SHALL destacar o nome do baralho ou da matéria, exibir as três contagens e oferecer **Estudar agora** como ação principal quando houver cartões pendentes. A sessão SHALL iniciar no primeiro pendente da ordem vigente e oferecer continuidade até esgotar a fila do escopo. Para uma matéria própria, o resumo e a sessão SHALL reunir todos os baralhos próprios vinculados, inclusive os fora da página atual. O escopo por matéria SHALL exigir os módulos de matérias e flashcards ativos.

As contagens SHALL particionar a fila pendente sem sobreposição. **Novos** são cartões com intervalo inicial zero, incluindo cartões cujo agendamento foi reiniciado por edição. **Em aprendizagem** são cartões pendentes após **De novo**. **Para revisão** são cartões pendentes após uma avaliação que os consolidou. As contagens SHALL ser atualizadas após mudanças que afetam a fila.

#### Scenario: Estudar os baralhos de uma matéria

- **GIVEN** uma matéria própria com cartões pendentes em mais de um baralho vinculado e pendências em outros baralhos
- **WHEN** a pessoa abre a visão dessa matéria e aciona **Estudar agora**
- **THEN** vê o resumo agregado e pode percorrer somente os cartões pendentes dos baralhos vinculados à matéria.

#### Scenario: Contar apenas pendências

- **GIVEN** um cartão novo, um cartão já vencido após **De novo**, um cartão consolidado já vencido e um cartão com revisão futura no mesmo baralho
- **WHEN** a pessoa consulta o resumo
- **THEN** cada coluna mostra um cartão e o cartão futuro fica fora da fila.

#### Scenario: Fila vazia

- **WHEN** um baralho ou matéria não tem cartões pendentes
- **THEN** a visão mostra as contagens zeradas e informa que não há cartões disponíveis agora, sem iniciar uma sessão vazia.

### Requirement: Disposição da revisão e intervalos por avaliação

A revisão SHALL permanecer na navegação do EduTrack. Inicialmente SHALL centralizar a pergunta na área de leitura e posicionar **Mostrar resposta** na área inferior. Após revelar, SHALL manter a pergunta acima de um divisor e exibir a resposta imediatamente abaixo. Na mesma área inferior SHALL apresentar **De novo**, **Difícil**, **Bom** e **Fácil**, nessa ordem, com o intervalo previsto acima do botão correspondente. O intervalo SHALL refletir a política de agendamento para o estado do cartão exibido. As avaliações SHALL ser distinguidas com texto e cores do tema. Em telas estreitas, os pares intervalo e botão SHALL se reorganizar mantendo ordem, legibilidade e área de toque.

#### Scenario: Revelar e avaliar

- **WHEN** a pessoa aciona **Mostrar resposta**
- **THEN** vê pergunta, divisor e resposta nessa ordem e quatro avaliações com seus intervalos previstos
- **AND** somente a confirmação de uma avaliação registra uma revisão.

#### Scenario: Prévia para um cartão novo

- **WHEN** a pessoa revela um cartão em estado inicial
- **THEN** vê **10 min**, **1 dia**, **3 dias** e **5 dias** acima das avaliações correspondentes.

#### Scenario: Tela de 320 px

- **WHEN** a pessoa revela a resposta em uma tela de 320 px
- **THEN** os quatro controles permanecem legíveis e operáveis por toque e teclado, sem rolagem horizontal nem sobreposição do conteúdo.
