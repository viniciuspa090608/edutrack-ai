# Spec Delta

## MODIFIED Requirements

### Requirement: Cadastro com e-mail e senha
A EduTrack SHALL oferecer cadastro em `/acesso` com e-mail, senha e um campo opcional Nome de exibição. A API SHALL usar as regras de validação e normalização do nome de exibição do perfil e persistir o nome fornecido na criação da conta pendente. O nome SHALL admitir repetições. Campo vazio ou omitido SHALL manter o comportamento padrão existente. A API SHALL validar os dados, tratar o e-mail de forma canônica para unicidade, impedir duplicidade e armazenar somente uma representação resistente a ataques da senha, nunca a senha em claro. O cadastro bem-sucedido SHALL criar uma conta pendente, enviar código de confirmação e fornecer apenas um contexto restrito de confirmação. A conta local SHALL NOT acessar a área privada antes da confirmação do endereço.

#### Scenario: Criar conta local
- **GIVEN** um e-mail ainda não cadastrado e uma senha válida
- **WHEN** a pessoa conclui o cadastro
- **THEN** uma conta local pendente é criada e um código de confirmação é enviado
- **AND** a pessoa recebe apenas o fluxo de confirmação, sem acesso à área privada.

#### Scenario: Dados inválidos ou e-mail já usado
- **GIVEN** um e-mail inválido, senha fora da política ou e-mail já cadastrado
- **WHEN** a pessoa tenta concluir o cadastro
- **THEN** a API rejeita a operação sem criar outra conta
- **AND** a interface informa que o cadastro não pôde ser concluído sem expor senha ou detalhes internos.

#### Scenario: Escolher nome no cadastro
- **WHEN** a pessoa informa um nome de exibição válido e confirma o e-mail
- **THEN** o perfil apresenta o nome escolhido e o acesso continua baseado no e-mail ou na identidade Google vinculada.

#### Scenario: Nome ausente ou inválido
- **WHEN** a pessoa omite o nome ou informa um valor que viola as regras do perfil
- **THEN** a omissão mantém o nome padrão e o valor inválido é rejeitado com feedback de campo sem criar a conta.
