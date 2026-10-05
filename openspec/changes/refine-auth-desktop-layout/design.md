# Design

## Context

Ver `proposal.md` para motivação. Foram analisadas as specs principais `user-authentication`, `public-landing` e `quality-commands`, os artefatos proposal/design/tasks/delta/validation de `update-auth-screens-from-stitch`, o layout e CSS atuais, os três formulários, o cliente auth, as rotas e testes de UI.

`AuthLayout` é compartilhado pelas três rotas e usa grid 43/57, painel contextual e formulário limitado a 30rem. `auth.css` tem `min-height: 100svh`, padding calculado pela largura, gap de 3rem no painel, features espaçadas, ilustração de 10rem e margens generosas. O único breakpoint estrutural é por largura (900 px); não há adaptação por altura. Isso identifica uma pressão de altura, mas não constitui medição visual de overflow nesta etapa de planejamento. Os estilos privados/de conta também estão no arquivo e não devem ser afetados.

`AccessPage` mantém tabs, e-mail/senha, dica de cadastro, dois links inferiores, status `account=updated`, erro OAuth e erro de submissão, que podem coexistir. Google é um anchor com `Button asChild variant="outline"`, sem logo. A variante compartilhada usa cores de tema e altera fundo no hover, inclusive no escuro; será necessário estilo local com precedência sobre essas regras, sem editar Button global.

Confirmação contém instrução, status, erro, código, envio, reenvio/contador e retorno; `done` remove formulário e orienta entrada. Recuperação mantém `request`, `code`, `password`, `done` na mesma rota; status de solicitação/código pode coexistir com erros nas etapas seguintes. Títulos recebem foco; erros usam alert e status usam anúncio acessível. Preservar exatamente handlers, bloqueios existentes e contador/Retry-After, sem adicionar restrições ao Google ou tabs por inferência.

A mudança anterior está concluída, mas não sincronizada: os três requisitos de seu delta ainda não constam da spec principal. O requisito provisório de `/acesso` em `public-landing` também diverge da implementação e da spec principal de autenticação. Este refinamento toma o fluxo implementado e `user-authentication` como contexto, não reintroduz o provisório nem sincroniza/arquiva outras mudanças. Seu delta adiciona requisitos com nomes próprios e complementares, evitando depender de um MODIFIED cujo alvo só existe em outro delta.

A validação anterior cobriu 56 combinações por largura (320/375/768/1440), feedback e zoom, com ausência de overflow horizontal. Não certificou altura exata nem ausência de scroll vertical. Sua exceção autorizada de verificações restritas era específica daquele pedido; aqui valem os quatro comandos gerais do AGENTS.md. Git estava limpo antes de criar esta proposta.

## Goals / Non-Goals

**Goals:** dimensionar a composição pelo orçamento vertical do estado mais alto, manter fluxo normal e tornar verificável o ajuste por viewport; conservar paleta, tipografia, painel e hierarquia existentes.

**Non-Goals:** alterar backend, contratos, auth-api, sessão, rotas, política de senha, textos de segurança, tema global, componentes compartilhados, landing ou área privada; inventar campos/etapas, instalar dependências, obter nova referência Stitch, sincronizar ou arquivar mudanças anteriores.

## Decisions

1. **Fluxo natural com densidade por altura.** Manter `min-height` e crescimento do documento, grid com `minmax(0, ...)`, tamanhos intrínsecos e centragem que não torne o topo inacessível quando conteúdo cresce. Usar tokens locais de espaçamento e media queries combinando largura desktop e altura, calibrados em 768/900/1080. Reduzir primeiro padding, margens entre blocos, separadores e decoração; preservar tamanho legível de texto e controles. Altura fixa, escala global, scroll interno do formulário e `overflow: hidden/clip` para encobrir excedente foram descartados porque não comprovam acomodação e podem cortar foco/conteúdo. Não usar JS para medir e esconder conteúdo a cada render.
2. **Painel subordinado ao conteúdo funcional.** Preservar marca, gradiente, título e direção visual; compactar features e ilustração em alturas menores, podendo omitir apenas ornamentos/repetições promocionais sem instrução funcional. Não ocultar dica de spam, instruções de código, política de senha, mensagens ou ações para cumprir a altura. Mudanças de JSX, se necessárias, limitam-se à apresentação em AuthLayout/formulários; não alterar estado, handlers ou semântica.
3. **Orçamento com feedback coexistente.** Dimensionar para textos atuais completos, incluindo combinações permitidas de status, OAuth e erro de submissão em acesso e status+erro em confirmação/recuperação. Não reservar alturas arbitrárias de alertas nem impor line-clamp. Conteúdo excepcional é uma exceção explícita: cresce com scroll normal e quebra trechos longos. Testar também foco, outline e balões de validação nativa; não alterar validação HTML para ganhar espaço.
4. **Google local e estável.** Adicionar SVG/asset local fiel à logo multicolorida, com dimensões explícitas, sem fonte de ícones monocromática ou imagem remota em runtime; registrar origem do asset no apply. Ícone decorativo com `aria-hidden` ou alternativa vazia mantém nome do link. Escopar fundo branco e texto escuro a `.auth-google`, inclusive hover/focus-visible/active e tema escuro, com borda e sombra/contorno para feedback. Verificar cascata real de Tailwind e CSS e tamanho do SVG imposto pelo Button. Não mudar variante global, URL, `asChild` ou semântica do anchor. Preservar foco contrastante contra branco e superfície externa.
5. **QA em navegador com altura efetiva.** Resoluções significam viewport de conteúdo em CSS px a 100%, não tamanho externo da janela. Medir documento e regiões internas após fontes/render e feedback; `scrollHeight <= clientHeight + 1` e `scrollWidth <= clientWidth + 1` (tolerância só de arredondamento) e verificar bounding boxes/conteúdo/foco por capturas e inspeção. Um teste DOM/jsdom não comprova layout. Usar respostas controladas apenas para alcançar estados de UI, sem implementar mocks de banco nem alegar que isso valida OAuth real. Manter testes existentes de URL/retorno e revisar diff para preservação da integração.

### Matriz de aceitação para o apply

Cada linha abaixo deve ser verificada nos dois temas e nas três viewports de referência a 100%; não basta uma captura de cada rota. Não inventar estado de loading/erro para `done` nem tela local de sucesso para acesso que atualmente redireciona.

| Tela/etapa | Estados e combinações obrigatórios |
| --- | --- |
| Login | Inicial; required/e-mail inválido; busy; credencial inválida/limitação/rede; OAuth genérico/conflito; account=updated; combinação de aviso+OAuth+erro de submissão; resultado ativo/pendente preservado |
| Cadastro | Inicial com dica 12–128; validação e-mail/senha; busy; conflito/limitação/rede; mesmos avisos e combinações de acesso; sucesso pendente segue confirmação |
| Confirmação | Inicial; código incompleto; confirmação busy; erro inválido/expirado/rede com status; reenvio busy; sucesso do reenvio+contador; 429/Retry-After; sucesso final e entrada |
| Recuperação request | Inicial; required/e-mail inválido; busy; erro/limitação/rede; resposta genérica leva a code |
| Recuperação code | Status genérico; código incompleto; busy; erro inválido/expirado/rede coexistente; reenvio busy/sucesso/erro |
| Recuperação password | Status de código validado; validação 12–128; busy; contexto expirado; rede com resultado incerto; reiniciar solicitação |
| Recuperação done | Mensagem de sucesso confirmado, título e retorno ao login |

Repetir todas as linhas em 320×568, 375×667, 768×600 e 1366×600 a 100%, permitindo scroll vertical. Repetir todas as linhas com zoom real de navegador em 200% nas três resoluções desktop; registrar viewport efetiva e não substituir zoom por `transform: scale` ou apenas alteração de CSS. Exercitar texto excepcional longo (por exemplo 1000 caracteres com trecho contínuo de 200) nas regiões de feedback de cada fluxo, nos dois temas, com scroll permitido e sem overflow horizontal. Os valores são fixtures de QA, não limites de produto.

Em cada tela/etapa, percorrer Tab/Shift+Tab, operar tabs por setas e ativar controles pela tecla adequada; verificar rótulos, foco do título/transição, alert/status, bloqueios existentes, início/fim alcançáveis e movimento reduzido. Google exige inspeção dos estilos computados e visual em repouso/hover/foco/active nos dois modos e temas; superfície branca `rgb(255,255,255)`, logo multicolorida, texto escuro e feedback perceptível. Evidências devem identificar tema, viewport, zoom, estado e resultado; não registrar segredos.

## Risks / Trade-offs

- [768 px deixa pouco orçamento com vários avisos] → validar primeiro o pior estado, compactar espaços e ornamentos; não esconder mensagens nem declarar sucesso só porque scrollbar foi removida.
- [Centragem em conteúdo alto desloca início para fora da área rolável] → usar crescimento natural/alinhamento seguro e testar extremos com teclado e zoom.
- [Estilos compartilhados vencem regras do Google] → verificar estilos computados em todos os estados e escopar precedência sem alterar Button global.
- [Compressão empobrece identidade ou legibilidade] → preservar tokens e hierarquia e comparar capturas de 768/900/1080, com densidade confortável onde houver altura.
- [Specs antigas divergentes contaminam escopo] → registrar divergência, adicionar requisitos independentes nesta capability e não editar/spec-sync de outras mudanças.
- [Suíte geral exige infraestrutura de banco] → preparar MySQL real isolado conforme configuração existente; registrar e resolver falhas aplicáveis, sem mocks de configuração ou commit de conclusão com falhas.

## Migration Plan

Sem migration de dados. No apply registrar branch/HEAD/status, aplicar mudanças locais de apresentação, executar regressões de UI, QA da matriz e os quatro comandos gerais. Atualizar tasks somente após comprovação. Criar um único commit de conclusão com implementação e tasks final, apenas arquivos/hunks da mudança, após revisar staged e `git diff --cached --check`; informar hash/arquivos. Sem commit vazio, tag, SemVer, push ou archive. Reverter o commit restaura a apresentação anterior sem alterar dados/sessões. Nesta etapa nenhum código ou commit é produzido.
