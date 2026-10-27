# Design

## Context

Ver `proposal.md` e `specs/subject-ai-roadmaps/spec.md`. Autenticação, preferências e matérias estão aplicadas. `add-subjects` entrega `subject_plan_items`, uma lista plana manual, e o contrato público `SubjectsService.detail/requireOwned`. Não entrega roadmaps com blocos/passos. A ampliação autorizada inclui agora essa persistência e o CRUD manual no módulo de matérias antes de integrar a IA.

## Goals / Non-Goals

**Goals:** isolar a integração com IA, limitar e validar cada fronteira, oferecer prévia editável sem persistência e salvar de modo atômico no modelo proprietário de matérias.

**Non-Goals:** alterar o CRUD de matérias ou o plano simples existente, sobrescrever roadmaps anteriores, guardar rascunhos no servidor, regenerar somente passos, iniciar tarefas ou sessões Pomodoro, orquestrar múltiplos provedores.

## Decisions

### 0. Estabelecer a base manual de roadmaps nesta mudança

Criar `subject_roadmaps`, `subject_roadmap_blocks` e `subject_roadmap_steps`, com UUIDs char(36), títulos, descrições não vazias, posições contíguas e FKs de exclusão em cascata. Os campos de texto e os limites de 20 blocos/20 passos por bloco serão iguais no manual e na IA. `POST/GET /subjects/:subjectId/roadmaps` e `GET/PATCH/DELETE /subjects/:subjectId/roadmaps/:roadmapId` terão sessão, origem para escritas, preferência de matérias e propriedade. A lista paginada segue 1/20 (máximo 100), criação/ID decrescentes. PATCH recebe a versão completa revisada; substitui blocos e passos em uma transação, com bloqueio da matéria. IDs de roadmap fora da matéria retornam 404. A exclusão exige confirmação na web. O editor manual usa os mesmos controles de texto e de ordem da prévia. Nenhuma operação manual consulta o provedor ou exige IA habilitada. O plano simples existente é independente e não será convertido nem excluído.

A primeira migration cria a base manual; outra acrescenta `generation_id` anulável com unicidade global para confirmação idempotente, preservando roadmaps manuais. O módulo de IA usa apenas `SubjectsService` para consulta e salvamento público; a persistência fica no módulo de matérias.

### 1. Usar o módulo de matérias como proprietário do roadmap

O módulo de IA terá controller e service para geração, mas não repository próprio de matérias ou roadmaps. Consultará um contrato público do módulo de matérias para verificar existência e propriedade e pedirá ao service público desse módulo o salvamento transacional. O mesmo modelo de blocos e passos será usado pela edição manual e pela versão confirmada da IA. Um salvamento cria um novo roadmap e preserva os existentes. Alternativa rejeitada: entidade paralela de `ai_roadmaps`, que duplicaria propriedade e regras da organização manual.

O contrato de fronteira em `packages/contracts` descreverá parâmetros, blocos, passos, prévia e comando de confirmação com schemas de execução. Limites iniciais: objetivo até 500 caracteres; até 30 assuntos conhecidos, cada um até 120 caracteres; horas semanais entre 0,5 e 80; prazo futuro até cinco anos; 1 a 20 blocos, cada qual com 1 a 20 passos; título até 120 e descrição até 1.000 caracteres. Campos textuais serão aparados; conteúdo vazio será recusado. Limites visam controlar custo e tornar o editor operável; testes cobrirão os extremos. O nível atual será um valor explícito selecionado entre `BEGINNER`, `INTERMEDIATE` e `ADVANCED`.

### 2. Separar geração da confirmação

`POST /subjects/:subjectId/roadmap-generations` valida sessão, preferência de matérias, preferência de IA, propriedade e parâmetros antes da chamada ao provedor. O prompt inclui apenas nome da matéria e entradas fornecidas para a geração; trata esses textos como dados, jamais como instruções de sistema. A resposta do provedor passa por limite de tamanho, parsing e schema estrito; erros produzem um código recuperável sem expor prompt, chave ou resposta bruta. Só depois a API retorna a prévia e um comprovante assinado de curta duração, com usuário, matéria, instante de expiração e identificador aleatório da geração. O comprovante não contém conteúdo sensível e não exige armazenar a prévia no servidor. Expira em 30 minutos; a página explica a expiração e permite gerar de novo. A prévia permanece só no estado da página.

`POST /subjects/:subjectId/roadmaps/confirm-ai` recebe comprovante e versão final editada. Valida assinatura, prazo, usuário, matéria, preferências e estrutura do conteúdo; solicita ao módulo de matérias a criação em transação. O identificador da geração é gravado com unicidade no roadmap salvo para tornar confirmação repetida idempotente, inclusive após falha de rede. Não existe autosave. A rota manual de matérias segue seu próprio fluxo. Alternativa rejeitada: salvar um rascunho gerado antes da revisão, pois cancelamento e fechamento deixariam conteúdo persistido sem consentimento.

### 3. Adaptador de provedor com limites operacionais

Este primeiro consumidor usa a OpenAI Responses API com `store: false` e saída JSON Schema estrita por um único adaptador de IA no lado da API, com chave, modelo, tempo limite e tamanho máximo de resposta validados nas variáveis de ambiente; segredos nunca chegam à web. A configuração de IA é opcional para iniciar a API e para os fluxos manuais; geração fica indisponível com erro controlado se não houver configuração. Cada solicitação tem tempo limite e limite de saída. Não há repetição automática de geração para evitar custo ou propostas duplicadas; a pessoa pode tentar novamente. O adaptador solicita saída estruturada, mas a validação local permanece obrigatória. Alternativa rejeitada: chamar o provedor diretamente da web, o que exporia credenciais e contornaria controle de conta.

### 4. Prévia como editor explícito

Na tela da matéria, **Aprimorar com IA** abre formulário com os cinco parâmetros e indicação do destino. Após geração, uma visão de blocos e passos, em ordem, permite editar, inserir, remover e mover itens por controles de teclado. **Salvar roadmap** envia somente a versão visível após ação explícita; **Cancelar** descarta o estado local. Falha no salvamento preserva a edição para correção ou nova tentativa. A web não interpreta HTML/Markdown da resposta como código executável; apresenta texto escapado por componentes. Após sucesso, navega ou atualiza a consulta do roadmap persistido. Alternativa rejeitada: confirmar o resultado automaticamente ao terminar a chamada de IA.

## Risks / Trade-offs

- [Ausência do modelo manual de roadmaps] → entregá-lo nesta mudança no módulo de matérias, preservando o plano simples e expondo o salvamento público.
- [Resposta inválida, instruções maliciosas ou texto excessivo] → tratar tudo como dado, validar tamanho e estrutura na API e renderizar apenas texto seguro.
- [Custo e lentidão da geração] → limitar entrada/saída e tempo, bloquear envios duplicados na web e não repetir automaticamente.
- [Comprovante expirado ou confirmação concorrente] → erro orientado à nova geração; identificador único persistido torna repetição idempotente.
- [IA ou preferência desabilitada entre prévia e confirmação] → revalidar ambas no servidor antes de salvar; preservar manualidade.
- [Conteúdo pedagogicamente fraco apesar de válido] → manter revisão humana obrigatória e edição completa antes do salvamento.

## Migration Plan

1. Conferir os predecessores aplicados e criar o modelo e CRUD manual de roadmaps, depois adicionar configuração opcional do provedor e contratos da geração.
2. Acrescentar, por migration versionada, campo ou registro único de identificação da geração ao roadmap manual existente; preservar todos os roadmaps anteriores com valor nulo. `synchronize` permanece falso.
3. Entregar API e editor de prévia, depois habilitar a opção visual apenas para contas com IA e matérias ativas. Testar MySQL real isolado e falhas do provedor.
4. Em rollback, ocultar a ação de IA e remover suas rotas; roadmaps já confirmados permanecem utilizáveis como roadmaps manuais. Não apagar dados confirmados.
