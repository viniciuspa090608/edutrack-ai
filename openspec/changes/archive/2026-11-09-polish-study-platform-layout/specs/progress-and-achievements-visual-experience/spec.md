# Spec Delta

## MODIFIED Requirements

### Requirement: Abas internas de Relatório
Relatório SHALL oferecer Progresso primeiro e Estatísticas em seguida como destinos internos acessíveis, indicando a aba atual. A entrada Relatório na navegação SHALL abrir Progresso. O acesso direto a cada rota SHALL abrir seu conteúdo correspondente. SHALL reutilizar suas rotas, consultas, gates, conquistas e estados existentes. Estatísticas SHALL remover avisos redundantes de fuso selecionado e sufixos informativos nos resultados, preservando o campo funcional IANA, suas validações, datas e períodos.

#### Scenario: Trocar abas
- **WHEN** a pessoa alterna entre Estatísticas e Progresso por teclado
- **THEN** acessa os conteúdos reais de cada rota, identifica a aba atual e não vê identificação informativa repetida do fuso.

#### Scenario: Abrir Relatório pela navegação
- **WHEN** a pessoa seleciona Relatório no menu
- **THEN** Progresso abre selecionado e aparece antes de Estatísticas.
