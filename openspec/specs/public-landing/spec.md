# public-landing Specification
## Purpose

Apresentar a EduTrack a visitantes sem autenticação, permitindo conhecer os recursos planejados, navegar pela página e encontrar um caminho claro para o acesso futuro.

## Requirements
### Requirement: Página pública de apresentação
A aplicação SHALL exibir a landing da EduTrack em `/` sem exigir autenticação ou disponibilidade da API. A página SHALL conter uma chamada principal, apresentação dos recursos de estudo, seção **Funcionalidades**, seção **Tecnologias** e convite final para cadastro. O texto SHALL distinguir recursos planejados dos que já estão disponíveis.

#### Scenario: Abertura pública
- **GIVEN** uma pessoa sem conta
- **WHEN** ela abre `/` com a API indisponível
- **THEN** a landing é exibida com título principal e seções identificáveis
- **AND** seu conteúdo e navegação continuam utilizáveis.

#### Scenario: Conteúdo da plataforma
- **GIVEN** a landing carregada
- **WHEN** a pessoa percorre a apresentação
- **THEN** encontra descrições concisas de tarefas, matérias e roadmaps, Pomodoro, rotinas, flashcards, estatísticas e IA opcional
- **AND** não é induzida a acreditar que essas funcionalidades já estão operacionais.

### Requirement: Header fixo e navegação responsiva
O header SHALL permanecer visível no topo durante a rolagem, sem impedir a leitura do conteúdo. Em viewport desktop, SHALL exibir a marca, links para **Funcionalidades** e **Tecnologias** e a ação **Login / Inscreva-se**. Em viewport mobile, SHALL exibir fora do menu apenas a ação **Login / Inscreva-se** e o botão com ícone de menu; os links das seções SHALL ficar dentro do menu hambúrguer.

#### Scenario: Navegação no desktop
- **GIVEN** a landing aberta em viewport desktop
- **WHEN** a pessoa seleciona **Tecnologias** no header
- **THEN** a página rola até essa seção
- **AND** o título da seção não fica encoberto pelo header fixo.

#### Scenario: Navegação no mobile
- **GIVEN** a landing aberta em viewport mobile e o menu fechado
- **WHEN** a pessoa abre o menu hambúrguer
- **THEN** os links de **Funcionalidades** e **Tecnologias** ficam visíveis no menu
- **AND** a ação **Login / Inscreva-se** permanece visível fora dele.

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

### Requirement: Carrossel de funcionalidades
A landing SHALL apresentar um carrossel com avanço automático, no mínimo três slides e exatamente um slide ativo por vez. Cada slide SHALL conter uma imagem com alternativa textual apropriada e uma descrição breve de uma funcionalidade da EduTrack. A pessoa SHALL conseguir avançar, voltar e selecionar um slide por controles identificáveis.

#### Scenario: Avanço automático
- **GIVEN** a landing visível e sem interação com o carrossel
- **WHEN** decorre o intervalo de avanço
- **THEN** o próximo slide se torna ativo
- **AND** o carrossel volta ao primeiro após o último.

#### Scenario: Controle manual
- **GIVEN** um slide ativo
- **WHEN** a pessoa usa o controle de próximo slide ou um indicador específico
- **THEN** o slide solicitado aparece com imagem e texto correspondentes
- **AND** o indicador ativo acompanha o slide exibido.

#### Scenario: Pausa durante interação
- **GIVEN** o carrossel em avanço automático
- **WHEN** o ponteiro está sobre ele, um controle recebe foco ou a página fica oculta
- **THEN** o avanço automático é pausado
- **AND** a leitura ou a interação atual não é interrompida.

### Requirement: Respeito a movimento reduzido
Quando a pessoa prefere movimento reduzido, o carrossel SHALL permanecer navegável manualmente sem avanço automático e as transições decorativas SHALL ser removidas ou minimizadas.

#### Scenario: Preferência por movimento reduzido
- **GIVEN** a preferência do sistema por movimento reduzido está ativa
- **WHEN** a pessoa abre a landing e aguarda o intervalo de avanço
- **THEN** o slide ativo permanece o mesmo
- **AND** os controles manuais continuam operáveis.

### Requirement: Destino provisório de acesso
Todas as ações **Login / Inscreva-se** e os convites para cadastro SHALL levar a uma página pública provisória em `/acesso`, com aviso **Em breve** e caminho para voltar à landing. Essa página SHALL indicar que login e cadastro ainda não estão disponíveis, sem simular autenticação.

#### Scenario: Abrir acesso provisório
- **GIVEN** a pessoa está na landing
- **WHEN** seleciona **Login / Inscreva-se**
- **THEN** acessa `/acesso` e lê o aviso **Em breve**
- **AND** encontra uma ação para voltar à landing.

### Requirement: Acessibilidade e largura mínima
A landing e a página provisória de acesso SHALL ser utilizáveis por teclado, apresentar foco visível, usar estrutura semântica e manter conteúdo essencial legível a partir de 320 px sem rolagem horizontal causada pelo layout.

#### Scenario: Tela de 320 px
- **GIVEN** uma viewport de 320 px
- **WHEN** a pessoa percorre a landing
- **THEN** conteúdo, imagens, controles do carrossel, header e menu cabem na largura
- **AND** não há rolagem horizontal causada pelo layout.

#### Scenario: Navegação por teclado
- **GIVEN** a landing carregada
- **WHEN** a pessoa percorre os controles por Tab e os ativa pelo teclado
- **THEN** cada controle interativo mostra foco visível
- **AND** sua função pode ser concluída sem mouse.
