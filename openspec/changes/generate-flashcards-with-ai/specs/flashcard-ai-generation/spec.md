# Spec Delta

## Purpose

Permitir que uma pessoa gere cartões de pergunta e resposta para um baralho próprio, revise o resultado e escolha exatamente quais cartões serão salvos.

## ADDED Requirements

### Requirement: Geração disponível apenas com IA e flashcards habilitados

A opção **Aprimorar com IA** SHALL aparecer somente para a pessoa autenticada quando recursos de IA e o módulo de flashcards estiverem habilitados. A API SHALL conferir essas preferências e a propriedade do baralho antes de chamar o provedor e antes de salvar. Baralho inexistente ou alheio SHALL ser tratado como não encontrado sem expor dados de outra conta. Desativar IA SHALL impedir novas gerações e confirmações de prévias, mas SHALL preservar cartões já salvos e os fluxos manuais e de importação.

#### Scenario: IA desativada
- **GIVEN** flashcards habilitados e IA desativada
- **WHEN** a pessoa abre os baralhos ou tenta gerar por chamada direta
- **THEN** **Aprimorar com IA** não aparece e a API recusa a geração sem contatar o provedor
- **AND** criação manual e importação continuam disponíveis.

#### Scenario: Baralho de outra conta
- **WHEN** a pessoa tenta gerar ou confirmar cartões para um baralho alheio
- **THEN** a API responde como baralho não encontrado e não altera seus cartões.

### Requirement: Informar origem e destino da geração

A pessoa SHALL informar um conteúdo ou assunto textual não vazio e escolher um baralho próprio já existente antes da geração. A EduTrack SHALL validar e identificar claramente o baralho de destino e o texto fornecido na prévia. Texto vazio ou acima do limite SHALL ser recusado sem chamada ao provedor. A geração SHALL produzir cartões com frente e verso, sem criar baralho novo ou modificar cartões existentes.

#### Scenario: Assunto informado
- **WHEN** a pessoa escolhe seu baralho e informa um assunto válido
- **THEN** pode solicitar uma prévia de cartões para esse destino
- **AND** nenhum cartão é criado nessa etapa.

#### Scenario: Texto ausente
- **WHEN** a pessoa tenta gerar com campo de conteúdo ou assunto vazio
- **THEN** recebe erro associado ao campo e o provedor não é chamado.

### Requirement: Validar a saída da IA antes de exibi-la

A API SHALL tratar a resposta da IA como dado não confiável e validar estrutura, quantidade e limites de texto de todos os cartões antes de enviar a prévia à web. Cada cartão aprovado SHALL ter frente e verso não vazios conforme os limites do cartão manual. Resposta vazia, malformada ou com qualquer cartão inválido SHALL ser rejeitada integralmente com erro recuperável; nenhuma parte dela SHALL ser exibida como prévia válida ou salva. Falha, timeout ou indisponibilidade do provedor SHALL permitir nova tentativa sem efeitos no baralho.

#### Scenario: Resposta parcialmente inválida
- **WHEN** o provedor devolve dois cartões, mas um tem verso vazio ou excessivo
- **THEN** a geração é rejeitada, a interface mostra falha e oferece nova tentativa
- **AND** nenhum dos dois cartões é salvo ou apresentado como prévia válida.

### Requirement: Revisar e selecionar antes de salvar

A prévia SHALL mostrar a frente e o verso de todos os cartões gerados, permitindo editar qualquer lado e remover cartões individualmente. A pessoa SHALL poder confirmar os cartões restantes, sem alteração, ou cancelar. A confirmação SHALL salvar somente os cartões visíveis e revisados após validar novamente seus campos; não SHALL salvar cartões removidos nem modificar cartões preexistentes. Confirmar uma lista vazia ou com cartão inválido SHALL ser recusado sem gravação parcial. Geração, edição local, cancelamento ou saída da página SHALL NOT salvar conteúdo gerado.

#### Scenario: Salvar como gerado
- **GIVEN** uma prévia válida com dois cartões
- **WHEN** a pessoa confirma sem editar ou remover
- **THEN** exatamente os dois cartões aparecem no baralho escolhido após recarga.

#### Scenario: Editar e remover
- **GIVEN** uma prévia válida com três cartões
- **WHEN** a pessoa edita o verso do primeiro, remove o segundo e confirma
- **THEN** apenas o primeiro revisado e o terceiro são adicionados ao baralho, na ordem exibida.

#### Scenario: Cancelar ou sair
- **GIVEN** uma prévia válida
- **WHEN** a pessoa cancela ou sai sem confirmar
- **THEN** o baralho permanece sem cartões novos.

#### Scenario: Edição inválida
- **GIVEN** uma prévia cujo verso foi apagado
- **WHEN** a pessoa tenta confirmar
- **THEN** a interface indica o campo inválido e nenhum cartão da prévia é salvo.

### Requirement: Confirmação segura e recuperável

A confirmação SHALL ser atômica, restrita ao mesmo usuário e baralho da prévia e repetível sem duplicar cartões após perda de resposta ou envio simultâneo. O resultado SHALL informar os cartões efetivamente criados. Uma prévia vencida ou adulterada SHALL ser recusada sem gravação; a pessoa SHALL receber caminho para gerar outra prévia.

#### Scenario: Confirmação repetida
- **GIVEN** uma confirmação que salvou cartões, mas cuja resposta não chegou à web
- **WHEN** a mesma confirmação é enviada novamente
- **THEN** nenhum cartão adicional é criado e o resultado original é recuperado.

#### Scenario: Destino trocado
- **GIVEN** uma prévia para um baralho próprio
- **WHEN** alguém tenta confirmá-la em outro baralho
- **THEN** a API rejeita a confirmação sem criar cartões.

### Requirement: Fluxos independentes e interface acessível

Criação e consulta manuais e importação de cartões SHALL continuar funcionando com IA desativada ou provedor indisponível. A interface de geração SHALL distinguir carregamento, erro, prévia e sucesso, manter entradas e edições após falha recuperável, operar por teclado, ter rótulos e foco visível e ser legível desde 320 px. A resposta da IA SHALL ser apresentada como texto seguro, sem executar marcação ou instruções incluídas nela.

#### Scenario: Provedor indisponível
- **GIVEN** flashcards habilitados e provedor indisponível
- **WHEN** a pessoa usa criação manual ou importação
- **THEN** essas ações funcionam sem chamada ou dependência do provedor
- **AND** eventual erro de geração aparece apenas no fluxo de IA.
