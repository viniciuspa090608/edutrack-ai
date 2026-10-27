# Design

## Context

Ver [proposal.md](proposal.md) e as specs de [rotinas](specs/study-routines/spec.md) e [contratos](specs/shared-contracts/spec.md). A API hoje só contém `/health` e o TypeORM usa migrations explícitas com `synchronize: false`; a web ainda não tem área privada. `add-user-authentication` planeja sessão, middleware autenticado e `/app`, mas não foi aplicado. As mudanças de tarefas, perfil e Pomodoro não são pré-requisitos para rotinas. O módulo usará apenas o identificador do usuário autenticado como dependência externa.

## Goals / Non-Goals

**Goals:** representar uma semana recorrente com mais de um horário por rotina, preservar a hora local definida pelo usuário e garantir que toda consulta e mutação pertençam à sua conta. A programação precisa ser legível em celular e desktop.

**Non-Goals:** materializar ocorrências por data, registrar presença ou conclusão, iniciar cronômetro, criar tarefas, enviar lembretes, resolver conflitos entre rotinas diferentes ou calcular disponibilidade livre.

## Decisions

### 1. Rotina, horários e recorrência

Criar migrations versionadas para `study_routines` (`id`, `user_id`, `name`, `time_zone`, `created_at`, `updated_at`) e `study_routine_slots` (`id`, `routine_id`, `weekday`, `start_time`, `end_time`). O `user_id` referencia a conta definida pela autenticação; `routine_id` tem exclusão em cascata. Índices por `user_id` e `(routine_id, weekday, start_time)` suportam listagem e programação. Não criar relação com tabelas de tarefas ou Pomodoro.

Cada rotina exige nome aparado de 1–120 caracteres e pelo menos um horário. Dia segue ISO 1–7, segunda a domingo; horas atravessam a API como `HH:mm` em formato de 24 horas e são persistidas como horário local, sem converter para UTC. Cada intervalo é fechado no início e aberto no fim: `[start, end)`, com `start < end`, o que aceita horários adjacentes e rejeita sobreposição no mesmo dia da mesma rotina. Janelas que atravessam a meia-noite não entram nesta etapa; o formulário explica que devem ser divididas em horários dos dois dias. Rotinas diferentes podem se sobrepor e continuam identificadas separadamente. Alternativa rejeitada: um único horário por rotina, que impediria horas diferentes em dias distintos.

Guardar um identificador IANA de fuso em cada rotina. A web sugere o fuso do navegador no cadastro, mas o mostra e permite editá-lo; a API exige e valida um valor reconhecido. Alterar o fuso preserva `weekday`, `start_time` e `end_time` e muda apenas a interpretação do planejamento futuro. A programação sempre mostra o horário de parede e o fuso da rotina, inclusive em dispositivo configurado para outro fuso. Como não há ocorrências datadas nem alarmes, não se resolve uma hora inexistente ou duplicada em transições de horário de verão; essa política será definida se o produto vier a executar eventos em datas concretas. Alternativa rejeitada: inferir fuso em cada leitura a partir do dispositivo, que deslocaria ou reinterpretaria uma rotina salva sem ação do usuário.

### 2. API e autorização

Expor `POST /routines`, `GET /routines`, `GET /routines/:id`, `PATCH /routines/:id`, `DELETE /routines/:id` e `GET /routines/schedule`. A rota de programação é registrada antes da rota por ID. `GET /routines` lista rotinas próprias com paginação; `/routines/schedule` projeta todos os horários próprios para a semana padrão, ordenados por dia e início, incluindo nome e fuso. Não grava sessões nem ocorrências. O `PATCH` atualiza somente campos enviados; se `slots` for enviado, substitui o conjunto inteiro em uma transação. Lista vazia, sobreposição, horário inválido ou fuso inválido abortam a atualização toda. A exclusão remove horários pela FK. Contratos Zod de fronteira ficam em `packages/contracts`; entidades e repositories ficam somente na API.

Todas as rotas usam middleware de sessão de `add-user-authentication` e checagem de origem em escritas. O controller recebe `userId` da sessão, nunca do corpo ou query. Repository filtra `user_id` na lista, detalhe, edição, exclusão e projeção semanal; um ID válido fora do escopo retorna 404. A validação de sobreposição fica no service e é executada antes da gravação dentro da transação; isso garante consistência também em chamadas diretas à API. Alternativa rejeitada: proteger apenas a página web, que deixaria os dados expostos por chamadas HTTP diretas.

### 3. Experiência web

Adicionar `/app/rotinas` à área protegida e à navegação autenticada, sem depender de páginas de tarefas ou Pomodoro. A página combina lista de rotinas, formulário com linhas de horários adicionáveis/removíveis e programação semanal. Em desktop, a programação pode usar colunas por dia; em 320 px, grupos verticais por dia evitam rolagem horizontal e preservam nome, hora e fuso. Dias sem horários mostram um estado discreto; ausência de todas as rotinas oferece ação para criar a primeira. O formulário mantém dados digitados após erro e só declara sucesso depois da resposta da API. Exclusão exige confirmação, com cancelamento sem requisição de mutação. Controles têm rótulos, foco visível e funcionamento por teclado.

### 4. Verificação e implantação

Testes de contrato cobrem nome, dia 1–7, `HH:mm`, ordem das horas, fuso IANA, sobreposição e lista vazia. Integração HTTP com MySQL real em `TEST_DB_NAME` usa duas contas/sessões e verifica CRUD, atualização atômica de horários, ordenação semanal, isolamento por ID, exclusão em cascata e ausência de qualquer escrita em tarefas ou Pomodoro. Testes web cobrem estados vazio/loading/erro/sucesso, inclusão e remoção de horários, confirmação de exclusão, teclado e 320 px. Aplicar primeiro a autenticação e suas migrations; este módulo não espera a implementação dos demais módulos de estudo.

## Risks / Trade-offs

- [Autenticação ainda planejada] → aplicar `add-user-authentication` antes de conectar rotas e página privadas; reutilizar seu middleware em vez de criar sessão própria.
- [Rotinas com fusos diferentes parecem ocorrer na mesma hora] → exibir o fuso em cada horário e manter a ordenação por dia/hora local declarados, sem conversão silenciosa.
- [Horários atravessando meia-noite não entram em um intervalo] → validar e orientar divisão entre os dois dias; manter a regra explícita no formulário.
- [Substituição parcial de horários após falha] → usar uma transação para rotina e conjunto de horários, com teste que confirme rollback completo.
- [Duas edições simultâneas da mesma rotina] → última atualização válida prevalece nesta versão; controle de versão otimista pode ser proposto se surgir demanda.

## Migration Plan

1. Confirmar autenticação aplicada e tabela de usuários disponível.
2. Aplicar migrations de rotinas e horários, mantendo `synchronize: false`; verificar execução única e rollback em banco isolado.
3. Publicar API e web com a programação semanal; validar dois usuários, fuso diferente do dispositivo, horários adjacentes/sobrepostos e navegação a 320 px.
4. Em rollback do código, retirar as rotas e a navegação sem apagar automaticamente rotinas já criadas; decidir retenção dos dados antes de reverter tabelas em ambiente persistente.
