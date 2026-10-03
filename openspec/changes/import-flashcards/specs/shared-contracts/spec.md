# Spec Delta

## ADDED Requirements

### Requirement: Contratos públicos de importação de flashcards
Web e API SHALL compartilhar schemas de entrada e tipos de saída para seleção de colunas por índice, tentativa de importação, amostra, totais previstos, erros por linha, confirmação e totais efetivos. Os contratos SHALL validar dados externos antes do uso e não SHALL expor conteúdo temporário de outra conta nem entidades de persistência.

#### Scenario: Mapeamento incompatível
- **WHEN** um cliente envia índices de coluna iguais ou fora das colunas disponíveis
- **THEN** a validação compartilhada rejeita o mapeamento sem criar cartões.

#### Scenario: Resultado consistente
- **WHEN** a confirmação termina
- **THEN** web e API interpretam as mesmas contagens de importados, ignorados e rejeitados.
