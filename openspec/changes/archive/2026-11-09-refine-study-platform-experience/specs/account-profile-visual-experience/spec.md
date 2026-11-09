# Spec Delta

## MODIFIED Requirements

### Requirement: Modo e ações de IA com apresentação coerente
A legenda Modo de geração SHALL ficar visualmente oculta e continuar nomeando o grupo de opções para tecnologias assistivas. O modo de geração SHALL apresentar seleção única estilizada conforme a plataforma, com rótulos associados, foco visível e navegação por teclado. Salvar configuração de IA e Recarregar configuração de IA SHALL ficar na mesma linha com espaçamento quando houver largura suficiente, sendo Salvar maior e Recarregar ajustado ao conteúdo. Em telas estreitas SHALL permitir quebra mantendo textos e ações acessíveis.

#### Scenario: Seleção e ações de IA
- **WHEN** a pessoa alterna entre padrão EduTrack e chave pessoal e usa as ações disponíveis
- **THEN** somente um modo fica selecionado e os botões mantêm a hierarquia de tamanho e os estados reais de loading, disabled, erro e sucesso.

### Requirement: Integração Classroom em card único
Título, logo fiel do Google Classroom, descrição, estado de conexão, ações e conteúdo existentes SHALL integrar uma seção do card Acesso à conta entre Google e Sessão atual, com divisórias. A ação principal SHALL ficar centralizada verticalmente à direita do bloco com logo, título e descrição quando houver espaço. O estado real da conexão SHALL aparecer em um badge textual junto ao título, incluindo Conectado, Desconectado e os demais estados suportados. O logo SHALL manter nome acessível associado à integração. O fluxo OAuth e os demais fluxos existentes SHALL ser preservados.

#### Scenario: Integração desconectada ou conectada
- **WHEN** a integração é exibida em qualquer estado disponível
- **THEN** logo, texto e estado pertencem ao card compartilhado, com a ação principal à direita quando houver espaço e com conteúdo, feedback e ações alcançáveis nos dois temas e desde 320 px.

### Requirement: Cabeçalhos e informações compactas da conta
A Conta SHALL omitir os subtítulos Seu perfil, suas preferências e seu acesso. Tudo em um só lugar.; Como você aparece no EduTrack.; Escolha o tema mais confortável para estudar.; e Proteja seu acesso e mantenha seus dados atualizados. Os títulos Seu perfil, Aparência e Segurança SHALL ficar centralizados verticalmente com seus ícones. A descrição Classroom SHALL ficar logo abaixo do título, alinhada ao texto do título, ao lado do logo. As descrições de Google e Google Classroom SHALL ter 3 px de distância vertical do título correspondente.

#### Scenario: Cabeçalhos simplificados
- **WHEN** a pessoa abre Conta em qualquer tema
- **THEN** os quatro subtítulos indicados não aparecem, os títulos com ícone ficam alinhados e a descrição Classroom permanece abaixo do título.

### Requirement: Card Seu perfil dividido por finalidade
O card Seu perfil SHALL organizar Foto de perfil, Informações pessoais e Segurança da conta com divisórias e espaçamento vertical interno compacto entre títulos, descrições e controles. O nome de exibição SHALL ter Salvar nome à direita na mesma linha quando houver espaço, com a ajuda abaixo do campo e quebra responsiva da ação em telas estreitas. Segurança da conta SHALL apresentar o e-mail atual e a ação de alteração disponível, preservando os fluxos reais de segurança e feedback.

#### Scenario: Editar nome e acessar alteração de e-mail
- **WHEN** a pessoa abre Seu perfil
- **THEN** encontra os três grupos em ordem, pode salvar o nome pelo formulário existente e acessar o fluxo real de troca de e-mail.
