## ADDED Requirements

### Requirement: Retorno explícito ao tema do sistema
Aparência SHALL oferecer Sistema, Claro e Escuro, distinguindo a preferência selecionada do tema efetivo. Sistema SHALL ser o padrão sem escolha manual válida e acompanhar mudanças do dispositivo durante a sessão. Selecionar Sistema SHALL remover a escolha manual local e sincronizar a mudança entre abas; Claro/Escuro salvos SHALL continuar válidos. O fallback sem suporte SHALL ser claro, com estado e foco preservados e armazenamento resiliente.

#### Scenario: Retornar ao sistema
- **WHEN** existe Escuro salvo e a pessoa seleciona Sistema com dispositivo claro
- **THEN** a interface fica clara e Sistema aparece selecionado, inclusive após recarga e nas outras abas.

#### Scenario: Dispositivo muda a aparência
- **WHEN** Sistema está selecionado e o dispositivo muda sua preferência
- **THEN** toda a aplicação acompanha sem recarga ou perda de formulários e operações.

#### Scenario: Preferência manual existente
- **WHEN** a pessoa abre a aplicação com Claro ou Escuro salvo
- **THEN** sua escolha continua aplicada e selecionada até uma nova escolha explícita.
