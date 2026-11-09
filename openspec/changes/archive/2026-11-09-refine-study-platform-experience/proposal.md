# Proposal

## Why

Alguns controles e mensagens do EduTrack ocupam mais espaço que o conteúdo ou ficam desalinhados. Os ajustes também reduzem etapas para concluir tarefas e permitem escolher o nome de exibição no cadastro.

## What Changes

- Reorganizar os filtros e ações de Flashcards, criar seu estado vazio e centralizar o estado vazio de Matérias.
- Recolher painéis de filtros e padronizar a aplicação explícita em formulários com vários campos.
- Compactar o Perfil, alinhar as integrações Google e Classroom com 3 px entre título e descrição, mostrar o estado do Classroom em um badge e ocultar a legenda visual das opções de IA.
- Exibir os dias da programação semanal em cards de largura inteira.
- Permitir informar um nome de exibição opcional ao criar conta local.
- Refinar a rolagem de Tarefas no dashboard, remover seu aviso sobre tarefas sem prazo e mostrar Estatísticas por inteiro. Ajustar as alturas de Matérias e Progresso ao conteúdo e destacar os indicadores de Progresso em linhas com 5 px de intervalo.
- Expirar avisos transitórios e oferecer conclusão rápida de tarefas, incluindo subtarefas. Compactar a ação Ver detalhes quando não houver subtarefas.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `frontend-ui-controls` — barra de Flashcards, filtros e avisos transitórios.
- `manual-flashcards` — estado sem baralhos.
- `subjects-and-tasks-empty-states` — alinhamento no estado vazio de Matérias.
- `account-profile-visual-experience` — Perfil, Google, Classroom e IA.
- `study-routines` — cards semanais em largura inteira.
- `user-authentication` — nome de exibição no cadastro local.
- `dashboard-presentation` — alturas, rolagem e apresentação dos indicadores.
- `tasks-visual-experience` — conclusão rápida e detalhes compactos.

## Impact

Afeta a interface React, os estilos compartilhados e o cadastro local na API e em contracts. A conclusão rápida usa as operações existentes de tarefas. O nome usa o perfil existente e mantém a compatibilidade com clientes que enviam apenas e-mail e senha.
