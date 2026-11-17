# Proposal

## Why

Os ajustes reunidos nas configurações, na navegação e nos fluxos de estudo reduzem a repetição visual e facilitam o acesso a preferências, detalhes e ações dos cartões.

## What Changes

- Simplificar os textos e espaçamentos da Conta e exibir as seis preferências em uma grade responsiva de três colunas por duas linhas, com controles para desativar e ocultar Pomodoro e ocultar Relatório.
- Reordenar o menu lateral e oferecer **← Voltar** nas telas de detalhes.
- Centralizar o cabeçalho de Filtros recolhido, ajustar o espaço do aviso de origem do Classroom e unificar a superfície dos modais, com hover menor no botão de fechar.
- Reunir as ações de cada flashcard em um modal e centralizar o modal de edição na tela.
- Mostrar os baralhos com mais cartões no dashboard, com rolagem e desfoque iguais aos de Tarefas, e reutilizar a rolagem em Matérias.
- Ajustar a revisão de baralhos para evitar rolagem, usar uma transição sutil e finalizar no resumo do baralho com o toast “Revisão concluída”.

## Capabilities

### New Capabilities

### Modified Capabilities

- `account-profile-visual-experience` — textos e espaçamentos da Conta.
- `module-preferences` — grade e novas preferências de Pomodoro e Relatório.
- `authenticated-shell-visual-experience` — ordem do menu e retorno em detalhes.
- `frontend-ui-controls` — modais e alinhamento de filtros.
- `google-classroom-integration` — espaçamento do aviso de origem.
- `manual-flashcards` — modal de ações do cartão.
- `dashboard-presentation` — listas internas de baralhos e matérias.
- `spaced-repetition` — apresentação e conclusão da revisão de baralho.

## Impact

A mudança afeta a interface React, os componentes compartilhados de diálogo e os fluxos de navegação e revisão. As novas preferências exigem atualização dos contratos, da API e da persistência por conta. O dashboard precisa de acesso autorizado aos nomes e totais dos baralhos.
