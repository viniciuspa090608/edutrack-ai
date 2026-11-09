# Spec Delta

## MODIFIED Requirements

### Requirement: Integração Classroom em card único
Título, logo fiel do Google Classroom, descrição, estado de conexão, ações e conteúdo existentes SHALL integrar uma seção do card Acesso à conta entre Google e Sessão atual, com divisórias. O logo SHALL manter nome acessível associado à integração. O fluxo OAuth e os demais fluxos existentes SHALL ser preservados.

#### Scenario: Integração desconectada ou conectada
- **WHEN** a integração é exibida em qualquer estado disponível
- **THEN** logo, texto e estado pertencem ao card compartilhado, com a ação principal à direita quando houver espaço e com conteúdo, feedback e ações alcançáveis nos dois temas e desde 320 px.

### Requirement: Foto com organização responsiva
O card Seu perfil SHALL conter uma seção Foto de perfil, sem repetir esse título nos controles internos. SHALL preservar o label associado ao input. Avatar e ações SHALL aparecer lado a lado, inclusive em 320 px, com quebra das ações dentro de sua coluna quando necessário. Os requisitos em texto secundário SHALL aparecer abaixo das ações. Preview, salvar, remover e feedback SHALL permanecer acessíveis.

#### Scenario: Foto no celular
- **WHEN** a pessoa abre a edição em 320 px
- **THEN** foto e controles ficam lado a lado, os requisitos aparecem abaixo das ações e não há título redundante, corte nem perda de ações.

### Requirement: Acesso Google alinhado e compacto
Acesso à conta SHALL usar o ícone Google existente à esquerda e centralizado verticalmente em relação ao bloco com título e descrição, com espaçamento consistente entre ícone e texto. O botão Vincular Google SHALL ficar à direita quando houver espaço. Em telas estreitas SHALL adaptar sem cortes, preservando vínculo confirmado, OAuth, sessão atual e logout.

#### Scenario: Google não vinculado
- **WHEN** o card de acesso aparece em desktop sem vínculo Google
- **THEN** o ícone está centralizado em relação ao título e descrição juntos e Vincular Google fica à direita.

## ADDED Requirements

### Requirement: Card Seu perfil dividido por finalidade
O card Seu perfil SHALL organizar Foto de perfil, Informações pessoais e Segurança da conta com divisórias. O nome de exibição SHALL ter Salvar nome à direita na mesma linha quando houver espaço, com a ajuda abaixo do campo e quebra responsiva da ação em telas estreitas. Segurança da conta SHALL apresentar o e-mail atual e a ação de alteração disponível, preservando os fluxos reais de segurança e feedback.

#### Scenario: Editar nome e acessar alteração de e-mail
- **WHEN** a pessoa abre Seu perfil
- **THEN** encontra os três grupos em ordem, pode salvar o nome pelo formulário existente e acessar o fluxo real de troca de e-mail.
