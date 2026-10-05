# Spec Delta

## Purpose

Definir a apresentação responsiva e acessível do shell autenticado do EduTrack, reorganizando os controles e destinos existentes sem modificar seus fluxos funcionais.

## ADDED Requirements

### Requirement: Header autenticado simplificado

O shell SHALL apresentar logo/logotipo com destino `/app` à esquerda e controle de tema e avatar com destino `/conta` à direita, sem links principais de navegação ou novos controles de produto no header. SHALL manter altura consistente, identificação acessível, foco visível e uso desde 320 px.

#### Scenario: Header em qualquer área privada
- **WHEN** uma sessão válida abre um destino autenticado
- **THEN** o header oferece somente marca, alternância de tema e acesso à Conta pelo avatar, e a navegação principal aparece fora dele.

### Requirement: Sidebar desktop com destinos reais

A partir de 1024 px, o shell SHALL apresentar sidebar com ícone, rótulo, estado ativo, hover e foco para Início, módulos habilitados, Pomodoro, Rotinas, Estatísticas, Progresso e Conta. Sair SHALL ocupar região separada inferior. A navegação SHALL permitir scroll interno em pouca altura sem tornar Sair inalcançável.

#### Scenario: Desktop com pouca altura
- **WHEN** todos os módulos estão habilitados em viewport desktop de pouca altura
- **THEN** todos os destinos e Sair permanecem alcançáveis por scroll e teclado, sem overflow horizontal provocado pelo shell.

### Requirement: Barra inferior mobile e menu Mais

Abaixo de 1024 px, o shell SHALL substituir a sidebar por barra inferior com Início, Tarefas, Matérias, Flashcards e Mais, removendo e redistribuindo os itens de módulos desativados sem espaços vazios. Mais SHALL agrupar somente Pomodoro, Rotinas, Estatísticas, Progresso, Conta e Sair. SHALL ter abertura/fechamento acessíveis, Escape, gestão de foco e retorno ao acionador; SHALL fechar ou deixar de existir ao passar para desktop, sem overlay ou bloqueio de scroll residual.

#### Scenario: Módulos parcialmente habilitados
- **WHEN** somente Matérias está habilitado
- **THEN** a barra apresenta Início, Matérias e Mais distribuídos na largura disponível, e os demais destinos existentes continuam em Mais.

#### Scenario: Menu aberto e mudança de largura
- **WHEN** a pessoa abre Mais por teclado e muda a viewport para desktop
- **THEN** o menu mobile deixa de capturar foco e scroll, e a navegação desktop permanece operável.

### Requirement: Destino ativo e compatibilidade de navegação

O shell SHALL preservar destinos `/app`, `/app/tarefas`, `/app/materias`, `/app/flashcards`, `/app/pomodoro`, `/app/rotinas`, `/app/estatisticas`, `/app/progresso` e `/conta`, subfluxos e parâmetros existentes. SHALL marcar Início somente em `/app`, reconhecer segmentos descendentes dos módulos conforme roteamento existente e indicar Mais quando um de seus destinos estiver ativo. Links reais SHALL expor o destino corrente por identificação acessível; Mais SHALL comunicar que contém o destino ativo sem se apresentar como nova rota.

#### Scenario: Conta com parâmetros e âncora
- **WHEN** a pessoa abre `/conta?google=linked#account-security`, recarrega ou usa voltar/avançar
- **THEN** Conta aparece ativa no desktop e Mais indica o destino ativo no mobile, preservando os parâmetros, a navegação interna e o fluxo existente.

#### Scenario: Módulo desativado aberto diretamente
- **WHEN** a pessoa abre uma URL de módulo desativado
- **THEN** a opção continua ausente da navegação, o conteúdo privado do módulo não aparece e o estado existente oferece reativação na Conta.

### Requirement: Tema compartilhado sem perda de estado

O controle do header SHALL alternar claro/escuro com ícone e nome acessível que identifique a ação. SHALL usar a escolha local existente, compartilhar o tema com Aparência da Conta, preservar persistência, sincronização entre abas e preferência do sistema quando aplicável, sem reload, remontagem de páginas ou configuração adicional no backend.

#### Scenario: Alternância durante um subfluxo
- **WHEN** a pessoa alterna o tema com um formulário ou sessão de estudo em andamento
- **THEN** o shell e overlays acompanham o tema, a escolha permanece após navegação/recarga conforme o armazenamento existente e o estado da página não é perdido.

### Requirement: Avatar baseado em identidade confirmada

O avatar SHALL usar somente foto confirmada da própria conta, preservar proporção e recorte, acessar `/conta` e ter identificação acessível. Sem foto ou com erro de carregamento SHALL usar o fallback existente de inicial do nome confirmado; sem nome SHALL oferecer fallback visual neutro identificável. Alterações confirmadas de nome/foto e remoção SHALL atualizar o header; seleção e preview sem salvar SHALL NOT substituir sua identidade confirmada. Upload, remoção, validação, armazenamento e API SHALL permanecer inalterados.

#### Scenario: Preview e salvamento recusado
- **WHEN** a pessoa seleciona uma foto e não salva ou o salvamento falha
- **THEN** o header conserva a foto ou fallback anteriormente confirmado, independentemente do preview da Conta.

#### Scenario: Atualização confirmada e falha de imagem
- **WHEN** o servidor confirma nome, foto ou remoção e a imagem eventualmente não carrega
- **THEN** o header reflete apenas a identidade confirmada, usando a inicial atual ou fallback neutro quando necessário, e continua oferecendo acesso à Conta.

### Requirement: Logout único com estados preservados

Sair no shell SHALL reutilizar a mesma ação existente da Conta, preservar chamada real, bloqueio durante envio, sucesso seguido de `/acesso`, erro recuperável e nova tentativa. SHALL NOT simular saída antecipada, duplicar a implementação ou exigir nova confirmação. A mensagem de erro SHALL permanecer visível e acessível mesmo após fechar Mais.

#### Scenario: Requisição pendente e falha
- **WHEN** a pessoa aciona Sair e a resposta permanece pendente ou falha
- **THEN** os controles da mesma ação respeitam o bloqueio atual, a sessão permanece até confirmação e o erro permite tentar novamente.

#### Scenario: Saída confirmada
- **WHEN** a chamada real de logout termina com sucesso
- **THEN** ocorre o redirecionamento atual para `/acesso`.

### Requirement: Estados e páginas preservados

O shell SHALL respeitar os gates e estados atuais de verificação, sessão válida/ausente/expirada, preferências indisponíveis e módulo desativado. SHALL NOT renderizar conteúdo privado antes da validação, considerar falha como coleção vazia ou habilitar módulos por falta de preferências. SHALL preservar a lógica existente de carregamento e erro e não modificar páginas internas, landing ou autenticação pública.

#### Scenario: Preferências ainda indisponíveis
- **WHEN** a sessão é válida e as preferências não estão disponíveis, por carregamento ou falha
- **THEN** os módulos condicionais continuam omitidos e os destinos incondicionais e a Conta continuam acessíveis, mantendo os estados existentes sem simular sucesso ou vazio.

#### Scenario: Sessão em verificação ou negada
- **WHEN** a verificação está pendente ou a sessão é ausente/expirada
- **THEN** os estados, retry ou redirecionamento atuais são preservados sem exposição antecipada do shell e conteúdo privado.

### Requirement: Espaço responsivo e acessibilidade nos dois temas

O shell SHALL funcionar desde 320 px, em tablet, desktop e pouca altura, respeitar safe area e reservar espaço para a barra inferior sem encobrir conteúdo, botões, mensagens ou foco. Navegação escondida SHALL NOT receber foco. Controles SHALL ter áreas de toque de pelo menos 44 por 44 px, rótulos legíveis, contraste aplicável e foco visível nos dois temas. SHALL respeitar movimento reduzido inclusive em overlays e manter o layout interno dos módulos.

#### Scenario: Mobile estreito com safe area
- **WHEN** a pessoa percorre a página até a última ação em 320 px nos dois temas
- **THEN** a ação e seu foco ficam acima da barra e da safe area, os rótulos são legíveis e não ocorre sobreposição ou overflow horizontal causado pelo shell.

#### Scenario: Navegação por teclado e movimento reduzido
- **WHEN** a pessoa navega pelo shell e Mais com teclado e preferência por movimento reduzido
- **THEN** apenas os controles visíveis recebem foco, overlays mantêm contraste e as animações respeitam a preferência.

### Requirement: Referência visual subordinada ao produto existente

A apresentação SHALL adaptar hierarquia, espaçamento, superfícies, bordas e interação do Stitch às funcionalidades reais. SHALL NOT acrescentar busca global, notificações, planos, assinatura, integrações, rotas, módulos, dados fictícios ou ações sem implementação. Funcionalidades e estados reais, segurança, acessibilidade, rotas e padrões atuais SHALL prevalecer sobre a referência externa.

#### Scenario: Elemento sem equivalente real
- **WHEN** a referência contém busca, notificações ou plano Pro
- **THEN** esses controles são omitidos e a intenção visual é adaptada somente aos destinos e ações existentes.
