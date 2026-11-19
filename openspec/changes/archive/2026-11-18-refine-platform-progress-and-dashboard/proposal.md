# Proposal

## Why

As referências e o uso real revelam pouco espaço útil no dashboard, disciplinas cadastradas ausentes da Home e instabilidade visual no relatório. Preferências e conquistas também precisam refletir a organização e a identidade já usadas pela plataforma.

## What Changes

- Usar nos cards de conquistas de Progresso as mesmas cores das medalhas do dashboard.
- Exibir todas as disciplinas cadastradas na lista rolável da Home, ampliando sua área útil sem aumentar o card.
- Adicionar barra proporcional ao percentual nos cards da listagem de disciplinas.
- Estabilizar a posição de Imprimir relatório desde a primeira renderização, ao recarregar e alternar abas.
- Ordenar preferências como a sidebar: Tarefas, Disciplinas, Flashcards, Pomodoro, Rotinas, Relatório e Recursos de IA; adicionar desativação persistida de Rotinas.
- Mover a orientação sobre salvamento e preservação de dados para abaixo do título Conta.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `user-dashboard`: substituir o destaque único por coleção completa de disciplinas acessível em páginas locais.
- `dashboard-presentation`: ampliar a área útil da lista sem aumentar as dimensões externas.
- `subjects-visual-experience`: representar o percentual oficial por barra e texto.
- `progress-and-achievements-visual-experience`: garantir aplicação efetiva das cores das medalhas aos cards.
- `study-report-printing`: garantir posição estável da ação durante carregamento e navegação.
- `module-preferences`: incluir Rotinas e ordenar a grade conforme a navegação.
- `account-profile-visual-experience`: reposicionar a orientação abaixo do título principal e alinhar a ordem das opções.

## Impact

Alterações futuras na web (dashboard, disciplinas, relatório, conta e shell), contratos de dashboard/preferências, services/repositories públicos e persistência da API. A nova preferência requer migration MySQL com padrão ativo, sem apagar rotinas. O contrato interno de resumo de disciplinas passa de destaque singular para coleção paginada; API e web serão atualizadas juntas. Sem novas dependências, alteração de regras de progresso, publicação ou implementação nesta proposta.
