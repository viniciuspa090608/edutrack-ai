# Spec Delta

## ADDED Requirements

### Requirement: Totais do período e detalhes diários sob demanda
Estatísticas de estudo SHALL priorizar os totais oficiais do período selecionado. Os valores diários SHALL aparecer em tabela textual com uma linha por data e cabeçalhos por métrica, dentro de Ver detalhes por dia, recolhida por padrão. A seção SHALL ser operável por teclado e a tabela SHALL caber em região própria, mantendo leitura em telas estreitas. A apresentação SHALL manter comparação, período parcial, cobertura e distinção entre zero, falha e dados indisponíveis.

#### Scenario: Consulta com dados diários
- **WHEN** a pessoa abre Estatísticas de estudo e expande os detalhes
- **THEN** os totais já estão visíveis e a tabela mostra as datas e métricas disponíveis sem repetir rótulos em cards por dia.

#### Scenario: Ausência de atividade confirmada
- **WHEN** os dados disponíveis confirmam ausência de atividade no período
- **THEN** o resumo informa Nenhuma atividade registrada neste período e preserva os detalhes textuais disponíveis.
