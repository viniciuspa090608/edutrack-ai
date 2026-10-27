# Spec Delta

## ADDED Requirements

### Requirement: Seleção do modo de acesso por URL
A tela `/acesso` SHALL abrir login com `mode=login` e cadastro com `mode=register`, incluindo acesso direto, recarga e navegação para outro modo na mesma rota. Ausência ou valor não reconhecido SHALL usar login. A pessoa SHALL continuar podendo alternar pelas abas existentes. O parâmetro mode SHALL controlar somente a apresentação inicial, sem alterar regras de autenticação, confirmação de e-mail, recuperação, entrada com Google ou validação de returnTo. Troca de modo SHALL preservar returnTo, submetido à allowlist existente, e não SHALL permitir destinos externos.

#### Scenario: Cadastro direto
- **WHEN** a pessoa abre ou recarrega `/acesso?mode=register&returnTo=/app/materias`
- **THEN** encontra cadastro selecionado e mantém o retorno interno permitido
- **AND** cadastro local pendente continua no fluxo de confirmação antes de acessar área privada.

#### Scenario: Modo padrão seguro
- **WHEN** a pessoa abre `/acesso` com mode ausente ou inválido
- **THEN** encontra login selecionado e pode escolher cadastro pelas abas.

#### Scenario: Troca na mesma rota
- **WHEN** a pessoa navega de um modo de `/acesso` para outro sem mudar pathname, inclusive por histórico do navegador
- **THEN** o modo visível acompanha a URL sem perder o parâmetro de retorno.

#### Scenario: Retorno externo rejeitado
- **WHEN** a pessoa abre login ou cadastro com returnTo externo ou malformado
- **THEN** o destino é reduzido ao padrão interno permitido, sem afrouxar a segurança por causa do mode
- **AND** o fluxo Google continua usando a mesma validação de retorno.
