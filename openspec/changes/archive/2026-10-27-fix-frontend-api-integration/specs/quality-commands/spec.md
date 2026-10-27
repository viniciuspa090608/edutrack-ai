# Spec Delta

## ADDED Requirements

### Requirement: Verificações independentes de arquivos gerados e data da máquina
As verificações locais SHALL excluir dependências, segredos locais e arquivos gerados do inventário versionável e da verificação de formatação, preservando a exclusão existente de `/especificacoes`. Os cenários de dashboard com relógio fixo SHALL alinhar os metadados de progresso e revisão dos seus fixtures a esse relógio. A suíte MySQL SHALL usar bancos isolados e concorrência limitada, sem substituir persistência por mocks nem aumentar os limites de tempo para ocultar falhas.

#### Scenario: Verificar após build
- **WHEN** o projeto possui dependências instaladas e arquivos gerados por build
- **THEN** a verificação de formatação considera os arquivos-fonte mantidos e ignora dependências e artefatos gerados
- **AND** segredos locais não aparecem como candidatos ao versionamento.

#### Scenario: Dashboard executado em data posterior ao cenário
- **WHEN** os testes do dashboard com relógio fixo são executados em outra data real
- **THEN** o início de acompanhamento e o vencimento inicial dos cartões permitem validar os fatos do cenário sem depender da data da máquina.

#### Scenario: Suíte completa de banco
- **WHEN** a suíte completa da API executa migrations, fixtures e seeds em MySQL real
- **THEN** a concorrência é limitada e cada arquivo mantém seu banco isolado
- **AND** falhas reais continuam produzindo saída diferente de zero dentro dos limites de tempo existentes.
