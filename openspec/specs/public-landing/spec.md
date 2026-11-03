# public-landing Specification
## Purpose

Apresentar a EduTrack a visitantes sem autenticação, permitindo conhecer os recursos planejados, navegar pela página e encontrar um caminho claro para o acesso futuro.

## Requirements
### Requirement: Página pública de apresentação
A aplicação SHALL exibir a landing da EduTrack em `/` sem exigir autenticação, sessão ou disponibilidade da API. SHALL apresentar o hero “Organize seus estudos. Encontre seu ritmo.” com dashboard demonstrativo, Como funciona com Organize/Estude/Revise, Funcionalidades com blocos alternados e prévias de roadmaps, Pomodoro, flashcards, estatísticas e sequências, IA opcional, personalização com temas e módulos configuráveis, convite final para cadastro e rodapé com destinos reais. SHALL manter a hierarquia, espaçamento e identidade azul das referências em um único layout responsivo claro/escuro; Tecnologias não SHALL ser uma seção obrigatória. Textos e metadados públicos SHALL descrever os recursos implementados, sem autenticação provisória, resultados garantidos, preço/limites não definidos ou funcionalidades inexistentes.

#### Scenario: Abertura pública
- **WHEN** uma pessoa abre `/` sem sessão com a API indisponível
- **THEN** título, seções, prévias, navegação e seletor de tema permanecem utilizáveis sem consultar dados privados ou a API.

#### Scenario: Conteúdo da plataforma
- **WHEN** a pessoa percorre a apresentação
- **THEN** encontra tarefas/subtarefas, matérias/roadmaps, rotinas, foco de 25 minutos, flashcards/importação/revisão espaçada, estatísticas, sequências/conquistas e IA opcional conforme capacidades implementadas
- **AND** não encontra promessas de memorização, IA sem erros, congelamento de sequência, relatórios exportáveis, pausas automáticas, notificações ou planos comerciais não implementados.

#### Scenario: Adaptação visual
- **WHEN** a pessoa usa a landing nos temas claro e escuro em desktop ou mobile
- **THEN** encontra a mesma ordem e conteúdo, com colunas e prévias adaptadas à largura, identidade azul e contraste legível.

### Requirement: Header fixo e navegação responsiva
O header SHALL permanecer visível durante a rolagem, sem encobrir títulos ou foco. Desktop SHALL exibir marca, navegação para Como funciona, Funcionalidades e IA opcional, seletor de tema, Entrar e Criar conta. Mobile SHALL manter marca, seletor de tema e botão de menu fora do menu; links de seção, Entrar e Criar conta SHALL estar no menu. Não SHALL apresentar identidade de conta autenticada nem navegação fictícia de módulos no header/rodapé público.

#### Scenario: Navegação no desktop
- **WHEN** a pessoa seleciona Como funciona no header desktop
- **THEN** a seção correspondente é alcançada com compensação do header fixo e título visível.

#### Scenario: Navegação no mobile
- **WHEN** a pessoa abre o menu mobile
- **THEN** encontra as seções, Entrar e Criar conta
- **AND** o seletor de tema continua disponível no header mesmo com o menu fechado.

### Requirement: Menu mobile operável por teclado
O menu mobile SHALL expor seu estado aberto ou fechado a tecnologias assistivas, permitir operação por teclado e fechar ao selecionar um link ou pressionar Escape. O foco SHALL retornar ao botão de menu quando fechado por Escape.

#### Scenario: Fechar com Escape
- **GIVEN** o foco está no menu mobile aberto
- **WHEN** a pessoa pressiona Escape
- **THEN** o menu fecha
- **AND** o foco retorna ao botão que abre o menu.

#### Scenario: Seleção de seção
- **GIVEN** o menu mobile aberto
- **WHEN** a pessoa seleciona **Funcionalidades**
- **THEN** a página rola até a seção correspondente
- **AND** o menu fecha.

### Requirement: Respeito a movimento reduzido
A landing SHALL oferecer rolagem suave para âncoras, entradas discretas na viewport, movimento sutil da composição do hero acompanhando o ponteiro e feedback de hover/foco. Com prefers-reduced-motion SHALL remover entradas decorativas, parallax e rolagem suave, inclusive quando a preferência mudar durante o uso. Em dispositivos sem hover/ponteiro preciso o hero SHALL permanecer estático. Conteúdo e navegação SHALL permanecer disponíveis sem animação, sem interceptar rolagem nem exigir hover.

#### Scenario: Preferência por movimento reduzido
- **WHEN** a pessoa abre a landing ou ativa movimento reduzido durante o uso
- **THEN** conteúdo permanece visível, hero fica estático e âncoras navegam sem movimento suave
- **AND** todos os controles continuam funcionais.

#### Scenario: Toque ou animação indisponível
- **WHEN** a pessoa usa dispositivo sem hover ou o recurso de entrada animada não está disponível
- **THEN** consegue ler todas as seções e acionar os mesmos destinos, sem depender de movimento ou hover.

### Requirement: Acessibilidade e largura mínima
A landing e a tela de acesso SHALL ser utilizáveis por teclado, com foco visível, estrutura semântica, rótulos e conteúdo essencial legível a partir de 320 px, sem rolagem horizontal causada pelo layout. SHALL manter contraste mínimo 4,5:1 para texto normal e 3:1 para texto grande e indicadores/contornos necessários de controles e foco nos dois temas, incluindo estados interativos. Prévias gráficas SHALL ter descrição acessível ou alternativa textual, sem controles falsos no percurso de foco.

#### Scenario: Tela de 320 px
- **WHEN** a pessoa percorre a landing em viewport de 320 px
- **THEN** header, menu, CTAs, textos e prévias cabem na largura sem rolagem horizontal.

#### Scenario: Navegação por teclado
- **WHEN** a pessoa usa Tab e ativa os controles pelo teclado em qualquer tema
- **THEN** cada ação real apresenta foco visível e pode ser concluída sem mouse
- **AND** ilustrações não simulam controles acionáveis.

### Requirement: Blocos e demonstrações do produto
A landing SHALL substituir o carrossel por blocos de funcionalidades sempre disponíveis durante a leitura, alternando texto/prévia no desktop e empilhando-os no mobile. Dashboard, roadmaps, foco, flashcards, métricas, sequência/conquista, IA e personalização SHALL usar dados estáticos coerentes e legenda visível de exemplo demonstrativo. Prévias não SHALL consultar API/sessão, iniciar timers de estudo, gerar IA ou salvar dados. Conteúdo manual SHALL permanecer apresentado como independente da IA; a IA SHALL ser descrita como opcional, revisável e sujeita à disponibilidade do serviço.

#### Scenario: Exemplos identificáveis
- **WHEN** a pessoa lê uma prévia do produto
- **THEN** vê que os dados são exemplos ilustrativos, sem acreditar que são dados de sua conta
- **AND** nenhum elemento ilustrativo inicia operação real.

#### Scenario: Leitura de funcionalidades
- **WHEN** a pessoa percorre a seção Funcionalidades no mobile
- **THEN** todos os blocos e suas prévias ficam acessíveis por rolagem normal, sem slides, autoplay ou controles de carrossel.

### Requirement: Destinos reais e acesso público
Entrar e Já tenho uma conta SHALL levar a `/acesso?mode=login`; Criar conta e convites de cadastro SHALL levar a `/acesso?mode=register`. O rodapé SHALL conter somente destinos existentes ou âncoras da própria página, sem links vazios, ajuda/contato/termos não fornecidos, cursos/certificados fictícios ou razão social inventada. A página de acesso SHALL manter um caminho para voltar à landing.

#### Scenario: Abrir login
- **WHEN** a pessoa seleciona Entrar no header, menu ou rodapé, ou Já tenho uma conta no convite final
- **THEN** abre o modo login em `/acesso`.

#### Scenario: Abrir cadastro
- **WHEN** a pessoa seleciona Criar conta em qualquer CTA da landing
- **THEN** abre diretamente o modo cadastro em `/acesso`.

#### Scenario: Navegação do rodapé
- **WHEN** a pessoa ativa qualquer link no rodapé
- **THEN** alcança seção identificável ou rota existente, sem destino fictício.

### Requirement: Entrada animada no acesso pela landing
Ao ativar Entrar ou Criar conta na landing, o conteúdo de destino SHALL entrar com `backInLeft` uma única vez, preservando o modo login/cadastro, parâmetros e destino seguro existentes. A animação SHALL NOT repetir em mudanças de campo, feedback ou renderização e SHALL evitar flashes, cortes e bloqueios de interação. Acesso direto, recarga e alternância entre login/cadastro não SHALL simular nova chegada pela landing. Movimento reduzido SHALL desativar ou reduzir a entrada.

#### Scenario: Ações públicas
- **WHEN** a pessoa ativa Entrar ou Criar conta na landing
- **THEN** o modo correspondente de acesso aparece com uma entrada backInLeft, sem animar novamente a cada alteração do formulário.

#### Scenario: Entrada direta e movimento reduzido
- **WHEN** acesso é aberto diretamente ou a pessoa usa movimento reduzido
- **THEN** o formulário correto permanece imediatamente operável sem depender da animação.
