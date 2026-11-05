## MODIFIED Requirements

### Requirement: Consultar rotinas e programação recorrente
O usuário SHALL poder listar e abrir o detalhe de suas rotinas. A EduTrack SHALL exibir uma programação semanal recorrente, agrupada de segunda a domingo e ordenada pelo início de cada horário, com nome da rotina identificável, sem texto informativo do fuso na listagem ou programação; o fuso SHALL continuar disponível no formulário funcional da rotina. Os horários SHALL representar horas locais recorrentes do fuso da rotina, sem criar ocorrências datadas ou sessões realizadas. A programação SHALL refletir imediatamente criação, edição e exclusão confirmadas.

#### Scenario: Ver semana planejada
- **GIVEN** rotinas com horários em dias diferentes
- **WHEN** o usuário abre a programação
- **THEN** vê os dias da semana e os horários de cada rotina em ordem
- **AND** vê os horários locais corretos sem aviso repetido do fuso.

#### Scenario: Nenhuma rotina
- **GIVEN** um usuário sem rotinas
- **WHEN** ele abre a página de rotinas
- **THEN** vê um estado vazio com ação para criar a primeira rotina.

#### Scenario: Mesmo usuário em outro fuso
- **GIVEN** uma rotina cadastrada para um fuso definido
- **WHEN** o usuário abre a programação em dispositivo com outro fuso
- **THEN** os horários locais cadastrados permanecem os mesmos e o fuso continua acessível no formulário da rotina
- **AND** a interface não os desloca silenciosamente.
