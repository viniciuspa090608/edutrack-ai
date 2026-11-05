# Proposal

## Why

As capturas e solicitações de revisão mostram informações repetidas, espaços excessivos e desalinhamentos na Conta e na Home. A navegação de relatórios e o resumo de Pomodoro também precisam representar melhor os fluxos já existentes.

## What Changes

- Simplificar o resumo do perfil e os cabeçalhos da Conta; reorganizar foto, integração Classroom, acesso Google, IA e fuso em composições compactas e responsivas.
- Corrigir o indicador dos RadioButtons de IA e reunir seus textos informativos em um parágrafo.
- Oferecer Sistema, Claro e Escuro nas configurações, usando Sistema por padrão e preservando escolhas manuais existentes.
- Unificar Estatísticas e Progresso no item Relatório, com Estatísticas como entrada padrão e ambas as abas acessíveis.
- Restringir textos informativos sobre o fuso às configurações, preservando cálculo de datas e controles funcionais de consulta/edição.
- Mover data/hora da consulta para o card de boas-vindas e ajustar seu texto.
- Exibir o cronômetro da sessão Pomodoro no card da Home, sincronizado com seu estado real.
- Expandir os cards vazios de Tarefas e Matérias na Home, com orientação e ações reais de cadastro.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `account-profile-visual-experience`: simplificação, alinhamento, foto responsiva, cards independentes e informações de fuso concentradas nas configurações.
- `application-theme`: seleção explícita de Sistema nas configurações pelo mecanismo local existente.
- `authenticated-shell-visual-experience`: entrada única Relatório em desktop/mobile e identificação ativa das duas rotas.
- `dashboard-presentation`: boas-vindas com data/hora, cronômetro vivo, cards vazios expandidos e remoção de identificação textual do fuso.
- `progress-and-achievements-visual-experience`: abas de Relatório e remoção do aviso de fuso em Progresso/Estatísticas.
- `study-routines`: retirar identificação informativa do fuso da listagem/programação, preservando configuração e interpretação dos horários.

## Impact

Afeta `apps/web`, seus estilos/testes e as seis especificações existentes. Reutiliza APIs, contratos, componentes de estado vazio e assets Google/Classroom; não prevê migrations, dependências novas ou alteração das regras de estudo. A remoção é de textos informativos de fuso; campos necessários para editar rotinas e consultar estatísticas continuam funcionais. O apply e seu commit/archive ficam para uma solicitação posterior.
