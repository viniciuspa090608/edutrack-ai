# Spec Delta

## Purpose

Permitir que cada pessoa configure a visibilidade e o uso dos módulos de estudo e da IA de forma independente, preservando os dados e mantendo o servidor como autoridade de acesso.

## ADDED Requirements

### Requirement: Preferências individuais e independentes

A página `/conta` SHALL oferecer preferências separadas para tarefas, matérias, flashcards e recursos de IA. A EduTrack SHALL persistir cada preferência por conta; alterar uma SHALL NOT modificar as outras. Novas contas SHALL começar com os três módulos ativos e IA desativada. Uma funcionalidade ainda não entregue SHALL ser identificada como indisponível, sem aparentar que seu toggle a tornou utilizável. As preferências SHALL ser recuperadas após novo login e SHALL NOT afetar outras contas.

#### Scenario: Desativar somente tarefas

- **GIVEN** tarefas, matérias e flashcards ativos
- **WHEN** a pessoa desativa tarefas
- **THEN** matérias e flashcards mantêm seus estados
- **AND** a preferência de tarefas continua desativada após recarga e novo login.

#### Scenario: Conta nova

- **WHEN** uma conta é criada
- **THEN** tarefas, matérias e flashcards começam ativos e IA começa desativada
- **AND** nenhuma funcionalidade não entregue é apresentada como disponível.

### Requirement: Pelo menos um módulo de estudo ativo

A EduTrack SHALL exigir ao menos um módulo de estudo ativo entre tarefas, matérias e flashcards. IA SHALL NOT contar para essa regra. Toda atualização parcial SHALL ser validada contra os valores persistidos, de forma atômica, inclusive em solicitações concorrentes. Desativar o último módulo SHALL ser recusado sem alterar as preferências confirmadas e com mensagem clara na interface.

#### Scenario: Desativar o último módulo

- **GIVEN** apenas tarefas ativas, com matérias e flashcards desativados
- **WHEN** a pessoa tenta desativar tarefas, mesmo com IA ativa
- **THEN** a ação é recusada e as preferências anteriores são preservadas
- **AND** a interface orienta manter ao menos um módulo de estudo ativo.

#### Scenario: Desativação concorrente dos últimos módulos

- **GIVEN** tarefas e matérias ativas e flashcards desativados
- **WHEN** duas requisições simultâneas tentam desligar tarefas e matérias separadamente
- **THEN** no máximo uma delas é aceita
- **AND** pelo menos um módulo de estudo permanece ativo.

### Requirement: Módulo desativado não é navegável nem acionável

Quando tarefas, matérias ou flashcards estiver desativado, a EduTrack SHALL remover sua opção da navegação autenticada e seus widgets do dashboard; SHALL impedir abertura direta de páginas do módulo e recusar no servidor suas operações de leitura, criação, edição e exclusão para aquela conta. O perfil e os outros módulos ativos SHALL continuar acessíveis. Uma alteração de preferência SHALL valer também para sessões e abas já abertas na próxima requisição; a interface SHALL sair de uma página que acabou de ser desativada para um estado explicativo com caminho para reativação.

#### Scenario: Acesso direto após desativar matérias

- **GIVEN** matérias desativadas
- **WHEN** a pessoa abre diretamente uma URL de matérias ou envia uma ação à API
- **THEN** a página não mostra dados do módulo e oferece acesso às preferências
- **AND** a API recusa a ação sem ler ou alterar dados de matérias daquela conta.

#### Scenario: Navegação e dashboard

- **GIVEN** flashcards desativados
- **WHEN** a navegação e o dashboard são exibidos
- **THEN** opção de flashcards e seus widgets não aparecem
- **AND** opções e widgets dos módulos ativos permanecem.

### Requirement: Dados preservados e restaurados na reativação

Desativar um módulo SHALL NOT apagar, arquivar, desvincular ou modificar seus dados. Ao reativá-lo, sua navegação, páginas, operações e widgets disponíveis SHALL voltar a funcionar com os mesmos dados, sujeitos às regras normais de autorização da conta.

#### Scenario: Reativar tarefas

- **GIVEN** uma pessoa com tarefas criadas antes de desativar o módulo
- **WHEN** ela reativa tarefas
- **THEN** as tarefas anteriores voltam a aparecer e podem ser usadas
- **AND** nenhuma tarefa foi removida pela alternância.

### Requirement: IA opcional sem afetar uso manual

A preferência de IA SHALL ser separada dos três módulos. Quando desligada, controles como **Aprimorar com IA** SHALL ficar ocultos e toda requisição que invoque IA SHALL ser recusada antes de chamar o provedor ou alterar dados. Criação, edição e consulta manuais dos módulos ativos SHALL continuar funcionando. Quando IA estiver ligada, ações de IA SHALL continuar sujeitas à disponibilidade da funcionalidade e ao estado do módulo correspondente; ligar IA SHALL NOT ativar um módulo desativado.

#### Scenario: IA desligada, uso manual ativo

- **GIVEN** matérias ativas e IA desativada
- **WHEN** a pessoa abre matérias e cria conteúdo manualmente
- **THEN** o fluxo manual funciona e **Aprimorar com IA** não aparece
- **AND** uma chamada direta à API de IA é recusada sem contatar o provedor.

#### Scenario: IA ligada com módulo desligado

- **GIVEN** IA ativada e flashcards desativados
- **WHEN** a pessoa tenta usar uma ação de IA relacionada a flashcards
- **THEN** a ação é recusada pelo bloqueio de flashcards
- **AND** a preferência de IA e os demais módulos não são alterados.

### Requirement: Controles de preferências acessíveis

Os controles SHALL ter rótulos e estados programáticos claros, funcionar por teclado, anunciar erro ou sucesso e ser utilizáveis a partir de 320 px sem rolagem horizontal causada pelo layout. Durante salvamento, SHALL evitar mostrar sucesso antes da confirmação do servidor e oferecer nova tentativa após falha.

#### Scenario: Falha ao salvar preferência

- **GIVEN** a pessoa tenta desativar um módulo
- **WHEN** a API falha
- **THEN** a interface indica que a preferência não foi confirmada
- **AND** preserva ou recupera o último estado confirmado e permite tentar novamente.
