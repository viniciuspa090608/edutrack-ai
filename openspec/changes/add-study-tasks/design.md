# Design

## Context

Ver [proposal.md](proposal.md) e as specs de [tarefas](specs/study-tasks/spec.md) e [contratos](specs/shared-contracts/spec.md). Hoje a API Express só tem `/health`, o TypeORM está com `synchronize: false` e sem entidades de produto, e a web escolhe páginas por caminho. `add-user-authentication` define sessão, `userId` autenticado, middleware reutilizável e `/app`, mas ainda não foi aplicado. Portanto, este apply deve ocorrer após a autenticação e consumir seu contrato público sem recriar identidade ou sessão. `add-email-verification-and-recovery` não é requisito para tarefas.

## Goals / Non-Goals

**Goals:** criar um módulo isolado de tarefas, com propriedade inequívoca, API e interface completas; preservar uma fronteira pequena para futuras extensões; manter datas de prazo consistentes entre navegador, API e MySQL.

**Non-Goals:** subtarefas, percentual ou cálculo automático de progresso, integração com IA, associação com matérias, recorrência, notificações, anexos, compartilhamento, lixeira e eventos para analytics sem consumidor implementado.

## Decisions

### 1. Modelo de dados e limites

Criar uma migration versionada `study_tasks` com `id` imutável, `user_id` obrigatório referenciando `users.id` da autenticação, `title`, `description` anulável, `priority`, `due_date` anulável, `status`, `created_at` e `updated_at`. O tipo da FK deverá acompanhar exatamente o tipo de `users.id` quando a migration de autenticação existir. Índices iniciados por `user_id` suportarão listagem, filtro e ordenação; `synchronize` permanece desativado. Não criar `subject_id`, `subtask_count`, `progress_percent` ou dependências de outros módulos antes de seus próprios proposals.

Usar `LOW | MEDIUM | HIGH` para importância, com `MEDIUM` padrão, e `PENDING | IN_PROGRESS | COMPLETED` para status, com `PENDING` padrão. Título é aparado e exige 1–160 caracteres; descrição aceita até 2.000 caracteres e pode ser removida; prazo aceita data válida `YYYY-MM-DD`, inclusive passada. `due_date` é `DATE` no MySQL e atravessa o contrato como string de calendário, sem conversão a instante UTC que possa deslocar o dia exibido. Uma data final anterior à inicial no filtro é inválida. Alternativa rejeitada: armazenar prazo como timestamp, pois o usuário não pediu hora e fusos criariam mudança involuntária do dia.

### 2. Fronteira HTTP, contratos e paginação

Expor `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id` e `DELETE /tasks/:id`. `POST` devolve 201 e a tarefa; leituras e `PATCH` devolvem DTO público; `DELETE` devolve 204. Entradas e saídas são validadas por schemas em `packages/contracts`, incluindo filtros, paginação e enumerações; entidades TypeORM ficam exclusivamente em `apps/api`. O `PATCH` altera apenas campos enviados e aceita `null` explícito para limpar descrição e prazo. Campos desconhecidos e payload vazio são rejeitados para evitar atualizações ambíguas.

`GET /tasks` usa filtros opcionais `status`, `priority`, `dueFrom` e `dueTo`, combinados com AND. O intervalo de prazo é inclusivo e exclui tarefas sem prazo; sem filtro de prazo, tarefas sem prazo permanecem na lista. Paginação por `page` e `pageSize`, padrão 1/20 e limite de 100, com ordem estável `created_at DESC, id DESC`; devolver itens e metadados necessários para navegar. A web mantém filtros ao mudar de página e volta à primeira quando os altera. Alternativa considerada: carregar todas as tarefas e filtrar no cliente. Ela aumenta o volume transferido e pode ocultar erros de isolamento; o servidor aplicará filtros e paginação.

### 3. Propriedade e autenticação

Montar as rotas sob o middleware de sessão de `add-user-authentication`. Controller lê apenas o `userId` fornecido pelo middleware. Service contém validação de negócio e repository sempre inclui `user_id = :authenticatedUserId`, tanto em SELECT quanto em UPDATE e DELETE; uma operação por ID que não afeta linha própria resulta em 404. Não consultar primeiro por ID isolado nem aceitar proprietário em payload ou query. O banco mantém FK para integridade, mas a autorização ocorre em cada operação da API. Para escritas, reutilizar a checagem de origem/CSRF já definida pela autenticação. Alternativa rejeitada: apenas esconder tarefas alheias na web, pois chamadas diretas ainda exporiam ou alterariam dados.

### 4. Fluxo web manual

Adicionar `/app/tarefas` à área protegida e navegação de `/app`, reutilizando a verificação de sessão e o destino de retorno interno da autenticação. A página `features/tasks` mostra lista, filtros, paginação e formulário de criação/edição. Exibir status com nomes legíveis e opção de troca manual para qualquer um dos três valores. A exclusão exige confirmação acessível e só atualiza a lista após sucesso da API. Formulários preservam entradas em erro, desabilitam envio duplicado durante loading e mostram estados vazios distintos: sem tarefas e sem resultado para o filtro. Foco visível, rótulos, mensagens associadas aos campos e layout a 320 px são critérios de aceite. Nenhum fluxo chama IA ou espera matérias/flashcards.

### 5. Testes e implantação

Testes de contrato cobrem enumerações, tamanhos, datas de calendário, `null` explícito, filtros e paginação. Integração HTTP usa MySQL real isolado em `TEST_DB_NAME`, migrations aplicadas e pelo menos dois usuários/sessões reais, cobrindo CRUD, filtros combinados, ausência de sessão e acesso por ID alheio. Testes web cobrem carregamento, estados vazios, criação, edição, transições de status, confirmação de exclusão e teclado; inspeção visual verifica 320 px. A migration depende da tabela `users`, então a ordem de apply/deploy é autenticação, migration de tarefas, API e web. Executar os quatro comandos de qualidade do projeto e validação OpenSpec antes do commit de conclusão.

## Risks / Trade-offs

- [Autenticação ainda é apenas proposta] → aplicar `add-user-authentication` primeiro e usar seu middleware e tipo de ID reais; não implementar um segundo mecanismo de sessão neste módulo.
- [ID alheio vaza existência por resposta diferente] → filtrar por proprietário em todas as operações e retornar 404 para ID válido fora do escopo.
- [Prazo muda de dia entre fusos] → manter `YYYY-MM-DD` como data de calendário de ponta a ponta e testar em fusos distintos.
- [Paginação perde ou repete item durante inserções concorrentes] → ordenação estável por data e ID; a paginação por número de página aceita mudanças entre requisições nesta primeira versão.
- [Duas abas editam a mesma tarefa] → última gravação válida prevalece nesta etapa; concorrência otimista fica fora do escopo sem demanda concreta.

## Migration Plan

1. Concluir/aplicar a autenticação e suas migrations; validar que a sessão entrega `userId` para rotas privadas.
2. Aplicar a migration de tarefas, com FK e índices, no MySQL; verificar execução única e rollback da migration em banco isolado.
3. Publicar rotas e página protegida; conferir CRUD, filtros, datas, isolamento entre dois usuários e navegação direta.
4. Em rollback de aplicação, ocultar a rota web e desregistrar as rotas da API, preservando `study_tasks` até decidir a retenção dos dados criados; não remover a tabela automaticamente em rollback de código.
