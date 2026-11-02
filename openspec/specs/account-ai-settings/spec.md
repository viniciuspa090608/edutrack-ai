# account-ai-settings Specification

## Purpose

Permitir configurar a IA da própria conta e administrar uma credencial pessoal sem expor segredos pessoais ou da plataforma.

## Requirements

### Requirement: Escolha privada de provedor e modelo
A pessoa autenticada SHALL configurar em `/conta` o modo padrão EduTrack ou o modo pessoal. Contas sem configuração SHALL usar o padrão Gemini, respeitando a preferência independente de habilitar IA. No modo pessoal SHALL escolher exclusivamente Gemini, Claude, ChatGPT (API OpenAI), DeepSeek ou Kimi e um modelo do catálogo compatível do respectivo provedor. A API SHALL recusar outros provedores, modelos incompatíveis, URLs de destino e identificadores de outra conta.

#### Scenario: Conta sem configuração
- **WHEN** uma pessoa sem configuração abre a seção IA da conta
- **THEN** vê Gemini como padrão EduTrack, sem qualquer campo preenchido com a chave do projeto.

#### Scenario: Escolha inválida
- **WHEN** a pessoa envia modelo de outro provedor, provedor não permitido ou URL personalizada
- **THEN** a alteração é recusada sem gravar configuração ou chamar destino externo.

#### Scenario: Isolamento
- **WHEN** uma pessoa tenta ler ou alterar configuração de outra conta
- **THEN** o acesso é recusado e nenhuma informação de credencial é revelada.

### Requirement: Ciclo de vida da chave pessoal
A pessoa SHALL poder colar, substituir e remover uma única credencial pessoal ativa, associada ao provedor escolhido. Salvar configuração pessoal SHALL exigir chave não vazia ou conservar a chave existente somente se o provedor permanecer igual. Trocar provedor SHALL exigir nova chave. Alterações SHALL ser atômicas; chave omitida mantém o valor atual e chave vazia SHALL ser rejeitada. Remover credencial ou restaurar padrão SHALL apagar a credencial pessoal e selecionar o padrão Gemini, com confirmação explícita na interface. Salvar SHALL validar formato e combinação sem declarar a chave autenticada no provedor ou realizar chamada paga implícita.

#### Scenario: Substituir a chave
- **WHEN** a pessoa salva uma nova chave para o provedor escolhido
- **THEN** a nova configuração substitui atomicamente a anterior e a resposta informa somente que há chave configurada.

#### Scenario: Trocar apenas modelo
- **GIVEN** uma chave pessoal salva
- **WHEN** a pessoa escolhe outro modelo compatível do mesmo provedor sem reenviar a chave
- **THEN** a chave existente é preservada.

#### Scenario: Trocar provedor sem chave
- **WHEN** a pessoa tenta trocar de provedor sem fornecer nova chave
- **THEN** a API recusa a alteração e mantém a configuração confirmada anteriormente.

#### Scenario: Remover a configuração pessoal
- **WHEN** a pessoa confirma remover sua chave ou restaurar o padrão
- **THEN** a chave pessoal é apagada, o modo padrão Gemini é selecionado e nenhuma chave do projeto é copiada para a conta.

### Requirement: Credenciais sem leitura posterior
Credenciais pessoais SHALL ser criptografadas em repouso e transmitidas por HTTPS em produção. Segredos pessoais e padrão SHALL NOT aparecer em respostas, mensagens de validação, URLs, logs, telemetria, prompts, saídas de IA, bundles, código versionado, cache público ou armazenamento persistente do navegador. A credencial padrão SHALL ficar exclusivamente no ambiente privado do servidor e SHALL NOT ser persistida na configuração de contas. Após salvar, consultas SHALL retornar somente modo, provedor, modelo e booleano de existência da credencial pessoal, sem valor completo, sufixo ou hash. Respostas de configuração SHALL impedir cache. Exclusão da conta SHALL remover a credencial pessoal.

#### Scenario: Consultar configuração
- **WHEN** a pessoa consulta configuração, perfil ou exportação de dados
- **THEN** nenhum segredo, fragmento ou ciphertext é retornado e a credencial padrão não é acessível por rota alguma.

#### Scenario: Erro externo com segredo refletido
- **WHEN** o provedor retorna erro contendo cabeçalho, chave ou corpo da requisição
- **THEN** a aplicação retorna erro sanitizado e não registra o conteúdo externo bruto.

### Requirement: Experiência acessível e transparente
A seção SHALL oferecer estados de carregamento, vazio, erro e sucesso, operar por teclado desde 320 px e respeitar movimento reduzido. O campo de chave SHALL ser mascarado e nunca pré-preenchido com segredo salvo; seu conteúdo transitório SHALL ser limpo após sucesso, saída ou logout. A interface SHALL explicar que o padrão é oferecido sem cobrança pela EduTrack sujeito a limites, enquanto chaves pessoais seguem cobrança e cotas do provedor, e indicar que conteúdo de estudo será enviado ao provedor selecionado. Falha de salvamento SHALL manter a configuração confirmada anterior e indicar possibilidade de nova tentativa.

#### Scenario: Falha ao salvar
- **WHEN** a operação de salvar falha
- **THEN** o erro é anunciado de forma acessível e a interface não apresenta a seleção como confirmada.

#### Scenario: Retornar à seção
- **WHEN** a pessoa retorna após salvar uma chave pessoal
- **THEN** vê seu provedor e modelo e a indicação de chave configurada, com campo de chave vazio.
