# Proposta

## Why

Controles com alturas diferentes, cards que mudam de tamanho conforme o conteúdo e detalhes diários sempre expandidos dificultam a leitura e a navegação. Os ajustes reunidos aqui melhoram a consistência da interface e tornam os estados vazios e as transições de acesso mais claros.

## What Changes

- Padronizar os campos de linha única e alinhar os quatro filtros de Tarefas. Manter a paginação dos baralhos no rodapé visível da área de Flashcards.
- Estabilizar o tamanho dos cards do dashboard e manter o rodapé de Tarefas acessível com a lista cheia. Colocar os resumos abaixo dos títulos com 3 px de distância e simplificar o estado vazio de Progresso.
- Expandir o estado vazio de Matérias até os limites da área disponível abaixo do cabeçalho.
- Reorganizar o card Seu perfil em Foto de perfil, Informações pessoais e Segurança da conta. Posicionar Salvar nome ao lado do campo quando houver espaço.
- Reunir Google, Google Classroom e sessão atual em Acesso à conta, com ícones alinhados aos textos e divisórias entre seções.
- Organizar a Programação semanal em 4 + 3 cards no desktop, duas colunas no tablet e uma no celular. Compactar e destacar os estados vazios e os dias de fim de semana.
- Priorizar os totais de Estatísticas de estudo e disponibilizar a série diária em uma tabela compacta recolhida por padrão.
- Aumentar em cerca de 3 px a separação abaixo do botão Google em login e cadastro. Animar o retorno à landing e as mudanças de etapa e retorno à entrada na recuperação de senha.

## Capabilities

### New Capabilities

### Modified Capabilities

- `frontend-ui-controls` — altura e espaçamento dos campos de linha única e paginação de baralhos no rodapé.
- `dashboard-presentation` — layout estável, cabeçalhos compactos e estado vazio de Progresso.
- `subjects-and-tasks-empty-states` — preenchimento da área disponível pelo estado vazio de Matérias.
- `account-profile-visual-experience` — reorganização do perfil, alinhamento do vínculo Google e integração do Classroom no card de acesso.
- `study-routines` — composição responsiva e apresentação dos dias vazios na programação.
- `study-analytics` — resumo do período e detalhes diários sob demanda.
- `user-authentication` — espaçamento da ação Google e transição de volta à landing.
- `account-recovery` — transições disparadas por ações da recuperação.

## Impact

A mudança afeta `apps/web` e os estilos dos controles existentes em `packages/ui` quando compartilhados. As ações usam as rotas, contratos, dados e validações atuais. A proposta ativa `refine-auth-desktop-layout` também toca a autenticação. O espaçamento e o movimento devem coexistir com a matriz de acomodação desktop daquela mudança.
