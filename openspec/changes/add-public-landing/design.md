# Design

## Context

Ver [proposal.md](proposal.md). `apps/web` é uma aplicação React/Vite sem roteador. `App.tsx` contém somente a tela técnica com `ApiStatus`; `main.css` já define largura mínima de 320 px, foco visível e redução de movimento. A API e o banco não precisam mudar. Ainda não há specs publicadas em `openspec/specs/`; a spec da tela técnica está na mudança `bootstrap-study-platform` e assume a URL inicial.

## Goals / Non-Goals

**Goals:** apresentar a EduTrack com leitura e navegação claras em celular e desktop; manter a página técnica e seu teste de health check; preparar chamadas de acesso honestas enquanto a autenticação não existe.

**Non-Goals:** implementar cadastro, login, dashboard, dados reais dos módulos, integração de IA, formulários de captura ou novas rotas de API.

## Decisions

### 1. Composição e rotas pequenas

`App` selecionará três telas pelo caminho da URL: `/` para `PublicLanding`, `/acesso` para a página provisória e `/status` para a página técnica atual, extraída sem alterar `ApiStatus`. As páginas ficarão em `apps/web/src/features/landing` e `apps/web/src/features/system`, conforme a organização por funcionalidades. Links normais permitirão abrir cada caminho diretamente; o servidor de hospedagem precisará devolver `index.html` para essas rotas. Um roteador completo foi considerado, mas adicionaria dependência e configuração sem necessidade para três páginas estáticas.

O conteúdo da landing será independente da chamada de health check. Assim, uma API indisponível não cria loading ou erro na apresentação pública. O status técnico continuará responsável por mostrar esses estados em `/status`. Atualizar `index.html` para título e descrição da EduTrack; o título da aba poderá ser ajustado por tela.

### 2. Conteúdo e linguagem

Estrutura: hero com proposta de valor e chamada de acesso; carrossel de recursos; seção **Funcionalidades** com cartões resumidos para os recursos do produto; seção **Tecnologias** com a stack efetivamente presente; convite final de cadastro; rodapé simples. A copy deverá falar em visão e disponibilidade futura dos módulos. Não incluir números de usuários, resultados, depoimentos ou recursos em operação sem evidência. O acesso provisório exibirá **Em breve** e link de retorno. Quando `add-user-authentication` existir, suas rotas substituirão esse destino, sem reescrever os CTAs da landing.

### 3. Header e layout

O header usará `position: fixed`, largura da viewport e altura consistente por breakpoint. O conteúdo começará abaixo dele, e as seções terão compensação de rolagem (`scroll-margin-top`). A rolagem permanece no documento, sem contêiner interno com scroll. No desktop: marca, links de seção e CTA. No mobile: fora do menu somente CTA e botão de menu, com a marca apresentada no hero; os links ficam no painel que o botão abre.

O botão do menu terá nome acessível, `aria-expanded` e `aria-controls`. Os links serão elementos `<a>` nativos. Seleção e Escape fecham o painel; Escape devolve foco ao botão. Ao atravessar o breakpoint para desktop, o painel aberto será fechado. O layout se ajustará a 320 px sem rolagem horizontal. A escolha de breakpoint e as dimensões finais podem ser calibradas no apply, preservando o comportamento especificado.

### 4. Carrossel e imagens

Um componente React local controlará índice ativo, temporizador e pausa. Haverá pelo menos três slides, com imagem ilustrativa local (`<img>` com texto alternativo apropriado) e descrição curta. SVGs originais e simples em `apps/web/public/illustrations` evitam rede externa e mantêm o estilo minimalista; ícones de interface vêm de `lucide-react`, conforme pedido. Os SVGs ilustrativos são imagens, não substitutos dos ícones Lucide. O conjunto inicial sugerido é tarefas, roadmaps, Pomodoro e flashcards; os demais recursos aparecem na seção de funcionalidades.

Avanço automático em intervalo suficiente para leitura (proposta: 6 segundos), retorno ao primeiro slide após o último, botões anterior/próximo e indicadores com rótulos. Pausar enquanto houver hover, foco dentro do componente ou documento oculto. `prefers-reduced-motion: reduce` desliga o avanço automático e as transições decorativas, mantendo todos os controles. Evitar anunciar automaticamente cada troca ao leitor de tela; o slide ativo e os controles terão identificação sem gerar interrupções repetidas. Uma biblioteca de carrossel foi considerada, mas o comportamento limitado pode ser mantido localmente com menos peso e menos superfície de configuração.

### 5. Estilos e dependências

Usar CSS mobile-first e semântica HTML (`header`, `nav`, `main`, `section`, `footer`), com grid responsivo, imagens dimensionadas e contraste legível. Preservar foco visível e a regra de movimento reduzido. Animate.css já está instalada; seu uso, se houver, será pontual e decorativo. Adicionar somente `lucide-react` como dependência nova, com ícones em botões e cartões. Botões com ícone terão rótulo acessível no próprio botão; ícones decorativos não substituem texto.

## Risks / Trade-offs

- [Rota direta em hospedagem estática] → documentar/configurar fallback de `/acesso` e `/status` para `index.html` no ambiente de publicação; verificar navegação direta no preview local.
- [Spec antiga da página técnica fala em URL inicial] → preservar o comportamento em `/status` e atualizar/reconciliar a spec de `bootstrap-study-platform` quando suas specs forem sincronizadas ou arquivadas; não publicar duas exigências contraditórias para `/`.
- [Avanço automático atrapalha leitura] → intervalo de leitura, pausa por interação, controles manuais e desativação com movimento reduzido; cobrir com testes de temporizador e interação.
- [Texto sugere módulos prontos] → revisão editorial dos rótulos e CTAs antes do aceite; `/acesso` informa indisponibilidade real.
- [Header ocupa largura no celular] → no mobile, fora do menu ficam somente CTA e ícone; validar visualmente a 320 px e com texto ampliado.

## Migration Plan

1. Extrair a página técnica atual e seus testes para `/status`.
2. Publicar a landing em `/` e a página provisória em `/acesso`; atualizar metadados e links internos.
3. Verificar navegação direta das três rotas, viewport de 320 px, teclado, movimento reduzido e regressão do health check.
4. Em eventual rollback, restaurar a página técnica como tela inicial; não há dados ou API a migrar.

## Open Questions

Nenhuma para esta mudança. Identidade visual definitiva e endereço final de autenticação serão definidos nas mudanças próprias, sem alterar os requisitos desta landing.
