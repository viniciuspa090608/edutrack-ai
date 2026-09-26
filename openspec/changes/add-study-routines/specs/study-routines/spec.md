# Spec Delta

## Purpose

Permitir que cada usuário autenticado planeje e consulte horários recorrentes de estudo ao longo da semana, mantendo suas rotinas privadas e independentes de tarefas e sessões de foco.

## ADDED Requirements

### Requirement: Criar rotina semanal
A EduTrack SHALL permitir criar uma rotina própria com nome obrigatório, fuso horário válido e pelo menos um horário semanal. Cada horário SHALL conter dia da semana, hora de início e hora de fim no formato de 24 horas, com início anterior ao fim no mesmo dia. A rotina SHALL admitir vários horários, inclusive horas diferentes em dias distintos. A API SHALL rejeitar nome, fuso, dia ou horário inválido sem salvar uma rotina parcial.

#### Scenario: Horários diferentes na semana
- **GIVEN** um usuário autenticado
- **WHEN** ele cria uma rotina para segunda-feira das 08:00 às 09:00 e quarta-feira das 19:00 às 20:30
- **THEN** os dois horários são salvos na mesma rotina
- **AND** a programação semanal os mostra nos respectivos dias e horas.

#### Scenario: Dados inválidos
- **WHEN** o usuário envia rotina sem nome ou horários, dia fora da semana, fuso inválido ou início igual ou posterior ao fim
- **THEN** a API rejeita a criação com erro de validação
- **AND** nenhum horário parcial é salvo.

### Requirement: Consultar rotinas e programação recorrente
O usuário SHALL poder listar e abrir o detalhe de suas rotinas. A EduTrack SHALL exibir uma programação semanal recorrente, agrupada de segunda a domingo e ordenada pelo início de cada horário, com nome da rotina e fuso identificáveis. Os horários SHALL representar horas locais recorrentes do fuso da rotina, sem criar ocorrências datadas ou sessões realizadas. A programação SHALL refletir imediatamente criação, edição e exclusão confirmadas.

#### Scenario: Ver semana planejada
- **GIVEN** rotinas com horários em dias diferentes
- **WHEN** o usuário abre a programação
- **THEN** vê os dias da semana e os horários de cada rotina em ordem
- **AND** consegue identificar o fuso de cada horário.

#### Scenario: Nenhuma rotina
- **GIVEN** um usuário sem rotinas
- **WHEN** ele abre a página de rotinas
- **THEN** vê um estado vazio com ação para criar a primeira rotina.

#### Scenario: Mesmo usuário em outro fuso
- **GIVEN** uma rotina cadastrada para um fuso definido
- **WHEN** o usuário abre a programação em dispositivo com outro fuso
- **THEN** os horários locais cadastrados e a identificação do fuso permanecem os mesmos
- **AND** a interface não os desloca silenciosamente.

### Requirement: Editar rotina e seus horários
O proprietário SHALL poder alterar nome, fuso e conjunto de horários de uma rotina. Uma atualização SHALL ser atômica: ou a rotina e todos os seus horários passam a refletir os valores válidos enviados, ou nada muda. Ao mudar somente o fuso, as horas locais cadastradas SHALL permanecer iguais, passando a ser interpretadas no novo fuso. A rotina SHALL continuar com pelo menos um horário após a edição.

#### Scenario: Alterar dias e horas
- **GIVEN** uma rotina própria com horários cadastrados
- **WHEN** o usuário substitui um horário de terça por dois horários na quinta
- **THEN** a programação mostra somente os novos horários na quinta
- **AND** os demais dados não enviados permanecem preservados.

#### Scenario: Falha ao editar
- **GIVEN** uma rotina própria válida
- **WHEN** o usuário envia uma alteração com horário inválido
- **THEN** a API recusa a operação
- **AND** a rotina e todos os horários anteriores permanecem intactos.

### Requirement: Validar sobreposição na mesma rotina
Horários da mesma rotina no mesmo dia SHALL NOT se sobrepor; horários adjacentes SHALL ser aceitos. Horários de rotinas diferentes SHALL poder coincidir e SHALL ser exibidos separadamente, sem mesclar as rotinas.

#### Scenario: Sobreposição rejeitada
- **WHEN** o usuário tenta salvar na mesma rotina e dia os horários 08:00–09:00 e 08:30–10:00
- **THEN** a API rejeita o conjunto sem alterar a programação anterior.

#### Scenario: Horários adjacentes e rotinas distintas
- **WHEN** o usuário salva 08:00–09:00 e 09:00–10:00 na mesma rotina, ou horários coincidentes em rotinas distintas
- **THEN** os horários são aceitos e permanecem identificáveis separadamente.

### Requirement: Excluir rotina
O proprietário SHALL poder excluir uma rotina após confirmação na interface. A exclusão SHALL remover também seus horários da lista e da programação semanal; cancelamento ou falha SHALL conservar os dados anteriores.

#### Scenario: Exclusão confirmada
- **GIVEN** uma rotina própria com horários
- **WHEN** o usuário confirma a exclusão
- **THEN** a rotina e seus horários deixam de ser consultáveis e de aparecer na programação.

#### Scenario: Exclusão cancelada
- **GIVEN** uma rotina própria
- **WHEN** o usuário cancela a exclusão
- **THEN** a rotina e a programação não mudam.

### Requirement: Isolamento das rotinas por usuário
Todas as rotas de rotinas e programação SHALL exigir sessão válida. A API SHALL derivar o proprietário da sessão e restringir todas as leituras e mutações a esse usuário, sem aceitar um ID de proprietário fornecido pelo cliente como autorização. Um ID válido pertencente a outro usuário SHALL responder como não encontrado e não SHALL revelar ou alterar seus horários. A web SHALL proteger a página antes de exibir dados privados.

#### Scenario: Consultar sem sessão
- **WHEN** uma pessoa sem sessão abre a página ou consulta a API de rotinas
- **THEN** não vê programação privada e recebe o fluxo de autenticação
- **AND** a API nega a consulta.

#### Scenario: Acessar ID alheio
- **GIVEN** uma rotina de outro usuário
- **WHEN** o usuário autenticado tenta consultar, editar ou excluir seu ID
- **THEN** a API responde como não encontrada
- **AND** a rotina alheia permanece inalterada.

#### Scenario: Programações isoladas
- **GIVEN** dois usuários com horários próprios
- **WHEN** cada um abre a programação semanal
- **THEN** vê somente suas rotinas e horários.

### Requirement: Funcionamento independente e interface acessível
Criar, listar, editar, excluir e visualizar rotinas SHALL funcionar sem tarefas, matérias ou sessões Pomodoro disponíveis. Essas ações SHALL NOT criar, alterar ou concluir tarefas ou sessões de foco. A página SHALL ser operável por teclado, com rótulos, foco visível, estados de carregamento/erro/vazio/sucesso e layout legível a partir de 320 px sem rolagem horizontal causada pelo layout.

#### Scenario: Outros módulos indisponíveis
- **GIVEN** autenticação e banco de rotinas disponíveis, mas tarefas e Pomodoro indisponíveis
- **WHEN** o usuário cria e consulta uma rotina
- **THEN** a rotina e a programação funcionam normalmente
- **AND** nenhuma tarefa ou sessão Pomodoro é criada.

#### Scenario: Programação em tela estreita
- **GIVEN** uma viewport de 320 px
- **WHEN** o usuário percorre por teclado a programação e o formulário
- **THEN** dias, horários e ações permanecem legíveis e operáveis
- **AND** o layout não exige rolagem horizontal.

#### Scenario: Falha de rede
- **WHEN** uma alteração de rotina falha por indisponibilidade da API
- **THEN** a interface informa a falha e permite tentar novamente
- **AND** não anuncia como salva uma alteração sem confirmação.
