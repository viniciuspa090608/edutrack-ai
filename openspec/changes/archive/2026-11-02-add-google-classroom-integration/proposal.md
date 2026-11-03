# Proposal

## Why

Importar turmas e atividades reduz o cadastro repetitivo e mantém a origem dos compromissos de estudo. A integração deve ser opcional e funcionar independentemente do provedor de IA.

## What Changes

- Criar onboarding autenticado para novas contas, com escolha de módulos seguida de “Conectar Google Classroom” ou “Agora não”; pular ou falhar permite continuar.
- Autorizar Classroom separadamente do login Google, selecionar turmas e revisar associação a matérias e seus dados obrigatórios.
- Importar matérias e tarefas sob solicitação, com progresso persistido, resultados por item, retry idempotente e proteção das edições manuais.
- Adicionar Perfil → Configurações → Integrações → Google Classroom, em `/conta`, para conexão, seleção, importação, reconexão e desconexão.
- Preservar os módulos independentes: tarefas sem matéria quando matérias estiver desativado; módulos desligados não recebem escrita.
- Manter os aprimoramentos de roadmaps e flashcards existentes, sem modificar catálogo ou transporte dos provedores.
- Conforme redução de escopo aprovada pelo usuário, excluir leitura de PDFs/arquivos, geração de notas, escopos materiais/Drive e chat. Chat fica para uma mudança separada.
- Excluir sincronização agendada, escrita no Google e importação de notas escolares/submissões.

## Capabilities

### New Capabilities

- `google-classroom-integration`: autorização, seleção, importação manual, progresso, conflitos e gestão no perfil.

### Modified Capabilities

- `module-preferences`: onboarding de seleção de módulos para novas contas.
- `study-subjects`: associação de turmas a matérias com preenchimento explícito de planejamento pessoal.
- `study-tasks`: proveniência e preservação de prazos e links de atividades importadas.

## Impact

Atinge auth, preferences, subjects, tasks e integração em `apps/web`/`apps/api`, contratos compartilhados, migrations MySQL e worker de importações manuais. Exige OAuth e Google Classroom API. Não requer Drive nem chamadas ao provedor de IA. Nenhum extrator, entidade ou endpoint de notas de estudo é entregue nesta mudança.
