# Spec Delta

## ADDED Requirements

### Requirement: Área útil ampliada da lista de disciplinas
O card Disciplinas SHALL aproveitar o espaço entre cabeçalho e rodapé para a lista, reduzindo espaços ociosos e compactando itens sem aumentar suas dimensões externas atuais na mesma viewport e composição. Com vários itens curtos em desktop SHALL permitir visualizar ao menos dois nomes antes de rolar. Cabeçalho e Abrir disciplinas SHALL permanecer fora da rolagem e alinhados à composição existente. Textos e barras SHALL permanecer integralmente alcançáveis por ponteiro, toque e teclado, sem rolagem horizontal desde 320 px.

#### Scenario: Card com três disciplinas
- **WHEN** existem três disciplinas com nomes e resumos curtos em desktop
- **THEN** ao menos dois nomes ficam visíveis e largura, altura e alinhamento externos são preservados.

#### Scenario: Texto extenso em tela estreita
- **WHEN** os resumos são extensos ou a viewport tem 320 px
- **THEN** todo o conteúdo fica acessível pela rolagem local com rodapé visível, sem aumentar o card para acomodar a coleção.
