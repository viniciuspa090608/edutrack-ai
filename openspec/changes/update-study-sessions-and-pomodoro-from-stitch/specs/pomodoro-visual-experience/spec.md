# Spec Delta

## Purpose

Definir a apresentação consistente e acessível das sessões e histórico do Pomodoro, adaptada ao Stitch e fiel aos estados, dados e comportamentos reais do EduTrack.

## ADDED Requirements

### Requirement: Identidade visual completa do fluxo
A interface SHALL aplicar a mesma linguagem de cards, títulos, espaçamentos, botões, status, tempo e progresso à preparação, sessão ativa/pausada/entre blocos, histórico, totais, feedback e confirmação existentes. SHALL derivar esse padrão quando o Stitch não representar uma superfície, mantendo coerência com Tasks e Matérias. Revisão de flashcards SHALL permanecer fora desta mudança.

#### Scenario: Superfície sem equivalente no protótipo
- **WHEN** a pessoa abre uma confirmação, recebe erro ou consulta histórico
- **THEN** a superfície apresenta o mesmo padrão visual do timer e dos cards de preparação, sem perder controles ou informações existentes.

### Requirement: Timer e controles representam o estado real
O timer SHALL ser o elemento principal durante sessão ativa, seguido de estado, vínculo disponível, controles e informações secundárias. SHALL manter tempo restante, tempo ativo total e blocos concluídos segundo a lógica atual. Progresso visual SHALL representar somente o bloco de 1500 segundos, nunca uma meta inventada de ciclos. SHALL distinguir ausência de sessão, RUNNING, PAUSED, BETWEEN_BLOCKS, COMPLETED e CANCELED sem criar novos estados.

#### Scenario: Execução e pausa
- **WHEN** a sessão está em execução ou pausada
- **THEN** estado e tempo são legíveis, Pausar ou Continuar aparece conforme o estado real, e a pausa não faz avançar timer ou progresso.

#### Scenario: Espera entre blocos
- **WHEN** um bloco alcança seu limite
- **THEN** a interface mostra bloco concluído e espera pelo próximo comando existente
- **AND** não inicia intervalo cronometrado, novo bloco automático nem exibe ciclo de um total fixo.

#### Scenario: Conclusão e cancelamento
- **WHEN** a pessoa usa controles de encerramento
- **THEN** Concluir continua disponível somente com ao menos um bloco completo, Cancelar mantém sua confirmação, e feedback/histórico refletem o resultado confirmado sem nova tela ou rota.

### Requirement: Apresentação fiel a dados e integrações
A interface SHALL continuar consumindo APIs e contratos existentes, preservar identificadores, filtros, paginação, preferências e associações opcionais, e exibir somente informações disponíveis. SHALL manter separação entre tempo da sessão aberta e totais de sessões encerradas. SHALL NOT introduzir dados estáticos de produto, estatísticas fictícias, XP, metas, checklist, áudio, notas, ajustes de duração, reinício ou salto de ciclo sugeridos pelo Stitch.

#### Scenario: Seleção e preferências
- **WHEN** a pessoa escolhe matéria/tarefa ou desativa esses módulos
- **THEN** seleção e disponibilidade seguem os comportamentos existentes, iniciando sem vínculo quando permitido e enviando os mesmos payloads.

#### Scenario: Histórico e informação indisponível
- **WHEN** a API retorna histórico paginado, inclusive registros cancelados ou associações indisponíveis
- **THEN** a interface preserva ordem, filtro e paginação, apresenta datas, duração, blocos e status reais, mantém fallback do vínculo e não inventa nomes ou totais.

### Requirement: Temas com estados semânticos
Todas as superfícies SHALL funcionar em claro e escuro com tokens do sistema de tema, sem inversão de cores, mantendo legibilidade em background, card, timer, progresso, textos, bordas, ícones, selects, botões, alerts e confirmação. Hover, focus, selected, disabled e estados de sessão SHALL continuar reconhecíveis, com texto além da cor.

#### Scenario: Alternância de tema em sessão e confirmação
- **WHEN** o tema muda com sessão ativa, seleção ou confirmação aberta
- **THEN** todas as superfícies inclusive portais continuam legíveis, foco visível e estados distinguíveis, sem alterar a sessão ou disparar comandos.

### Requirement: Responsividade e acessibilidade
O fluxo SHALL funcionar desde 320 px, em tablet e desktop sem overflow horizontal causado pelo layout, com timer e controles essenciais prioritários em mobile, texto longo quebrável e confirmação utilizável. SHALL preservar teclado, labels, anúncio de feedback, recuperação de foco e movimento reduzido, sem anunciar a contagem a cada segundo. Texto normal SHALL atingir contraste de 4,5:1 e texto grande/indicadores essenciais 3:1.

#### Scenario: Layout estreito e teclado
- **WHEN** a pessoa usa 320 px, textos longos e navega por teclado
- **THEN** timer, seletores, ações, histórico e confirmação permanecem acessíveis, sem corte de conteúdo essencial nem perda de foco.

### Requirement: Resiliência visual preservada
Loading, erro, vazio, sucesso, sincronização e bloqueio de ações durante processamento ou recuperação SHALL receber o novo padrão sem alterar handlers, clock, versionamento ou prevenção de respostas obsoletas.

#### Scenario: Falha ou resposta incerta
- **WHEN** uma ação falha ou sua resposta se perde
- **THEN** a interface conserva a recuperação do estado persistido e bloqueia comandos quando necessário, apresentando erro e sincronização existentes sem assumir sucesso.

#### Scenario: Carregamento e vazio
- **WHEN** a página carrega ou retorna sem sessão/histórico
- **THEN** o layout mostra loading e vazios distintos, sem timer fictício em execução nem dados de exemplo.
