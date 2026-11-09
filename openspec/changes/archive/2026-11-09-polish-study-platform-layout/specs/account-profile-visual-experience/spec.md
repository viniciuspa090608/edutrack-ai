# Spec Delta

## MODIFIED Requirements

### Requirement: Foto com organização responsiva
O card Seu perfil SHALL conter uma seção Foto de perfil com a descrição “Escolha como sua imagem aparece na plataforma.” e um avatar circular de aproximadamente 88–96 px. Avatar e ações SHALL aparecer lado a lado, inclusive em 320 px, com quebra das ações dentro de sua coluna quando necessário. O seletor de arquivo SHALL ser acessível pelo controle ciano Alterar foto. Remover SHALL ter estilo secundário com fundo transparente e borda discreta. O texto “JPG, PNG ou WebP · Máximo de 2 MB” SHALL aparecer abaixo das ações. A interface SHALL preservar prévia, salvamento explícito, remoção, validações e feedback existentes.

#### Scenario: Foto no celular
- **WHEN** a pessoa abre a edição em 320 px
- **THEN** foto e controles ficam lado a lado, a ajuda aparece abaixo das ações e todas as ações permanecem acessíveis, sem corte.

#### Scenario: Selecionar e confirmar foto
- **WHEN** a pessoa escolhe um arquivo válido por Alterar foto
- **THEN** vê a prévia e pode confirmar pelo controle Salvar foto existente.

### Requirement: Card Seu perfil dividido por finalidade
O card único Seu perfil SHALL ser centralizado em telas largas e apresentar o ícone de usuário em fundo azul arredondado, alinhado verticalmente ao título e à descrição “Gerencie suas informações pessoais e sua conta.”. Divisórias discretas SHALL separar cabeçalho, foto, nome e segurança. A seção de nome SHALL começar diretamente pelo rótulo “Nome de exibição”, sem “Informações pessoais” ou “Atualize seus dados de identificação”. O campo SHALL preencher o espaço disponível e Salvar nome SHALL usar o ciano da plataforma, à direita, com altura visual igual à do campo e quebra responsiva em telas estreitas. A ajuda “Seu nome pode se repetir. O identificador da conta permanece o mesmo.” SHALL aparecer abaixo da linha.

A seção Segurança da conta SHALL exibir “Gerencie seu endereço de e-mail de acesso e recuperação.” e o rótulo “Endereço de e-mail”. Uma linha com aparência de campo SHALL mostrar ícone de e-mail e endereço atual somente para leitura à esquerda, com Alterar em ciano e seta à direita. O endereço SHALL se adaptar à largura disponível sem rolagem horizontal. O card SHALL preservar os fluxos de salvamento do nome, alteração segura do e-mail e feedback.

#### Scenario: Editar nome e acessar alteração de e-mail
- **WHEN** a pessoa abre Seu perfil
- **THEN** encontra foto, nome e segurança em ordem no mesmo card, pode salvar o nome pelo formulário existente e acessar a troca segura pelo controle Alterar.

#### Scenario: Nome e endereço em largura estreita
- **WHEN** o campo e o botão não cabem na mesma linha ou o endereço é longo
- **THEN** o botão pode passar para outra linha e a ação Alterar continua visível, sem rolagem horizontal.
