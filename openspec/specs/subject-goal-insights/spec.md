# subject-goal-insights Specification

## Purpose

Permitir acompanhar uma meta mensurável por disciplina e escolher próximos passos com orientações justificadas pelos próprios registros de estudo.

## Requirements

### Requirement: Configurar uma meta própria
O sistema SHALL permitir criar e editar uma meta por disciplina com indicador disponível, valor positivo e prazo válido futuro inclusivo em fuso IANA. SHALL oferecer tarefas concluídas, horas reais de foco e percentual de revisões GOOD/EASY conforme módulos habilitados. SHALL preservar início em edições de valor/prazo e reiniciar a janela ao trocar indicador. Percentuais SHALL estar entre 0 e 100, com valor positivo; tarefas SHALL ser inteiras.

#### Scenario: Salvar e editar
- **WHEN** o proprietário salva e depois altera valor e prazo
- **THEN** encontra uma única meta com novos valores e início preservado.

### Requirement: Progresso e orientações verificáveis
O sistema SHALL apresentar valor atual, desejado, percentual e prazo com insights contendo informação, evidência, sugestão e atalho aplicável. Tarefas SHALL medir execução, horas SHALL usar intervalos reais de sessões encerradas desde o início, e acertos SHALL significar autoavaliações GOOD/EASY desde o início. SHALL comparar ritmo recente com ritmo necessário para indicadores cumulativos e informar insuficiência de dados; tendências de acertos SHALL exigir cinco revisões em cada janela de sete dias. SHALL distinguir ausência de meta, ausência de registros, zero progresso, prazo vencido, meta alcançada e indicador desabilitado, sem julgamentos nem inferir notas.

#### Scenario: Seis de dez tarefas
- **WHEN** há seis tarefas concluídas vinculadas e meta de dez
- **THEN** mostra 60% e quatro restantes, explicando execução e prazo.

#### Scenario: Poucas revisões
- **WHEN** uma das duas janelas tem menos de cinco revisões
- **THEN** informa dados insuficientes e não afirma melhora ou projeta aprovação.

#### Scenario: Prazo e conclusão
- **WHEN** uma meta está vencida ou alcançada ou sem progresso
- **THEN** recebe mensagem específica e sugestão prática correspondente.

### Requirement: Privacidade e atualização
Todas as operações SHALL exigir autenticação, origem autorizada em escritas e disciplina própria. Cada evidência SHALL filtrar usuário e disciplina; módulos desabilitados SHALL ser omitidos e suas metas preservadas. Insights SHALL ser recalculados após salvar e ao consultar dados alterados, incluindo retorno à página. A interface SHALL distinguir loading, erro com nova tentativa, vazio e sucesso, operar por teclado e caber em 320 px. A função SHALL funcionar sem IA e sem envio de dados a provedores.

#### Scenario: Conta alheia
- **WHEN** uma conta consulta ou altera meta da outra
- **THEN** recebe não encontrado e nenhum dado é exposto ou alterado.

#### Scenario: Atualização e falha
- **WHEN** um registro muda e a página é atualizada ou retorna ao foco
- **THEN** os cálculos refletem os registros atuais; falhas são apresentadas com nova tentativa e sem alegar sucesso.
