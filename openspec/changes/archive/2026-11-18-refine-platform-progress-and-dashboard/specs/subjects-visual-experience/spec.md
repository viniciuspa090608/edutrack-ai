# Spec Delta

## MODIFIED Requirements

### Requirement: Percentual nos cards de disciplinas
Cada card da listagem SHALL mostrar o percentual oficial dos estudos da disciplina correspondente, com rótulo acessível e formatação que não anuncie conclusão parcial como 0% ou 100%. Ausência de base de cálculo SHALL ser indicada como progresso não calculável, distinta de zero confirmado.

#### Scenario: Disciplinas com progresso diferente
- **WHEN** duas disciplinas retornam 25% e 75%
- **THEN** seus cards mostram os respectivos valores sem reutilizar o percentual da disciplina destacada.

#### Scenario: Disciplina sem itens de estudo
- **WHEN** a disciplina não possui itens na fonte oficial de progresso
- **THEN** seu card indica progresso não calculável sem inventar percentual.

Cada card SHALL acrescentar ao percentual textual uma barra proporcional com nome associado à disciplina, mínimo 0, máximo 100 e valor oficial acessível. Progresso não calculável SHALL NOT ser representado como barra determinada em zero. SHALL preservar contraste em ambos os temas e a fonte oficial de cálculo.

#### Scenario: Extremos e progresso parcial
- **WHEN** disciplinas retornam 0%, 75% e 100%
- **THEN** suas barras aparecem vazia, em três quartos e completa com os respectivos textos e sem depender somente de cor.
