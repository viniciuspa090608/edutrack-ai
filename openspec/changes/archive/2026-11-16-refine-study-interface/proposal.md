# Proposal

## Why

Os filtros precisam facilitar a localização de tarefas e disciplinas. A hierarquia dos detalhes, os controles e a impressão também precisam seguir as referências visuais aprovadas na conversa.

## What Changes

- Remover o parágrafo descritivo abaixo de “Recursos de IA” nas preferências.
- Adotar “Disciplina” e “Disciplinas” na interface e oferecer um painel recolhível para filtrar pelo nome, seguindo o padrão de Tarefas.
- Adicionar busca por título aos filtros combináveis de Tarefas.
- Colocar os detalhes da disciplina e os Roadmaps em seções no mesmo nível e posicionar “Voltar” à direita no cabeçalho dos cards de detalhes.
- Centralizar verticalmente a ação “Iniciar Pomodoro” no espaço disponível do card da Home.
- Aplicar a referência do relatório de estudos à impressão, usando os dados da aba selecionada.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `study-tasks` — busca por título combinável com os filtros atuais.
- `subjects-visual-experience` — nomenclatura, filtros de disciplinas e hierarquia dos detalhes.
- `frontend-ui-controls` — posicionamento de “Voltar” em cards de detalhes.
- `module-preferences` — apresentação do controle de IA.
- `dashboard-presentation` — alinhamento da ação de Pomodoro.
- `study-report-printing` — composição, dados e paginação dos relatórios.

## Impact

Interface React, estilos de impressão, listagens autenticadas, contratos de consulta se precisarem de ampliação e testes dos fluxos afetados.
