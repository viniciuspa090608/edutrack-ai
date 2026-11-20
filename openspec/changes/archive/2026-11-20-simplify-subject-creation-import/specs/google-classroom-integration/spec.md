## ADDED Requirements

### Requirement: Revisão compacta de destinos
A seleção SHALL manter o nome da turma no título, usar Disciplina de destino como rótulo e Importar somente tarefas como opção quando aplicável, sem repetir o nome em ambos os rótulos. Controles SHALL manter associação acessível à turma. A revisão da nova disciplina SHALL mostrar Nome em linha própria, Objetivo e Nível na mesma linha, Prazo de estudo e Horas semanais na linha seguinte e assuntos conhecidos abaixo em largura disponível. Em telas estreitas SHALL empilhar campos sem overflow e preservar revisão, confirmação, validação e foco.

#### Scenario: Revisar em desktop
- **WHEN** a pessoa revisa uma nova disciplina com largura suficiente
- **THEN** os pares de campos ficam lado a lado e o nome da turma não se repete nos rótulos de destino e somente tarefas.

#### Scenario: Revisar por teclado em 320 px
- **WHEN** a pessoa percorre os campos em 320 px
- **THEN** os campos se empilham, mantêm rótulos e ordem lógica e a confirmação permanece acessível.

### Requirement: Ações compactas do resultado
Quando disponíveis, Mais detalhes e Tentar novamente SHALL aparecer na mesma linha com larguras ajustadas ao conteúdo. O botão principal azul SHALL usar exatamente Tentar novamente e manter a tentativa explícita dos itens recuperáveis, sem duplicar sucessos. Em telas sem espaço SHALL permitir quebra sem overflow. Mais detalhes SHALL preservar o modal e suas ações existentes.

#### Scenario: Resultado parcial recuperável
- **WHEN** a operação parcial permite nova tentativa em desktop
- **THEN** Mais detalhes e Tentar novamente aparecem na mesma linha e suas ações mantêm modal e idempotência.

### Requirement: Importação oculta na desconexão
Após desconexão confirmada, a seção Classroom SHALL ocultar conta Google da integração anterior, seleção de turmas, formulários, progresso, resumo, contadores, detalhes, conflitos e ações de importação e retry. SHALL manter status Desconectado, orientação e ação Conectar Google Classroom, além de aviso seguro de eventual falha de revogação. Modal de resultado aberto SHALL fechar com foco devolvido a um controle disponível. Respostas assíncronas anteriores SHALL NOT restaurar informações ocultas. Dados locais já importados SHALL permanecer e a reconexão SHALL seguir as regras existentes de identidade e associação.

#### Scenario: Desconectar após resultado parcial
- **WHEN** a pessoa desconecta após importar parcialmente
- **THEN** resumo, e-mail anterior e ações desaparecem sem excluir disciplinas ou tarefas.

#### Scenario: Resposta tardia e recarga
- **WHEN** uma consulta antiga termina depois da desconexão ou a página desconectada é recarregada
- **THEN** informações de importação permanecem ocultas e conectar continua disponível.
