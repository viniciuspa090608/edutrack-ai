# quality-commands Specification
## Purpose

Define verificações locais reproduzíveis da fundação para identificar erros de estilo, tipos, testes e compilação antes de integrar mudanças.

## Requirements
### Requirement: Comandos de qualidade na raiz
O projeto SHALL oferecer comandos documentados `lint`, `typecheck`, `test` e `build` na raiz que executem as verificações aplicáveis aos workspaces mantidos.

#### Scenario: Execução completa em cópia limpa
- **GIVEN** dependências instaladas e configuração de teste válida
- **WHEN** cada comando é executado na raiz
- **THEN** todos os workspaces aplicáveis são verificados
- **AND** cada comando retorna zero apenas quando sua verificação passa.

#### Scenario: Falha detectada
- **GIVEN** um erro de tipo, lint, teste ou compilação em um workspace
- **WHEN** o respectivo comando da raiz é executado
- **THEN** retorna código de saída diferente de zero
- **AND** identifica o workspace ou arquivo que falhou.

### Requirement: Testes da fundação
A configuração de testes SHALL permitir executar testes unitários e de integração da API e testes de componentes da web, com verificações reais para os comportamentos iniciais relevantes.

#### Scenario: Suíte inicial
- **GIVEN** a fundação implementada
- **WHEN** o comando `test` é executado
- **THEN** verifica ao menos health check, validação de ambiente, formato de erro e renderização da página técnica
- **AND** falhas reais de configuração exigida não são ocultadas por mocks.

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

### Requirement: Matriz de regressão dos fluxos existentes
A suíte SHALL manter matriz documentada que relacione fluxos críticos, requisito vigente, cenário positivo, falha relevante, isolamento entre contas quando aplicável e teste executável correspondente. A matriz SHALL incluir autenticação e sessão, confirmação/recuperação de e-mail, perfil e preferências, tarefas/subtarefas, matérias/roadmaps, rotinas, Pomodoro, flashcards/importação/revisão, dashboard, analytics e conquistas. Cenário sem cobertura SHALL ser identificado como lacuna, nunca como aprovado. Testes existentes SHALL ser reutilizados antes de adicionar cobertura equivalente.

#### Scenario: Auditoria de cobertura
- **WHEN** a baseline de regressão é entregue
- **THEN** cada fluxo crítico tem testes referenciados e resultado verificável ou lacuna explícita que impede declarar a baseline completa.

#### Scenario: Isolamento de duas contas
- **WHEN** a suíte verifica recursos e preferências pertencentes a usuários distintos
- **THEN** tentativas de leitura ou mutação alheia são recusadas e nenhum dado de outra conta é alterado.

### Requirement: Regressão da independência de IA
A suíte SHALL comprovar operações manuais dos módulos existentes com IA desativada e com provedor indisponível, sem chamadas externas indevidas. SHALL cobrir geração de roadmap, regeneração de passos e flashcards com provedor simulado somente na fronteira HTTP, incluindo saída válida, inválida, timeout, confirmação, expiração e idempotência aplicáveis. O ambiente atual SHALL ter testes para IA inteiramente ausente, trio global completo e configuração parcial rejeitada, incluindo somente `AI_RECEIPT_KEY`. Testes SHALL NOT usar credenciais reais ou consumir APIs comerciais.

#### Scenario: Provedor falha
- **WHEN** o provedor simulado falha durante geração e a pessoa usa operações manuais
- **THEN** a geração não persiste conteúdo parcial e as operações manuais continuam válidas sem depender do provedor.

#### Scenario: Configuração parcial
- **WHEN** o parser atual recebe somente a chave de recibo no grupo de configuração de IA
- **THEN** a configuração é rejeitada indicando os nomes faltantes sem divulgar segredos e o relatório distingue erro de configuração de defeito do produto.

### Requirement: Correção baseada em regressão reproduzível
Cada correção de código de produção desta baseline SHALL estar associada a desvio de requisito atual demonstrado por teste que falha antes e passa depois da correção. Falhas de fixture ou configuração SHALL ser corrigidas na origem sem enfraquecer contratos, assertions ou validação. A suíte SHALL NOT ocultar falhas com skip, retries indiscriminados, aumento de timeout ou substituição de MySQL por mocks. Funcionalidades novas ou decisões que alterem requisitos SHALL permanecer em mudanças separadas.

#### Scenario: Defeito atual confirmado
- **WHEN** um teste reproduz comportamento contrário ao requisito vigente
- **THEN** uma correção mínima restaura o comportamento e o registro associa requisito, teste, evidência anterior e resultado posterior.

#### Scenario: Infraestrutura ausente
- **WHEN** MySQL não está disponível ou faltam permissões/configuração de teste
- **THEN** a execução falha explicitamente como problema de infraestrutura, sem registrar sucesso, omitir testes ou modificar regras de negócio para passar.

### Requirement: Evidência reproduzível antes da mudança de IA
A baseline SHALL registrar ambiente não secreto, comandos, resultados, testes adicionados/reutilizados, defeitos corrigidos e limitações da validação. `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` SHALL passar para declarar conclusão. Testes de banco SHALL usar MySQL real isolado e relógios/fixtures determinísticos quando o cenário depender de tempo. A mesma suíte SHALL permanecer executável no CI e reutilizável após mudanças futuras de IA. Nenhum teste SHALL resetar banco de desenvolvimento ou depender de segredos do `.env` para simular provedores.

#### Scenario: Conclusão aprovada
- **WHEN** a baseline é declarada concluída
- **THEN** os quatro comandos estão aprovados, não há lacunas críticas pendentes e há relatório sanitizado que permite reproduzir os resultados antes de implementar provedores por conta.

#### Scenario: Limitação de execução
- **WHEN** um check obrigatório não pôde executar ou falhou
- **THEN** o relatório identifica a limitação e a mudança permanece incompleta, sem commit de conclusão nem archive.
