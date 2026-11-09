# Design

## Context

A Home já posiciona seus cards em uma grade desktop, mas parte do dimensionamento depende dos estados vazios em `dashboard.css`. A página de estatísticas renderiza os valores diários em blocos repetidos. `ProfilePage` exibe `ClassroomSection` como card separado e o onboarding também usa esse componente. `AccessPage` usa o mecanismo de links públicos e `PasswordRecoveryPage` muda de etapa conforme o resultado real da operação.

## Goals / Non-Goals

- Aplicar as mudanças na camada de apresentação, reutilizando componentes, rotas, dados, estados e tokens existentes.
- Manter as operações de conta, recuperação, Classroom, rotinas e relatórios com os contratos atuais.

## Decisions

1. **Controles e limites de layout.** Usar a altura de linha única dos controles compartilhados como referência para texto, seleção e o gatilho de data, com ajustes locais para variantes cujo tamanho é intencional. Definir colunas iguais e responsivas na área de filtros. Na lista de baralhos, usar uma região de conteúdo flexível com rodapé reservado dentro do shell e rolagem no corpo da lista quando necessária. Essa composição evita que um rodapé sobreposto esconda o último item ou a barra do celular.
2. **Home e Matérias.** Usar as linhas da grade e a composição vazia como referência para dimensionar os cards em desktop. Separar cabeçalho, conteúdo e rodapé de Tarefas para que somente a lista cresça dentro da área rolável. Em layouts empilhados ou com módulos omitidos, usar altura natural quando necessário para preservar leitura e acesso. Na página de Matérias, estender o card por meio do contêiner da rota e da altura útil do shell, descontando cabeçalho, margens e navegação. Isso permite rolagem legítima em telas baixas ou com zoom.
3. **Conta.** Reagrupar os formulários reais de foto, nome e e-mail em Seu perfil. Manter o destino de Segurança coerente com o conteúdo exibido e preservar seus fluxos de senha e identidade. Usar seções semânticas e divisórias no card Acesso à conta, mantendo vínculo Google e autorização Classroom independentes. Dar a ClassroomSection uma forma de composição embutida na Conta e preservar o card autônomo no onboarding. Ajustar a navegação interna aos destinos reais sem remontar formulários durante a rolagem.
4. **Programação e relatórios.** Usar uma grade de quatro colunas no desktop com os três últimos cards do mesmo tamanho dos demais. Adotar 160 px como altura mínima inicial e 20 px de intervalo, ajustáveis dentro das faixas da spec. Reaproveitar o formulário de criação de rotina para a ação do dia vazio, inicializando o primeiro horário com o dia escolhido e mantendo o salvamento explícito. Para estatísticas, usar uma seção expansível acessível com tabela semântica e rolagem horizontal contida à tabela se precisar de mais largura.
5. **Movimento e foco.** Aproveitar o mecanismo de navegação pública e as classes de movimento já usadas no acesso. Iniciar o efeito na chegada ao destino ou na etapa efetivamente confirmada, sem aguardar eventos de animação para navegar. Preservar a semântica dos links, o foco de destino e os anúncios do fluxo. Usar os estados da recuperação como gatilhos, evitando reiniciar a animação em feedback ou digitação.

## Risks / Trade-offs

- Alturas estáveis podem comprimir textos longos, feedback ou alvos de foco. Conferir teclado, zoom, largura de 320 px, altura reduzida e os dois temas. A área rolável de Tarefas precisa ser alcançável e manter ações e mensagens visíveis.
- Incorporar o Classroom pode afetar âncoras da Conta e a composição no onboarding. Conferir os dois locais, incluindo estados conectado e desconectado, importação e feedback.
- Acrescentar espaço em login e cadastro pode ultrapassar a altura útil na matriz de `refine-auth-desktop-layout`. Conferir 1366×768, 1440×900 e 1920×1080 a 100%, inclusive com feedback simultâneo suportado. Coordenar o ajuste no layout compartilhado.
- Recolher a tabela reduz o comprimento inicial da página e acrescenta uma ação para chegar à série diária. Dar nome claro ao controle e preservar todas as datas e métricas disponíveis.

## Migration Plan

Publicar junto do frontend. A reversão segue o deploy da versão anterior do frontend.
