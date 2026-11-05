# spaced-repetition Specification

## Purpose

Programar revisões dos flashcards próprios conforme avaliações registradas, mostrar o que já está pendente e manter um histórico confiável sem exigir IA ou alterar a consulta manual dos cartões.

## Requirements

### Requirement: Cartões pendentes de revisão
A EduTrack SHALL considerar pendente o cartão novo ou aquele cuja próxima data e hora de revisão já chegou. SHALL apresentar ao usuário autenticado somente seus cartões pendentes, com identificação do baralho e ordem estável da revisão mais antiga para a mais recente. Cartões agendados para o futuro SHALL ficar fora da fila pendente. Datas SHALL ser calculadas a partir do instante da avaliação e exibidas no horário local da pessoa.

#### Scenario: Cartão novo
- **WHEN** a pessoa cria ou importa um cartão para um baralho próprio
- **THEN** o cartão fica imediatamente pendente para revisão.

#### Scenario: Cartão agendado
- **GIVEN** um cartão cuja próxima revisão ainda não chegou
- **WHEN** a pessoa abre a lista de pendentes
- **THEN** o cartão não aparece até a data e hora agendadas.

#### Scenario: Lista vazia
- **WHEN** não há cartões próprios pendentes
- **THEN** a interface informa que não há revisões agora, sem apresentar um erro.

### Requirement: Revelar antes de avaliar
Na sessão de revisão programada, a EduTrack SHALL mostrar primeiro a frente do cartão e SHALL exigir ação explícita de revelar o verso antes de oferecer as avaliações `AGAIN`, `HARD`, `GOOD` e `EASY`. Revelar sem avaliar SHALL NOT criar registro de revisão nem mudar o agendamento. A consulta manual já prevista SHALL continuar disponível sem avaliação.

#### Scenario: Revisão concluída
- **GIVEN** um cartão pendente próprio
- **WHEN** a pessoa revela a resposta e escolhe `GOOD`
- **THEN** vê a próxima data de revisão e o cartão deixa a fila até voltar a ficar pendente.

#### Scenario: Sair após revelar
- **WHEN** a pessoa revela o verso e sai sem escolher avaliação
- **THEN** o cartão continua pendente com agendamento e histórico inalterados.

### Requirement: Intervalos iniciais e ajuste posterior
Na primeira avaliação de um cartão, a próxima revisão SHALL ocorrer após `AGAIN`: **10 minutos**, `HARD`: **24 horas**, `GOOD`: **72 horas** ou `EASY`: **120 horas**, contados do instante confirmado da avaliação. Em avaliações posteriores, a EduTrack SHALL considerar a avaliação atual e o estado acumulado do cartão: `AGAIN` reinicia o progresso e agenda 10 minutos; `HARD` aumenta o intervalo menos que `GOOD`; `EASY` aumenta o intervalo mais que `GOOD`, respeitados os limites da política vigente. O cálculo SHALL ser determinístico para mesmo estado, avaliação e instante.

#### Scenario: Primeira avaliação em cada nível
- **GIVEN** quatro cartões novos avaliados no mesmo instante, um em cada nível
- **WHEN** as avaliações são confirmadas
- **THEN** as próximas revisões são respectivamente 10 minutos, 24 horas, 72 horas e 120 horas depois.

#### Scenario: Repetir avaliação positiva
- **GIVEN** um cartão com uma revisão `GOOD` registrada
- **WHEN** ele volta a ficar pendente e recebe outro `GOOD`
- **THEN** sua próxima revisão usa o histórico acumulado e fica mais distante que os 3 dias iniciais.

#### Scenario: Esquecimento
- **GIVEN** um cartão com revisões anteriores
- **WHEN** ele volta a ficar pendente e recebe `AGAIN`
- **THEN** a próxima revisão ocorre em 10 minutos e a sequência de acertos é reiniciada, sem apagar o histórico.

### Requirement: Registro íntegro das revisões
Cada avaliação confirmada SHALL criar um registro imutável com cartão, avaliação, instante, intervalo e próxima data, além da versão da política que calculou o resultado. A atualização do estado atual e o registro SHALL ocorrer juntos; repetição da mesma confirmação SHALL retornar o mesmo resultado sem duplicar o registro. Uma avaliação obsoleta ou de cartão não pendente SHALL ser recusada sem alterar o agendamento.

#### Scenario: Confirmação repetida
- **WHEN** a mesma avaliação é enviada duas vezes após perda da primeira resposta
- **THEN** há um único registro e a segunda resposta apresenta a mesma próxima data.

#### Scenario: Avaliações concorrentes
- **GIVEN** duas sessões mostram o mesmo cartão pendente
- **WHEN** a primeira avaliação é confirmada e a segunda tenta confirmar o estado anterior
- **THEN** a segunda recebe indicação de estado desatualizado e não cria outro registro.

#### Scenario: Consultar histórico
- **WHEN** o proprietário consulta o histórico de um cartão
- **THEN** vê suas avaliações, instantes e próximas datas em ordem estável, sem alterar o agendamento.

### Requirement: Edição e exclusão de cartões
Alterar a frente ou o verso de um cartão SHALL reiniciar seu agendamento para revisão imediata, preservando registros de avaliações anteriores. Excluir um cartão ou baralho SHALL remover seu estado de agendamento e histórico conforme a exclusão dos cartões manuais. Desativar o módulo de flashcards SHALL preservar esses dados para quando for reativado.

#### Scenario: Conteúdo alterado
- **GIVEN** um cartão com revisão futura e histórico anterior
- **WHEN** a pessoa altera sua frente ou seu verso
- **THEN** o cartão volta à fila pendente com estado inicial de agendamento
- **AND** o histórico anterior continua consultável.

#### Scenario: Módulo desativado
- **WHEN** a pessoa desativa flashcards
- **THEN** a interface e a API de revisão ficam indisponíveis sem apagar cartão ou histórico
- **AND** após reativar o módulo, os dados reaparecem.

### Requirement: Isolamento e independência de IA
Fila, avaliação, estado e histórico SHALL exigir sessão válida e filtrar pelo usuário autenticado; cartão ou baralho alheio SHALL ser tratado como não encontrado. O agendamento SHALL funcionar quando a preferência de IA estiver desativada e sem serviço de IA disponível.

#### Scenario: Cartão de outra conta
- **WHEN** uma pessoa tenta consultar ou avaliar cartão de outra conta
- **THEN** não recebe conteúdo nem altera o agendamento desse cartão.

#### Scenario: IA indisponível
- **GIVEN** flashcards ativos e IA desativada ou indisponível
- **WHEN** a pessoa revisa um cartão próprio pendente
- **THEN** a avaliação e o cálculo da próxima data funcionam normalmente.

### Requirement: Interface acessível da revisão
A lista de pendentes, revelação, avaliação e histórico SHALL operar por teclado, ter rótulos e foco visível, comunicar carregamento, erro e sucesso, caber a partir de 320 px sem rolagem horizontal do layout e respeitar movimento reduzido.

#### Scenario: Avaliar por teclado em tela estreita
- **WHEN** a pessoa revela e avalia um cartão usando teclado em viewport de 320 px
- **THEN** os controles e a próxima data permanecem legíveis e operáveis.

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
