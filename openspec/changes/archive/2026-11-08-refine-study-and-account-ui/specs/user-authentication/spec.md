# Spec Delta

## ADDED Requirements

### Requirement: Separação abaixo da ação Google
Login e cadastro SHALL acrescentar cerca de 3 px de espaço vertical entre Continuar com Google e o grupo de links de recuperação e retorno à landing.

#### Scenario: Links em tela estreita
- **WHEN** a largura exige quebra dos links
- **THEN** a separação abaixo do botão continua visível e os links permanecem legíveis e operáveis.

### Requirement: Transição ao retornar à landing
Ao ativar Voltar à landing em login ou cadastro, a interface SHALL executar uma transição breve uma única vez por navegação efetiva e permitir acesso imediato com movimento reduzido. A ausência ou interrupção do efeito SHALL preservar navegação e foco no destino.

#### Scenario: Retorno por teclado
- **WHEN** a pessoa ativa Voltar à landing por teclado
- **THEN** chega à landing com foco utilizável, com efeito breve quando permitido pela preferência de movimento.
