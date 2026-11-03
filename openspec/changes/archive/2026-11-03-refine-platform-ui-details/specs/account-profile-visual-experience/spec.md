## ADDED Requirements

### Requirement: Navegação acompanha a ordem e a seção visível
O menu de Configurações SHALL seguir a ordem real das seções correspondentes na página e destacar um único item conforme a seção atual durante a rolagem, com aparência equivalente ao hover e indicação acessível de localização atual. Clique e teclado SHALL continuar levando à seção sem perder rascunhos. A atualização durante rolagem SHALL NOT mover foco, simular eventos de ponteiro ou alterar formulários.

#### Scenario: Ordem e rolagem
- **WHEN** a pessoa percorre as seções em qualquer direção ou chega ao final da página
- **THEN** o menu mantém a ordem do conteúdo e destaca a seção atual, inclusive a última, sem roubar foco.

#### Scenario: Navegação por âncora
- **WHEN** a pessoa ativa um item de menu por teclado
- **THEN** alcança a seção correspondente com dados em edição preservados e destaque coerente com o destino.

### Requirement: Preferências de estudo lado a lado
As opções Tarefas, Matérias e Flashcards SHALL aparecer na mesma linha quando houver espaço suficiente, preservando checkboxes quadrados, seleção, bloqueios e regra de ao menos um módulo ativo. Em telas estreitas SHALL reorganizar sem corte ou rolagem horizontal.

#### Scenario: Preferências responsivas
- **WHEN** a pessoa altera preferências em desktop ou em 320 px
- **THEN** as opções ficam lado a lado em desktop e adaptadas em mobile, com persistência e validação existentes preservadas.

### Requirement: Modo e ações de IA com apresentação coerente
O modo de geração SHALL apresentar seleção única estilizada conforme a plataforma, com rótulos associados, foco visível e navegação por teclado. Salvar configuração de IA e Recarregar configuração de IA SHALL ficar na mesma linha com espaçamento quando houver largura suficiente, sendo Salvar maior e Recarregar ajustado ao conteúdo. Em telas estreitas SHALL permitir quebra mantendo textos e ações acessíveis.

#### Scenario: Seleção e ações de IA
- **WHEN** a pessoa alterna entre padrão EduTrack e chave pessoal e usa as ações disponíveis
- **THEN** somente um modo fica selecionado e os botões mantêm a hierarquia de tamanho e os estados reais de loading, disabled, erro e sucesso.

### Requirement: Integração Classroom em card único
Título, logo fiel do Google Classroom, descrição, estado de conexão e ações e conteúdo existentes da integração SHALL integrar um único card coerente com as demais configurações. O logo SHALL NOT substituir o nome acessível ou alterar o OAuth e fluxos existentes.

#### Scenario: Integração desconectada ou conectada
- **WHEN** a integração é exibida em qualquer estado disponível
- **THEN** seu conteúdo pertence ao mesmo card, com logo identificável e feedback e ações existentes alcançáveis em ambos os temas e desde 320 px.
