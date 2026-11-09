# Spec Delta

## ADDED Requirements

### Requirement: Transições ao mudar de etapa ou retornar à entrada
A recuperação de senha SHALL executar uma transição breve quando uma ação altera a etapa efetiva ou leva de volta à entrada. O efeito SHALL preservar foco e feedback e ser omitido com movimento reduzido. Erros que mantêm a etapa SHALL manter o formulário acessível e anunciar o feedback existente.

#### Scenario: Enviar código
- **WHEN** a solicitação produz a resposta genérica de avanço
- **THEN** o fluxo anima a chegada à etapa de código sem revelar a existência da conta.
- **AND** se houver falha e a etapa for mantida, o formulário apresenta o erro sem simular avanço.

#### Scenario: Voltar para entrada
- **WHEN** a pessoa aciona Voltar para entrada
- **THEN** chega à entrada com transição breve e foco utilizável, imediatamente se movimento reduzido estiver ativo.
