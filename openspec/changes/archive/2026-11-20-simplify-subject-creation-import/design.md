# Design

## Context

Ver proposal.md para motivação e escopo. O contrato createSubjectSchema exige todos os campos e também é base do schema de resposta e atualização. SubjectsPage inicia nível BEGINNER, objetivo/prazo vazios e 1 hora semanal; ClassroomSection inicia destino none e exige confirmar um rascunho completo. Seu Select já lista disciplinas recebidas, mas é necessário garantir cobertura da paginação. Os repositórios persistem objetivo e horas em ambas as rotas de criação. O assistente já possui layout com rolagem independente e regras de teclado. O estado vazio de Disciplinas já tem requisito de preencher área útil, mas a imagem mostra espaço residual abaixo do card.

## Goals / Non-Goals

**Goals:** compartilhar normalização de criação, preservar contratos completos de leitura, evitar sobrescrita nas reimportações e ajustar os layouts com tokens existentes.

**Non-Goals:** mudar OAuth, gerar conteúdo com IA durante importação, alterar prazo das atividades importadas, adicionar funcionalidades ao chat ou modificar dados antigos em lote.

## Decisions

1. Separar entrada de criação dos campos persistidos/resposta e da atualização parcial. Normalizar objetivo omitido/em branco a partir do nome final, horas omitidas para 1 e assuntos omitidos para []. Manter limites explícitos quando informados e não aplicar defaults de criação em PATCH. A normalização deve atender tanto o serviço público de disciplinas quanto a criação transacional usada por Classroom. O schema enviado ao provedor de IA permanece sem transformações, representável em JSON Schema; normalizar a ação validada antes de persistir a prévia garante o mesmo objetivo padrão na confirmação. Manter resposta com objetivo e horas completos evita uma migração para nullable e adaptações desnecessárias dos roadmaps. Alternativa descartada: inventar horas diferentes ou exigir horas na importação. O valor 1 é uma premissa de compatibilidade baseada no formulário manual atual, editável pelo aluno.

2. Compartilhar sugestões de rascunho entre criação manual e importação. Somar seis meses de calendário à data local, ajustando fim de mês; congelar a sugestão no rascunho e persistir a data revisada, sem recalcular no retry. Objetivo automático acompanha o nome até edição explícita. Não reaplicar sugestões ao editar registros existentes. Alternativa descartada: usar 180 dias, que não equivale a seis meses.

3. Inicializar apenas turmas sem associação/destino com nova disciplina, inclusive seleção em lote. Preservar destinos existentes, confirmação de troca e opção de somente tarefas. Manter revisão/confirmar dados antes da importação explícita. Usar controles Select compartilhados para modo de destino e escolha da disciplina existente; carregar opções próprias de todas as páginas ou oferecer paginação acessível, distinguindo loading, erro e vazio. A API continua validando propriedade. Não associar por semelhança do nome.

4. Aplicar grid responsivo no formulário de revisão: nome completo, objetivo/nível, prazo/horas, assuntos completos. Usar grupo flex para as duas ações de resultado, com quebra quando necessário. Rótulos curtos devem continuar contextualizados por fieldset/legend da turma.

5. Condicionar toda a área de importação à conexão válida e limpar estados transitórios na desconexão confirmada. Fechar modal, invalidar consultas e impedir respostas tardias de restaurar estado. Não excluir histórico no banco; após reconectar consultar somente o estado autorizado da identidade atual. Alternativa descartada: apenas esconder o resumo por CSS, mantendo ações e diálogos ativos.

6. No assistente, limitar a coluna de leitura a cerca de 48rem, cards com largura ajustada ao conteúdo e padding de 12–16px, usuário à direita e IA à esquerda, mantendo autoria textual e superfície azul da IA. Integrar envio de 44px com ícone e aria-label ao compositor e reservar espaço para não sobrepor texto. Preservar todos os handlers existentes, prévias, anúncios e rolagem independente. Ajustes finos de tokens podem ocorrer na verificação visual.

7. Usar flex/grid na cadeia de altura disponível das páginas e área vazia, considerando shell, cabeçalhos, filtros e margem inferior. Evitar alturas fixas e cálculos que ignoram filtros expandidos; min-height e crescimento devem permitir conteúdo maior em zoom e telas baixas. Limitar a alteração aos estados realmente vazios das duas páginas.

## Risks / Trade-offs

- Defaults em schemas compartilhados podem alterar PATCH ou tornar leitura opcional → separar schemas e verificar consumidores e inferência de entrada/saída.
- Criar destino automaticamente pode duplicar disciplinas → aplicar somente a turmas novas, preservar vínculos e idempotência da operação.
- Falhas e concorrência na desconexão podem reexibir dados → invalidar consultas e ignorar respostas da conexão anterior, com teste de resposta tardia.
- Altura e largura variam com zoom, temas e navegação → verificar 320px, desktop, filtros expandidos e viewport baixa.
- O novo objetivo pode ultrapassar o limite de 500 dos parâmetros de roadmap quando personalizado → preservar validação própria do roadmap, sem truncar silenciosamente.

## Migration Plan

Não se prevê migration de banco: os defaults produzem os campos completos já persistidos. Implementar contratos/normalização primeiro e depois formulários e layout. Validar MySQL real isolado nas rotas de criação/importação. Ao concluir o apply, executar os quatro checks do projeto, preparar snapshots semânticos e manifesto explícito conforme README e usar openspec:finish para commit único com sync/archive. Reversão preserva registros completos e restaura os formulários anteriores; não publicar nem alterar master neste planejamento.
