## MODIFIED Requirements

### Requirement: Indicadores e contexto de progresso fiéis
Progresso SHALL destacar sequência atual, maior sequência e dias ativos enviados pela API, preservar a aplicação do fuso salvo sem aviso textual repetido, início do rastreamento e explicações dos limites do histórico e atividades válidas. A interface SHALL NOT recalcular sequências, apresentar pontos/níveis/XP inexistentes ou tratar frequência de analytics como sequência de gamificação.

#### Scenario: Sequência atual encerrada
- **WHEN** a API retorna sequência atual zero, recorde positivo e dias ativos positivos
- **THEN** os três valores são apresentados separadamente
- **AND** o usuário não recebe uma indicação falsa de ausência de histórico.

#### Scenario: Histórico não retroativo
- **WHEN** o progresso é carregado
- **THEN** o início do rastreamento permanece visível e a configuração de fuso continua disponível na conta, sem identificar o fuso em uso nesta tela
- **AND** atividades anteriores não são apresentadas como dias creditados.

## ADDED Requirements

### Requirement: Abas internas de Relatório
Relatório SHALL oferecer Estatísticas e Progresso como destinos internos acessíveis e indicar a aba atual. SHALL reutilizar suas rotas, consultas, gates, conquistas e estados existentes. Estatísticas SHALL remover avisos redundantes de fuso selecionado e sufixos informativos nos resultados, preservando o campo funcional IANA, suas validações, datas e períodos.

#### Scenario: Trocar abas
- **WHEN** a pessoa alterna entre Estatísticas e Progresso por teclado
- **THEN** acessa os conteúdos reais de cada rota, identifica a aba atual e não vê identificação informativa repetida do fuso.
