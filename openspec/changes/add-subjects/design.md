# Design

## Context

Veja [proposal.md](proposal.md) e [specs/study-subjects/spec.md](specs/study-subjects/spec.md). A API atual só possui `/health`; autenticação, tarefas, Pomodoro e preferências ainda são proposals. Tarefas e Pomodoro excluem explicitamente associação com matéria nas respectivas etapas iniciais, portanto esta mudança acrescentará o vínculo depois desses applies. A arquitetura separa controllers, services e repositories e proíbe um módulo de acessar repositories internos de outro.

## Goals / Non-Goals

**Goals:** plano manual persistente e ordenado por matéria; autorização em todas as operações; vínculos opcionais sem afetar tarefas, cronômetro ou totais ao remover uma matéria.

**Non-Goals:** gerar ou sugerir roadmap com IA, converter automaticamente assuntos conhecidos em itens do plano, alterar o progresso de tarefa a partir de matéria, criar analytics ou conectar matérias a rotinas/flashcards.

## Decisions

### 1. Persistência e validação

Migrations versionadas criam `study_subjects` (`id`, `user_id`, `name`, `current_level`, `objective`, `due_date`, `weekly_hours`, timestamps), `subject_known_topics` (`id`, `subject_id`, `name`, `position`) e `subject_plan_items` (`id`, `subject_id`, `title`, `status`, `position`, timestamps). FKs de tópicos/itens usam exclusão em cascata; índices iniciados pelo proprietário em matérias e por matéria/posição nos filhos. `weekly_hours` é decimal, aceitando até 168 horas com precisão de meia hora; a API rejeita frações diferentes de 0,5. A lista de assuntos conhecidos é ordenada, pode ser vazia e é substituída integralmente quando enviada em uma edição, na mesma transação dos demais campos. Nomes repetidos são comparados depois de aparar espaços e sem diferenciar caixa. Datas são `DATE` e trafegam como `YYYY-MM-DD`, sem conversão de fuso. Prazo passado é permitido, inclusive em edição, para não impedir manutenção de uma matéria existente.

Cada item do plano tem título aparado de 1–160 caracteres e status `PENDING | IN_PROGRESS | COMPLETED`, padrão `PENDING`. Posições são inteiras contíguas dentro da matéria. Adição coloca no fim; remoção compacta a sequência; reordenação recebe a sequência completa de IDs da matéria e falha atomicamente se faltar, repetir ou incluir ID alheio. Isso evita resultados ambíguos em duas abas; a última ordem válida prevalece. Assuntos conhecidos e plano são estruturas diferentes para que conhecer um tema não conclua automaticamente uma etapa de estudo. Alternativa rejeitada: um único campo JSON para todo o plano, que dificultaria validação, autorização por item e mudanças pontuais.

### 2. API e propriedade

Rotas autenticadas: `POST/GET /subjects`, `GET/PATCH/DELETE /subjects/:id`, `POST /subjects/:id/plan-items`, `PATCH/DELETE /subjects/:id/plan-items/:itemId` e `PUT /subjects/:id/plan-items/order`. `GET /subjects` usa paginação padrão 1/20, máximo 100, ordenação `created_at DESC, id DESC`; o detalhe inclui assuntos conhecidos e plano ordenado. `PATCH` rejeita payload vazio/campos desconhecidos e preserva campos omitidos. Controllers derivam `userId` da sessão; services aplicam regras; repositories filtram proprietário em toda leitura/mutação e nunca buscam item só por ID. ID de outro usuário ou filho de outra matéria retorna 404. Escritas reutilizam a proteção de origem da autenticação. Schemas Zod de fronteira em `packages/contracts` validam entradas e DTOs; nenhuma entidade TypeORM sai da API.

### 3. Associações opcionais e fronteiras dos módulos

Uma migration posterior às tabelas de tarefas e Pomodoro acrescenta `subject_id` anulável em ambas, com FK `ON DELETE SET NULL` e índice apropriado. A edição da tarefa aceita `subjectId` omitido, ID válido ou `null` para limpar. A criação da sessão aceita `subjectId` opcional e fixa o vínculo naquele registro; não se muda a associação depois, preservando o contexto histórico escolhido no início. Uma sessão pode ter só tarefa, só matéria, ambas ou nenhuma. Se ambas forem informadas e a tarefa estiver vinculada a outra matéria, rejeitar; se a tarefa não tiver matéria, permitir o vínculo direto. Mudar a matéria de uma tarefa depois não reatribui a sessão. Remover a matéria zera apenas as FKs, mantendo tarefa, sessão e totais.

Tarefas e Pomodoro chamam um serviço público de consulta/autorização de matérias para validar existência e propriedade; o módulo de matérias não importa seus repositories. Para navegação inversa, endpoints de tarefas/sessões podem filtrar opcionalmente por `subjectId` após a autorização da matéria, sem leitura de repositories alheios pelo módulo de matérias. Se os módulos produtores estiverem desativados, a página da matéria omite suas seções, sem impedir CRUD da própria matéria. Alternativa rejeitada: exigir matéria para tarefa ou sessão, pois contrariaria a independência já especificada.

### 4. Preferências e experiência web

A página `/app/materias` usa sessão da autenticação e a preferência de matérias: navegação e widgets desaparecem ao desativar; rota web e rotas de API de matérias recusam acesso; os seletores de matéria deixam de aparecer e a API recusa novos vínculos. Vínculos existentes seguem no banco e reaparecem quando o módulo for reativado. Tarefa e Pomodoro ainda funcionam sem matéria. A preferência de IA controla somente ações de IA; não existe chamada de IA nesta mudança.

A página reúne lista paginada, detalhe, formulário e plano manual. Reordenação usa controles explícitos de subir/descer acessíveis por teclado, além de eventual arraste; não depende de drag and drop. Estados de carregamento, erro, vazio e sucesso são distintos, exclusão pede confirmação e formulários preservam entradas após falha. Layout testado desde 320 px, foco visível e movimento reduzido respeitado.

## Risks / Trade-offs

- [Mudanças predecessoras ainda não aplicadas] → aplicar autenticação, tarefas e Pomodoro antes; adaptar migrations e contratos aos tipos reais e reconciliar os deltas publicados sem sobrescrever requisitos existentes.
- [Vínculo de sessão diverge após edição posterior da tarefa] → guardar a matéria escolhida no início como contexto histórico; não recalcular associações antigas.
- [Exclusão de matéria perde agrupamento histórico por matéria] → preservar tempo e blocos globais e limpar a FK; eventual relatório histórico por matéria excluída exigirá outro requisito.
- [Preferências podem ser aplicadas em ordem diferente] → integrar o bloqueio assim que `add-profile-and-module-preferences` estiver aplicado; não duplicar armazenamento de preferências.

## Migration Plan

1. Aplicar os predecessores de autenticação, tarefas e Pomodoro e conferir migrations/contratos efetivos; aplicar preferências antes da integração dos controles de habilitação.
2. Executar migrations de matérias, itens e FKs opcionais com `synchronize: false` em MySQL isolado e testar rollback da migration.
3. Publicar API, contratos e web em conjunto; verificar duas contas, plano manual, preferências, exclusão e associações opcionais.
4. Em rollback do código, desregistrar rotas e ocultar UI sem excluir dados de matérias ou registros históricos automaticamente.
