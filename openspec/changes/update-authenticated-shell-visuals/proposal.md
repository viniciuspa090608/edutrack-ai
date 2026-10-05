# Proposal

## Why

O header autenticado reúne todos os destinos em links que quebram em várias linhas, dificultando a leitura e o uso em telas pequenas. A referência visual do Stitch permite reorganizar esse shell com header simples, sidebar desktop e navegação inferior mobile, preservando funcionalidades e estados reais do EduTrack.

## What Changes

- Manter logo/logotipo com destino `/app` à esquerda e apresentar somente controle de tema e avatar com acesso a `/conta` à direita.
- Apresentar os destinos existentes em sidebar no desktop e em barra inferior no mobile, com Início, módulos de estudo habilitados e Mais, sem lacunas para módulos desativados.
- Agrupar em Mais Pomodoro, Rotinas, Estatísticas, Progresso, Conta e Sair; reutilizar a ação de logout atual.
- Usar tokens, Inter, ícones e primitives existentes para temas claro/escuro, foco, interação, safe area e scroll em pouca altura; reservar apenas o espaço externo necessário ao shell.
- Exibir somente a foto confirmada, com integração mínima de apresentação aos dados de perfil existentes e fallback; não publicar previews do editor.
- Preservar rotas, parâmetros, subfluxos, preferências, sessão, logout e conteúdo interno de todos os módulos e da Conta.
- Tratar o Stitch somente como referência: excluir busca, notificações, assinatura, dados fictícios e destinos sem equivalente real.

## Capabilities

### New Capabilities

- `authenticated-shell-visual-experience`: apresentação responsiva e acessível do shell autenticado e de sua navegação existente, sem novas funcionalidades de produto.

### Modified Capabilities

Nenhuma. Os contratos funcionais de autenticação, perfil, módulos e tema permanecem vigentes; a nova capacidade especifica apenas a apresentação observável do shell.

## Impact

- Futuro apply limitado a `PrivatePage.tsx`, componentes locais de apresentação do shell, seus estilos e testes relacionados. Pequena integração com callbacks confirmados de `ProfilePage.tsx` é permitida para atualizar o avatar, sem alterar o editor ou os fluxos de foto.
- Reutilizar `module-catalog.ts`, `auth-api.ts`, `profile-api.ts`, `app/theme.ts`, Button, Avatar, Sheet e `lucide-react`; sem novas dependências, endpoints ou mudanças em contratos/backend.
- Referência disponível: `C:/Users/vinic/Downloads/dashboard_edutrack_ai.zip`, com screenshots e HTML desktop/mobile claros/escuros. Não há anexo específico de shell nesta solicitação; usar o shell dessas referências já adotadas pelo projeto.
- Sem alterações no header público, autenticação pública, cards, listas, gráficos, filtros, ordenação, formulários ou detalhes. Não refatorar roteamento, arquitetura ou estado global.
- Esta proposta gera somente planejamento. Testes e commit pertencem ao futuro apply, com verificações obrigatórias do AGENTS.md e um único commit de conclusão, sem push, tag ou archive.
