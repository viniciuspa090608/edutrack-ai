## ADDED Requirements

### Requirement: Favicon da aplicação
A web SHALL usar o ícone fornecido como favicon comum a todas as rotas, com referência válida em acesso direto e recarga. Se o arquivo não estiver disponível, a entrega SHALL registrar a pendência sem substituí-lo por imagem não aprovada nem adicionar referência quebrada.

#### Scenario: Ícone disponível
- **WHEN** a pessoa abre ou recarrega landing, acesso ou rota privada
- **THEN** o navegador recebe o mesmo favicon fornecido por uma URL válida.

#### Scenario: Asset ausente
- **WHEN** o ícone fornecido não está disponível na implementação
- **THEN** a ausência fica registrada como pendência e nenhuma referência inexistente é adicionada.
