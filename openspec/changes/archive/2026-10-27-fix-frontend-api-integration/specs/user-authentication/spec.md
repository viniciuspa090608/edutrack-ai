# Spec Delta

## ADDED Requirements

### Requirement: Retorno seguro para Flashcards
O fluxo de autenticação SHALL reconhecer `/app/flashcards` como destino interno permitido na web e no login Google da API. Ao solicitar login a partir dessa rota, a aplicação SHALL preservá-la e retornar a ela após autenticação bem-sucedida de conta confirmada. Destinos externos, malformados ou não permitidos SHALL continuar usando `/app` como retorno seguro. Permissões de módulo e validação de sessão SHALL continuar obrigatórias.

#### Scenario: Login local após acesso direto
- **WHEN** uma pessoa sem sessão abre `/app/flashcards` e conclui login local com conta confirmada
- **THEN** retorna a `/app/flashcards`
- **AND** a tela respeita a preferência atual de habilitação do módulo.

#### Scenario: Login Google após acesso direto
- **WHEN** uma pessoa inicia a entrada Google com retorno permitido para `/app/flashcards` e conclui o fluxo com sucesso
- **THEN** o destino é preservado durante a tentativa OAuth e no redirecionamento final.

#### Scenario: Destino não permitido
- **WHEN** a autenticação recebe destino externo, malformado ou caminho interno não permitido
- **THEN** o retorno é `/app`, sem redirecionamento para o destino rejeitado.

#### Scenario: Preservar destinos já permitidos
- **WHEN** a pessoa conclui autenticação com outro destino interno já permitido
- **THEN** o comportamento de retorno existente é preservado.
