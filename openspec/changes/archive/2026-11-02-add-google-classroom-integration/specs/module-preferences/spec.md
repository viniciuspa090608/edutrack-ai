## ADDED Requirements

### Requirement: Onboarding de módulos e integração opcional
Novas contas locais e Google SHALL receber onboarding autenticado com seleção de módulos antes da etapa “Conectar Google Classroom” ou “Agora não”. A seleção SHALL respeitar ao menos um módulo de estudo, IA independente e padrões já definidos; SHALL ser persistida antes da integração. Cancelar OAuth, pular integração ou falhar importação SHALL permitir concluir onboarding e usar módulos manuais. Contas existentes SHALL manter preferências e não ser forçadas a refazer onboarding; poderão conectar no perfil. Interrupção SHALL permitir retomar a etapa confirmada sem recriar conta.

#### Scenario: Nova conta local pula Classroom
- **WHEN** uma pessoa salva módulos válidos e escolhe “Agora não”
- **THEN** conclui onboarding com preferências confirmadas e integração desconectada.

#### Scenario: Nova conta Google com falha externa
- **WHEN** uma nova conta criada via Google recusa Classroom ou recebe falha de importação
- **THEN** continua o cadastro e acessa os módulos escolhidos sem autorizar Classroom automaticamente.
