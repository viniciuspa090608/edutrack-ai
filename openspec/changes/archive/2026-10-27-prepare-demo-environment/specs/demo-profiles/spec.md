## Purpose

Disponibilizar três experiências locais de demonstração com contas confirmadas e dados coerentes para apresentar funcionalidades e estágios distintos de uso da EduTrack.

## ADDED Requirements

### Requirement: Três contas demonstráveis

A população SHALL criar contas locais confirmadas ativo, intermediário e iniciante com credenciais documentadas para desenvolvimento. O ativo SHALL ter todos os módulos habilitados e tarefas, subtarefas, matérias, roadmaps, rotinas, Pomodoro, flashcards, revisões, estatísticas, sequências e conquistas representativos. O intermediário SHALL apresentar matérias, tarefas, sessões, progresso parcial e revisões pendentes. O iniciante SHALL ter poucos dados e módulos vazios que permitam primeiros passos.

#### Scenario: Login dos três perfis

- **WHEN** a pessoa autentica cada perfil com as credenciais documentadas após a população
- **THEN** acessa a área privada sem confirmação adicional e encontra o estágio de uso correspondente.

### Requirement: Consistência temporal e isolamento

Dados SHALL respeitar vínculos, estados, regras de negócio e isolamento por usuário. O histórico SHALL abranger múltiplos dias, incluir atividades recentes e produzir estatísticas, progresso, sequências e conquistas coerentes com os registros fonte. A geração MUST NOT depender de chamadas reais à IA ou envios reais de e-mail.

#### Scenario: Histórico e revisões

- **WHEN** o perfil ativo abre estatísticas e o intermediário abre revisões
- **THEN** o ativo apresenta atividade distribuída no tempo e o intermediário apresenta revisões devidas coerentes com seu histórico.

#### Scenario: Acesso cruzado

- **WHEN** um perfil consulta ou tenta alterar um recurso de outro perfil
- **THEN** o recurso não é exposto nem alterado.

### Requirement: População reproduzível

A sequência documentada reset confirmado e população SHALL produzir os mesmos perfis e composição de dados usando uma data de referência explícita ou o dia local da execução. População em banco não vazio SHALL falhar antes de escrever e orientar o reset explícito, sem duplicar registros.

#### Scenario: Segunda população

- **WHEN** a população é executada novamente sem reset
- **THEN** falha sem alterações ou duplicação de contas, eventos ou conquistas.

#### Scenario: Nova demonstração

- **WHEN** reset confirmado e população são repetidos com a mesma data de referência
- **THEN** os mesmos cenários e indicadores são reconstruídos.
