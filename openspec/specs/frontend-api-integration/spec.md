# frontend-api-integration Specification

## Purpose

Garantir que fluxos existentes de conta e IA mantenham destinos válidos, comunicação HTTP compatível com a API e orientações coerentes com os recursos entregues.

## Requirements

### Requirement: Atalho válido para preferências de IA
A interface SHALL direcionar o atalho de preferências apresentado no fluxo de IA de Flashcards para `/conta#account-preferences`, permitindo acessar a seção existente por teclado.

#### Scenario: Abrir preferências após impedimento de uso da IA
- **WHEN** o fluxo de IA apresenta o atalho de preferências e a pessoa o ativa
- **THEN** a página de conta existente é aberta com a seção de preferências identificada pelo fragmento
- **AND** a navegação não apresenta uma página inexistente.

### Requirement: Atualização de fuso compatível com a API
A interface SHALL enviar `PATCH /account/study-timezone` com corpo JSON e `Content-Type: application/json`. Um fuso IANA válido SHALL poder ser salvo e lido novamente pela conta autenticada. A interface SHALL informar sucesso somente após confirmação da API e preservar o tratamento de erro e as datas históricas já registradas.

#### Scenario: Salvar e recarregar
- **WHEN** a pessoa salva um fuso válido e recarrega suas configurações
- **THEN** o fuso persistido é exibido e a atualização é confirmada
- **AND** as atividades históricas conservam suas datas anteriores.

#### Scenario: Atualização rejeitada
- **WHEN** o fuso é inválido ou a API falha
- **THEN** a interface apresenta erro recuperável sem informar sucesso nem substituir a configuração confirmada por um valor não persistido.

### Requirement: Orientação coerente sobre IA
A seção de preferências SHALL apresentar IA como complemento opcional dos fluxos existentes de Flashcards e Matérias, sem classificá-la como funcionalidade ainda não entregue ou prometer disponibilidade operacional do provedor. Desativar IA SHALL preservar o acesso aos fluxos manuais dos módulos habilitados.

#### Scenario: Preferência de IA exibida
- **WHEN** a pessoa abre as preferências com IA habilitada ou desabilitada
- **THEN** recebe orientação coerente sobre o recurso opcional
- **AND** não recebe a mensagem de que a funcionalidade ainda não foi entregue.

#### Scenario: Uso manual com IA desabilitada
- **WHEN** a pessoa desabilita IA mantendo um módulo de estudo habilitado
- **THEN** os fluxos manuais desse módulo continuam disponíveis.
