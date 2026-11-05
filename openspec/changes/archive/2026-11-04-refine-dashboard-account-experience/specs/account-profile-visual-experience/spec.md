## MODIFIED Requirements

### Requirement: Perfil e foto com apresentação coerente

A área SHALL destacar avatar/fallback, nome, e-mail, verificação reais. O resumo lateral SHALL terminar no estado de verificação do e-mail, sem meios de entrada ou atalho Editar perfil e foto; edição e acesso SHALL continuar nas seções correspondentes. Edição de nome e seleção/preview/salvamento/remoção de foto SHALL preservar ações, limites e transporte atuais, com feedback do servidor. A foto SHALL continuar JPEG, PNG ou WebP estático de até 2 MiB, 64–4096 pixels por lado e até 16 milhões de pixels; o design SHALL NOT adotar os 5 MB do Stitch.

#### Scenario: Preview e upload
- **WHEN** a pessoa seleciona uma foto válida e depois salva
- **THEN** a interface distingue preview de foto confirmada e só informa salvamento após a API confirmar.

#### Scenario: Falha ou arquivo inválido
- **WHEN** o nome ou foto é inválido, ou a API rejeita a atualização
- **THEN** a interface anuncia a falha, mantém os dados confirmados e permite corrigir ou tentar novamente sem indicar sucesso.

#### Scenario: Remover foto
- **WHEN** a API confirma remoção da foto
- **THEN** a mesma área exibe o fallback e confirma a remoção com a identidade visual atualizada.

### Requirement: Preferências e aparência sem novos contratos

Os controles de tarefas, matérias, flashcards e IA SHALL refletir os booleanos persistidos e manter ao menos um módulo de estudo ativo. O fuso SHALL preservar valor IANA, sugestão explícita, persistência atual e aplicação somente a novas atividades. A área SHALL disponibilizar Sistema, Claro e Escuro pelo mecanismo local de tema, sem persistência de conta; Sistema SHALL ser padrão sem escolha manual válida, preservando escolhas manuais existentes.

#### Scenario: Último módulo ativo
- **WHEN** a pessoa tenta desativar o último módulo de estudo, inclusive com IA ativa
- **THEN** a interface mantém a regra atual e comunica a recusa sem confirmar uma preferência inexistente.

#### Scenario: Salvar fuso
- **WHEN** a pessoa escolhe usar a sugestão do navegador e salva o fuso
- **THEN** a sugestão só persiste após ação explícita e confirmação da API, sem alterar datas antigas.

#### Scenario: Mudar aparência
- **WHEN** a pessoa alterna claro/escuro
- **THEN** todas as interfaces da conta atualizam pelo mecanismo existente e a escolha segue a persistência atual do tema.

## ADDED Requirements

### Requirement: Cabeçalhos e informações compactas da conta
A Conta SHALL omitir os subtítulos Seu perfil, suas preferências e seu acesso. Tudo em um só lugar.; Como você aparece no EduTrack.; Escolha o tema mais confortável para estudar.; e Proteja seu acesso e mantenha seus dados atualizados. Os títulos Seu perfil, Aparência e Segurança SHALL ficar centralizados verticalmente com seus ícones. A descrição Classroom SHALL ficar logo abaixo do título, alinhada ao texto do título, ao lado do logo.

#### Scenario: Cabeçalhos simplificados
- **WHEN** a pessoa abre Conta em qualquer tema
- **THEN** os quatro subtítulos indicados não aparecem, os títulos com ícone ficam alinhados e a descrição Classroom permanece abaixo do título.

### Requirement: Foto com organização responsiva
A edição de foto SHALL remover apenas o primeiro título redundante Foto de perfil, preservar o label associado ao input e mostrar os requisitos cinza abaixo da foto. Em celular o input SHALL ficar ao lado do círculo da foto, inclusive em 320 px, sem overflow horizontal; textos longos SHALL quebrar dentro do espaço disponível. Preview, salvar, remover e feedback SHALL permanecer acessíveis.

#### Scenario: Foto no celular
- **WHEN** a pessoa abre a edição em 320 px
- **THEN** foto e input ficam lado a lado, os requisitos aparecem abaixo da foto e não há título redundante nem perda das ações.

### Requirement: Acesso Google alinhado e compacto
Acesso à conta SHALL usar o ícone Google existente junto à identificação do vínculo e reduzir espaços verticais. O bloco Google com sua descrição e o botão Vincular Google SHALL ocupar a mesma linha, texto à esquerda e ação à direita com distribuição space-between quando houver espaço. Em telas estreitas SHALL adaptar sem cortes, preservando vínculo confirmado, OAuth, sessão atual e logout.

#### Scenario: Google não vinculado
- **WHEN** o card de acesso aparece em desktop sem vínculo Google
- **THEN** ícone e identificação estão alinhados e Vincular Google fica à direita do bloco textual, sem grandes espaços vazios.

### Requirement: IA com explicação única e seleção centralizada
Os textos cinza do card Inteligência artificial SHALL formar um único parágrafo compacto, preservando orientação, configuração confirmada, existência de chave e limites reais de uso, inclusive referência UTC necessária para explicar a cota. RadioButtons de padrão EduTrack e chave pessoal SHALL ter círculos proporcionais e indicador centralizado, com seleção única, labels, teclado e foco preservados nos dois temas.

#### Scenario: Seleção de modo de IA
- **WHEN** a pessoa alterna o modo por teclado ou ponteiro
- **THEN** o indicador fica centralizado somente na opção selecionada e a explicação permanece em um único parágrafo sem perder os limites reais.

### Requirement: Fuso independente e avisos concentrados nas configurações
Fuso de estudo SHALL ser um card independente de Preferências de estudo, com título centralizado verticalmente no ícone e espaços compactos entre descrição, fuso salvo, input, ajuda e ações. Textos meramente informativos que identificam o fuso em uso SHALL aparecer somente nas configurações, sendo removidos dos demais resumos, listagens, gráficos e detalhes da aplicação. Campos funcionais de fuso em consultas e edição de rotinas, validações necessárias e explicações de limites de IA SHALL ser preservados. A mudança SHALL NOT alterar cálculos, fusos persistidos ou datas antigas.

#### Scenario: Configuração e uso fora da conta
- **WHEN** a pessoa abre configurações e depois Home, Relatório, Rotinas ou detalhes Classroom
- **THEN** encontra o card independente nas configurações e não vê avisos repetidos de fuso nas demais áreas, mantendo controles funcionais e datas corretas.
