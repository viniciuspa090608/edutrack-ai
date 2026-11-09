# Design

## Context

A tela ProfilePage já concentra o perfil em um card e mantém o arquivo selecionado e a prévia até o upload explícito. A Home usa uma composição assimétrica e aplica rolagem a alguns resumos, entre eles o Pomodoro. Relatório já tem duas rotas que compartilham navegação. As listas paginadas usam peças de `packages/ui` com controles e indicadores compostos em cada tela.

## Goals / Non-Goals

- Reutilizar controles e tokens existentes, com verificações nos temas claro e escuro e a partir de 320 px.
- Concentrar o trabalho na apresentação web e na entrada padrão de Relatório. Preservar modelos, contratos, consultas, regras de validação e fluxos de conta, sessão e estudo.

## Decisions

- Em ProfilePage, estilizar localmente o seletor de arquivo acionado por Alterar foto, mantendo associação acessível com o campo nativo e a prévia existente. Manter Salvar foto disponível para a seleção pendente. Reutilizar os componentes de campo, botão e avatar existentes sem alterar seus estilos base. Tratar a linha de e-mail como leitura com a ação segura existente.
- Usar no tema escuro os tokens mais próximos de `#1C2025` para o card, `#101418` para campos, `#555E69` para bordas, `#394149` para divisórias, `#41C3DC` para ações principais, `#F3F4F6` e `#98A5B4` para textos. Aplicar padding de 24–32 px quando houver espaço, 24 px entre seções e raios de 8–12 px nos controles. A linha de nome usa um campo flexível com `min-width: 0`, botão de largura intrínseca, altura visual de 44–48 px e intervalo de cerca de 12 px.
- Em DashboardPage e dashboard.css, dar às posições de Matérias e Progresso duas colunas iguais quando ambos estiverem lado a lado e alinhar os rodapés com o crescimento natural do corpo. Usar estilo local para retirar a borda interna do componente de estado vazio na Home. Formatar a data civil do histórico em dia, mês e ano sem conversão de fuso. Em DashboardPomodoro, retirar status e ação redundante do resumo normal, conservar reconciliação e feedback de erro e liberar a restrição de rolagem interna do card.
- Em RoutinesPage e routines.css, manter a ordem de leitura dos dias e distribuir o espaço por linha. Uma grade de 12 colunas permite ocupar 3 por card na primeira linha e 4 na segunda. No arranjo menor, cada par divide a largura e domingo ocupa a linha toda. Usar o espaço efetivo da programação para determinar a transição e permitir a quebra de conteúdo a 320 px.
- Compactar apenas o estado fechado dos disclosures nativos de TasksPage e AnalyticsPage. Em TasksPage, colocar Ver detalhes na mesma linha do bloco de título e prazo somente na composição sem subtarefas. Usar quebra responsiva e manter a ordem de foco.
- Apontar a entrada Relatório em AuthenticatedShell para Progresso e ajustar ProgressPresentation para refletir essa ordem, preservando o destaque do menu em ambas as rotas. A entrada pelo menu muda de destino e os links diretos continuam funcionando.
- Reaproveitar a aparência fina da barra da lista de Tarefas como estilo nativo global da web, incluindo trilho discreto e indicador em cinza do tema. Rever sobrescritas locais como analytics.css. O desfoque nas extremidades continua sendo próprio da lista de Tarefas.
- Padronizar a composição direcional sobre as peças existentes de paginação, com dois botões compactos de seta, foco visível, nomes acessíveis e estado desabilitado nativo. Remover os indicadores visuais de página dos consumidores, mantendo a página atual e as contagens que controlam as consultas e os limites. Conservar o posicionamento de rodapé nas listas de baralhos.

## Risks / Trade-offs

- Conteúdo longo, zoom ou e-mail extenso podem pressionar as colunas. Validar quebras e foco nos dois temas, incluindo programação e formulário de perfil a 320 px.
- Sistemas e navegadores renderizam barras nativas de maneiras diferentes. Usar as propriedades suportadas e preservar o fallback e as preferências do usuário.
- A remoção dos controles redundantes de Pomodoro pode afetar os estados de erro. Manter mensagem e nova tentativa quando a sincronização falhar, com a ação do módulo sempre alcançável.
- Igualar as dimensões da dupla pode aumentar a altura do card com menos conteúdo. Alinhar os rodapés sem impor altura fixa e usar altura natural na composição empilhada.
