# Proposal

## Why

O cadastro exige planejamento adicional antes de permitir organizar os estudos, e a importação do Classroom começa sem destino definido. Os ajustes enviados também apontam excesso de repetição, espaços desperdiçados e controles pouco compactos na integração e no assistente.

## What Changes

- Exigir preenchimento somente de nome, nível e prazo ao criar disciplinas; sugerir nível intermediário, prazo de seis meses e objetivo `Estudar e me aprimorar em ${nomeDisciplina}`. Objetivo, horas semanais e assuntos conhecidos permanecem personalizáveis, sem preenchimento obrigatório.
- Selecionar criar nova disciplina por padrão para turmas sem vínculo; permitir usar disciplina existente por Select das disciplinas próprias cadastradas.
- Manter o nome da turma somente no título; usar os rótulos Disciplina de destino e Importar somente tarefas.
- Agrupar Objetivo/Nível e Prazo de estudo/Horas semanais em duas linhas no formulário de revisão, empilhando em telas estreitas.
- Colocar Mais detalhes e Tentar novamente na mesma linha, com o segundo texto no botão azul.
- Ocultar informações e ações de importação quando o Classroom estiver desconectado, preservando registros importados.
- Compactar mensagens do Assistente IA, limitar largura e integrar um botão de envio com ícone ao compositor.
- Fazer os cards vazios de Disciplinas e Flashcards preencherem a altura restante útil da tela.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `study-subjects`: criação com preenchimento mínimo, valores sugeridos e associação padrão de turmas.
- `google-classroom-integration`: revisão compacta, seleção de destino, ações do resultado e apresentação desconectada.
- `ai-study-assistant`: mensagens compactas e envio integrado.
- `subjects-and-tasks-empty-states`: preenchimento da altura restante em Disciplinas.
- `manual-flashcards`: preenchimento da altura restante no estado vazio de baralhos.

## Impact

Contratos de disciplinas e Classroom, serviços públicos de criação, formulários em SubjectsPage e ClassroomSection, AssistantPage/assistant.css e layout dos estados vazios. Revisar consumidores da criação, incluindo prévias do assistente e parâmetros de roadmaps. Sem novas dependências, alteração OAuth ou importação automática. Preservar contratos de resposta completos e dados existentes usando os padrões atuais de horas e assuntos conhecidos.
