# Design

## Context

Ver proposal.md para motivação. AuthenticatedShell.tsx contém IA com Sparkles e Assistente IA com Layers; module-catalog.ts inicia por Tarefas. account.css já usa sticky com top: 20px, insuficiente diante do cabeçalho fixo e sem limite de altura útil. DashboardPomodoro projeta tempo local e reconcilia com currentPomodoro; DashboardPage possui fluxo real de início. AssistantPage já implementa histórico por data, paginação, três sugestões condicionais, retry e prévias; assistant.css oferece apenas uma grade básica.

As specs atuais exigem IA separada e a ordem antiga em partes do shell, além de Abrir pomodoro em requisitos do dashboard. Os deltas substituem explicitamente esses trechos e preservam os demais cenários. A ordem mobile acompanha Disciplinas antes de Tarefas, mantendo a arquitetura de barra inferior e Mais.

## Goals / Non-Goals

**Goals:** reutilizar estado e serviços existentes, compartilhar medidas do shell e tokens de tema e evitar regiões inacessíveis por rolagem.

**Non-Goals:** alterar backend, contratos, política de retenção, limites, elegibilidade ou ferramentas da IA. A referência é inspiração visual; manter as três sugestões já suportadas, sem criar uma quarta ação de revisão. Títulos do histórico continuam baseados na data disponível na API.

## Decisions

1. Reordenar os catálogos e a construção do menu existente, removendo somente a entrada IA. Reutilizar Sparkles no assistente e uniformizar o rótulo Assistente de IA. Manter configuração em Conta e seus links diretos. Alternativa de duplicar catálogos visuais foi descartada para reduzir divergência entre ordem visual e teclado.
2. Corrigir sticky da Conta com offset derivado do cabeçalho e espaço de respiro, max-height calculado pela viewport dinâmica e overflow-y auto. Em mobile usar fluxo normal. Ajustar scroll-margin das seções e conferir useAccountSections. Position fixed foi descartado por retirar a coluna do grid e exigir compensações frágeis.
3. Derivar o CTA do Pomodoro do estado confirmado, comunicando mudanças do componente vivo ao card se necessário. Zero projetado dispara reconciliação antes de habilitar início. No zero confirmado, o CTA leva ao fluxo real: sem sessão reutiliza o início já existente; com sessão aberta leva ao módulo para continuar conforme seu estado. Não reinterpretar BETWEEN_BLOCKS como ausência de sessão. Evitar dois CTAs concorrentes de início. Manter Abrir pomodoro com tempo positivo, sincronização recuperável e contadores reais.
4. Reorganizar a marcação do assistente sem substituir suas operações: cabeçalho, histórico, aviso persistente, estado inicial, mensagens e compositor. Usar cards com ícones existentes, duas colunas quando houver espaço e uma em largura estreita. Manter histórico por data e controles de paginação. Aviso persistente evita criar preferência de ocultação e preserva transparência antes de cada envio.
5. Usar grid/flex com min-width/min-height zero e painel de mensagens rolável com compositor no rodapé do painel. Evitar position fixed global no compositor para respeitar shell e teclado virtual. Histórico mobile recolhível inline, sem modal adicional. Enter sem Shift envia apenas fora de composição IME; formulário continua sendo a única rotina de envio. Manter mensagens textuais seguras, prévias completas e confirmações existentes.
6. Usar tokens semânticos de background, card, border, primary, muted e ring; nenhuma paleta paralela copiada da referência. Conferir claro/escuro, zoom, movimento reduzido e 320 px.

## Risks / Trade-offs

- Zero transitório pode sugerir início duplicado → aguardar reconciliação e respeitar sessão aberta.
- Rolagem aninhada pode esconder foco → limitar somente regiões necessárias, verificar teclado e última ação em pouca altura.
- Duas navegações laterais podem comprimir o chat → histórico recolhível em telas estreitas e largura flexível no desktop.
- Mudança de marcação pode afetar retry e confirmação → manter estado/operações e executar regressões existentes com casos de conversa longa e prévia.

## Migration Plan

Aplicação somente na web, sem migração de dados. Reversão pelo commit da mudança restaura apresentação anterior. No apply, registrar Git inicial, trabalhar em branch adequada e concluir apenas após checks; preparar snapshots semânticos e manifesto explícito conforme README para openspec:finish, incluindo implementação, tasks final, sync e archive em um único commit local, sem push.
