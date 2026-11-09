# Spec Delta

## ADDED Requirements

### Requirement: Programação semanal compacta e responsiva
A programação SHALL manter segunda a domingo em ordem e mostrar quatro cards na primeira linha e três na segunda em desktop, com larguras iguais e intervalo de 20 a 24 px, duas colunas no tablet e uma no celular. Os cards SHALL usar a mesma altura mínima entre 160 e 180 px e poder crescer com os horários. Sábado e domingo SHALL ter tratamento visual discreto.

#### Scenario: Dia sem horários cadastrados
- **WHEN** a programação carregada inclui um dia sem horários
- **THEN** o card preserva título e divisória e centraliza um ícone discreto de relógio, o texto Sem horários cadastrados e a ação secundária Adicionar horário.
- **AND** a ação encaminha ao fluxo existente de criar ou editar horários com o dia de origem, respeitando validações e confirmação existentes.
