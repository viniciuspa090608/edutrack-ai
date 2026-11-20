# Proposal

## Why

O Assistente de IA desperdiça largura e exige rolagem da página, enquanto o histórico não identifica o assunto das conversas. No Classroom, turmas arquivadas aparecem na seleção e o resultado extenso dificulta compreender sucessos, disciplinas ignoradas e erros de importação.

## What Changes

- Usar toda a área disponível do shell no Assistente, com rolagens independentes para histórico e mensagens e compositor alcançável.
- Identificar conversas pela primeira mensagem do usuário, com data/hora em subtítulo cinza; distinguir respostas da IA com azul claro adaptado aos temas.
- Buscar apenas turmas ativas do Classroom; padronizar checkbox quadrado e oferecer “Selecionar todas as matérias”, abrangendo todas as páginas acessíveis.
- Apresentar resumo da importação com badges, detalhes em modal separados em Disciplinas e Tarefas, preservando também falhas no nível da turma.
- Recolher a seleção após o processamento e permitir reabri-la sem apagar associações nem registros importados.
- Orientar sobre destino de disciplina ausente e descrições acima de 2.000 caracteres, preservando conteúdo e permitindo corrigir pendências sem duplicar sucessos.
- Incorporar e revisar os ajustes de resultado já presentes no working tree, sem tratá-los como mudança concluída nem repetir implementação desnecessária.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `ai-study-assistant`: ocupação da tela, rolagens independentes, títulos reais e identificação visual das mensagens.
- `google-classroom-integration`: seleção somente de ativas, seleção em lote, resultados acessíveis em modal e orientação recuperável para pendências.

## Impact

Interface em `apps/web/src/features/assistant`, `apps/web/src/features/classroom`, estilos do shell/conta quando necessário e componentes compartilhados existentes. API Classroom e consulta de histórico do assistente, com contratos públicos ajustados apenas se necessário. Testes de interface e integração MySQL isolada. Sem novos provedores, alteração de callbacks OAuth, importação por IA, exclusão de conteúdo ou criação automática de disciplinas sem campos obrigatórios revisados.
