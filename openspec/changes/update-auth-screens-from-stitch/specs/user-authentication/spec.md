# Spec Delta

## ADDED Requirements

### Requirement: Apresentação visual consistente dos fluxos existentes
A interface SHALL aplicar uma linguagem visual coerente inspirada no Stitch a login, cadastro, confirmação de e-mail e todas as etapas de recuperação, usando hierarquia legível, espaçamento consistente, superfícies, inputs e ações distinguíveis. A apresentação SHALL respeitar o tema claro ou escuro escolhido, funcionar desde 320 px sem rolagem horizontal de layout e preservar rótulos, foco, teclado, anúncios de feedback e preferência por movimento reduzido.

#### Scenario: Desktop e mobile
- **WHEN** a pessoa abre qualquer tela ou etapa de autenticação em 320 px ou desktop
- **THEN** o formulário e suas ações permanecem legíveis e alcançáveis, sem corte vertical ou rolagem horizontal causada pelo layout
- **AND** o painel decorativo se adapta sem impedir o uso do formulário.

#### Scenario: Tema e teclado
- **WHEN** a pessoa navega entre as telas nos temas claro e escuro usando teclado
- **THEN** a escolha de tema permanece e campos, links e botões apresentam rótulos e foco visíveis
- **AND** feedback mantém anúncio acessível e animações respeitam movimento reduzido.

### Requirement: Referência visual subordinada ao fluxo real
O redesign SHALL manter os campos, regras, integrações, rotas e destinos permitidos existentes. SHALL NOT adicionar recursos sem integração atual, restrição institucional de e-mail, alegações de segurança ou benefícios inexistentes. Login e cadastro SHALL continuar com e-mail e senha e Google existente; confirmação SHALL continuar por código de seis dígitos; recuperação SHALL manter solicitação, código, nova senha e sucesso na rota existente. Senhas novas SHALL preservar a política de 12–128 caracteres.

#### Scenario: Cadastro e Google
- **WHEN** a pessoa abre cadastro
- **THEN** somente e-mail e senha são exigidos pelo cadastro local e Google continua disponível com o destino permitido
- **AND** campos acadêmicos, Microsoft, consentimentos novos e lembrar dispositivo não são apresentados.

#### Scenario: Recuperação adaptada
- **WHEN** a solicitação de recuperação é aceita
- **THEN** a interface mostra a mensagem genérica real e permite informar o código no fluxo atual
- **AND** não afirma que a conta existe nem orienta um link de redefinição inexistente.

#### Scenario: Navegação preservada
- **WHEN** a pessoa alterna login e cadastro, solicita recuperação ou conclui uma operação
- **THEN** a navegação usa as rotas existentes, preservando query e retorno permitido conforme o fluxo atual
- **AND** cadastro/login pendente vai à confirmação, confirmação bem-sucedida orienta login e somente autenticação ativa leva à área privada.

### Requirement: Feedback visual fiel aos resultados de autenticação
A apresentação SHALL preservar loading, validação de campos, bloqueios durante envio, mensagens reais da API, erros de rede e sucesso apenas após resultado confirmado. SHALL manter mensagens genéricas contra enumeração, erros OAuth, códigos inválidos/expirados, contexto de redefinição expirado e espera real de reenvio na confirmação, sem simular resultados para reproduzir o protótipo. Códigos, senhas e segredos SHALL NOT ser introduzidos em URLs ou armazenamento acessível por JavaScript pelo redesign.

#### Scenario: Erro e nova tentativa
- **WHEN** ocorre credencial inválida, conflito de cadastro, erro OAuth, falha de rede ou erro inesperado já tratado
- **THEN** a mensagem existente aparece de modo legível e acessível e permite o caminho atual de recuperação ou nova tentativa
- **AND** nenhuma sessão ou sucesso é simulado.

#### Scenario: Código e espera
- **WHEN** confirmação recebe código inválido/expirado ou reenvio limitado por 429
- **THEN** mostra o erro real e respeita o contador existente e Retry-After
- **AND** não anuncia confirmação nem libera ações antes das condições atuais.

#### Scenario: Submissão e resultado incerto
- **WHEN** uma submissão está pendente ou a redefinição falha por indisponibilidade sem confirmar resultado
- **THEN** os bloqueios e mensagens existentes são preservados
- **AND** o estado done só aparece após resposta bem-sucedida de redefinição.
