# Proposal

## Why

Os cards e controles da área de estudos apresentam espaçamentos e alinhamentos inconsistentes. Uma composição mais compacta e previsível facilita a leitura e o acesso às ações em diferentes larguras.

## What Changes

- Reorganizar o card único Seu perfil com cabeçalho descritivo, controles compactos de foto, edição de nome e acesso à troca segura de e-mail.
- Compactar os painéis Filtros recolhidos de Tarefas e Estatísticas e alinhar Ver detalhes ao fim da linha nas tarefas sem subtarefas.
- Exibir Progresso como primeira aba e destino padrão de Relatório.
- Organizar a Programação semanal em 4–3 e 2–2–2–1, preenchendo a largura de cada linha.
- Igualar os cards Matérias e Progresso na Home, retirar as bordas pontilhadas internas dos estados vazios de Tarefas e Matérias, encurtar a data do histórico e simplificar o resumo do Pomodoro.
- Padronizar as barras de rolagem e exibir apenas controles direcionais na paginação.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `account-profile-visual-experience` — hierarquia e controles do card Seu perfil.
- `dashboard-presentation` — dimensões, estados vazios, histórico e resumo do Pomodoro na Home.
- `frontend-ui-controls` — filtros recolhidos, barras de rolagem e paginação.
- `progress-and-achievements-visual-experience` — ordem e destino inicial das abas de Relatório.
- `study-routines` — distribuição semanal responsiva.
- `tasks-visual-experience` — posição de Ver detalhes quando não há subtarefas.

## Impact

A mudança afeta a interface React, os estilos da web e os controles de paginação reutilizados. Preserva APIs, persistência, validações e fluxos de edição. As referências visuais do perfil orientam o tema escuro com os tokens existentes e mantêm o tema claro funcional.
