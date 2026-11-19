# Proposal

## Why

A navegação possui uma entrada de IA redundante, o Pomodoro zerado oferece uma ação pouco clara e a coluna da Conta fica cortada durante a rolagem. O Assistente precisa de melhor hierarquia visual conforme a referência enviada, mantendo as cores do projeto.

## What Changes

- Manter Início no topo e ordenar Disciplinas, Tarefas, Flashcards, Pomodoro, Rotinas, Relatório, Assistente de IA e Conta; remover IA e transferir seu ícone de estrelas ao assistente.
- Colocar Disciplinas antes de Tarefas nas preferências.
- Mostrar Iniciar pomodoro no resumo zerado da Home.
- Manter perfil e navegação da Conta abaixo do cabeçalho durante a rolagem, sem cortes.
- Renovar o Assistente com histórico lateral, cabeçalho compacto, Nova conversa, aviso de privacidade, boas-vindas, cards de sugestões e compositor inferior integrado.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `authenticated-shell-visual-experience`: ordem e ícone dos destinos, removendo IA redundante.
- `module-preferences`: ordem da grade.
- `account-profile-visual-experience`: coluna lateral sem cortes e preferências coerentes.
- `dashboard-presentation`: ação contextual do Pomodoro zerado.
- `ai-study-assistant`: apresentação de histórico, sugestões e compositor.

## Impact

Somente web e verificações pertinentes: AuthenticatedShell, module-catalog, ProfilePage/account.css, DashboardPage/DashboardPomodoro e AssistantPage/assistant.css. Preservar APIs, contratos, elegibilidade, módulos ativos, paginação, retenção e confirmações idempotentes. Sem novas dependências ou migrations.

## Non-goals

Anexos, microfone, busca, títulos gerados por IA, novos provedores, simulados, novos recursos de revisão e dados fictícios da referência.
