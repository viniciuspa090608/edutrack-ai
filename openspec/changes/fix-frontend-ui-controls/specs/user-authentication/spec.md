# Spec Delta

## ADDED Requirements

### Requirement: Visibilidade opcional de senhas digitadas
Campos existentes destinados explicitamente à senha da conta SHALL iniciar ocultos e oferecer controle de mostrar/ocultar com ícones de olho e olho riscado e nomes acessíveis `Mostrar senha` e `Ocultar senha`. A alternância SHALL preservar valor, validações, envio, autocomplete e atributos relacionados à senha, preservando foco e cursor sempre que suportado pelo navegador. Controles de campos desabilitados SHALL permanecer desabilitados e visualmente identificáveis.

#### Scenario: Mostrar e ocultar
- **WHEN** a pessoa digita uma senha oculta e ativa o controle de visibilidade duas vezes
- **THEN** o campo alterna de password para text e retorna a password, com ícone e nome acessível correspondentes
- **AND** o valor e as validações permanecem preservados, sem submeter o formulário, e foco e cursor são preservados quando suportado.

#### Scenario: Cobertura dos campos existentes
- **WHEN** a pessoa usa login, cadastro, redefinição de senha, alteração de senha ou confirmação de identidade por senha na Conta
- **THEN** cada campo existente de senha da conta apresenta o controle; confirmações de senha são contempladas apenas se existirem
- **AND** a mudança não acrescenta campos ou altera os fluxos de autenticação.

#### Scenario: Exclusão de campos comuns e códigos
- **WHEN** a pessoa visualiza códigos de confirmação de e-mail, recuperação ou troca de e-mail, OTPs, tokens, PINs que não sejam senhas, e-mail, texto, busca ou selects
- **THEN** nenhum desses campos recebe controle de olho nem é convertido para password.

#### Scenario: Senha desabilitada
- **WHEN** um campo de senha está desabilitado pelo fluxo existente
- **THEN** seu controle de visibilidade também está indisponível e a apresentação mantém o estado disabled perceptível.
