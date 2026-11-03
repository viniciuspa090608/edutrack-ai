# Proposal

## Why

As telas de acesso, Dashboard, Configurações e Pomodoro apresentam inconsistências de alinhamento, navegação e controles apontadas na revisão visual. Corrigir esses pontos melhora a leitura e torna as interações coerentes com a identidade do EduTrack.

## What Changes

- Animar a transição de login para recuperação de senha, respeitando movimento reduzido.
- Alinhar Esqueci minha senha e Voltar à landing com espaçamento.
- Exibir abaixo da saudação da Dashboard somente data e hora em formato `DD/MM/AAAA, HH:mm`, sem segundos; reorganizar indicadores com descrição cinza acima e ícone e valor na mesma linha.
- Ordenar a navegação de Configurações pela ordem real das seções e destacar a seção atual durante a rolagem.
- Usar RadioGroup shadcn/ui no modo de geração de IA; alinhar Salvar e Recarregar, com Salvar maior e Recarregar em fit-content.
- Colocar Tarefas, Matérias e Flashcards lado a lado nas preferências, com adaptação em telas estreitas.
- Agrupar a integração Google Classroom em um card com seu logo.
- Estender a coluna dos dois cards laterais do Pomodoro até a base do card principal.
- Migrar os selects nativos da aplicação para menus estilizados usando o Select compartilhado existente.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `account-recovery`: transição animada e links de acesso alinhados.
- `dashboard-presentation`: data/hora compactas e composição dos indicadores.
- `account-profile-visual-experience`: navegação por seção, preferências, IA e card Classroom.
- `pomodoro-visual-experience`: alinhamento vertical dos cards de resumo.
- `frontend-ui-controls`: menus de seleção personalizados em toda a aplicação.

## Impact

Alterações planejadas apenas na web e em packages/ui: AuthLayout, AccessPage, PasswordRecoveryPage, DashboardPage, ProfilePage, AISettingsSection, ClassroomSection, PomodoroPage, consumidores de NativeSelect/select e estilos correspondentes. Reutilizar Select baseado em Radix já disponível e adicionar RadioGroup no padrão shadcn/ui do pacote compartilhado. APIs, regras de negócio e contratos permanecem os existentes.

A mudança ativa refine-auth-desktop-layout toca autenticação e ainda possui tarefas pendentes. O apply deverá preservar seu trabalho e reconciliar os estilos compartilhados sem concluir ou arquivar essa outra mudança. Esta proposta não implementa código nem cria commit de conclusão.
