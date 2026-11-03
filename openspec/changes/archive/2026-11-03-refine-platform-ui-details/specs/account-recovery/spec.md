## ADDED Requirements

### Requirement: Transição visual para recuperação e links alinhados
A interface SHALL animar a passagem de login para Esqueci minha senha de forma coerente com as transições de acesso existentes, mantendo navegação e foco no destino. Com movimento reduzido SHALL omitir ou reduzir a animação sem retardar o acesso. Os links Esqueci minha senha e Voltar à landing SHALL aparecer na mesma linha com espaço entre si quando houver largura suficiente, permitindo quebra em 320 px sem sobreposição.

#### Scenario: Abrir recuperação
- **WHEN** a pessoa ativa Esqueci minha senha por mouse ou teclado
- **THEN** vê a transição até a recuperação, com o título de destino recebendo foco e o fluxo de recuperação existente disponível.

#### Scenario: Movimento reduzido e links
- **WHEN** a pessoa usa movimento reduzido ou acessa o login em tela estreita
- **THEN** navegação permanece imediata e operável, e ambos os links continuam legíveis, espaçados e alcançáveis sem overflow horizontal.
