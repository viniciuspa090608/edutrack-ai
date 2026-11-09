# Spec Delta

## MODIFIED Requirements

### Requirement: Programação semanal compacta e responsiva
A programação SHALL manter segunda a domingo em ordem e mostrar um card por linha, ocupando toda a largura disponível em desktop, tablet e celular. Os cards SHALL usar a mesma altura mínima entre 160 e 180 px e poder crescer com os horários. Sábado e domingo SHALL ter tratamento visual discreto.

#### Scenario: Dia sem horários cadastrados
- **WHEN** a programação carregada inclui um dia sem horários
- **THEN** o card preserva título e divisória e centraliza um ícone discreto de relógio, o texto Sem horários cadastrados e a ação secundária Adicionar horário.
- **AND** a ação encaminha ao fluxo existente de criar ou editar horários com o dia de origem, respeitando validações e confirmação existentes.

#### Scenario: Programação em diferentes larguras
- **WHEN** a pessoa abre a programação semanal em qualquer tamanho de tela suportado
- **THEN** os sete dias aparecem em ordem, cada card em sua própria linha.
