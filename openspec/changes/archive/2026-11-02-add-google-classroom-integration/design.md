# Design

## Context

React/Express em monorepo pnpm, TypeScript estrito, contratos Zod e MySQL com migrations. O login Google solicita identidade e não autoriza Classroom. `/conta` reúne perfil e preferências. Novas contas precisam de onboarding persistido após autenticação; contas existentes mantêm onboarding concluído e preferências anteriores.

Matérias exigem nome, nível, objetivo, prazo, horas semanais e assuntos conhecidos. Classroom não oferece planejamento pessoal: a associação a matéria existente ou criação válida é revisada pelo usuário. Tarefas possuem calendário local, status, prioridade e subtarefas que a integração preserva.

## Goals / Non-Goals

**Goals:** importações manuais duráveis de turmas e atividades, progresso, proveniência, conflitos e preservação dos fluxos existentes.

**Non-Goals:** geração de notas, extração/download de PDFs ou arquivos, Drive, OCR, chat, sincronização agendada, notificações push, escrita no Google, submissões e notas escolares. A redução de escopo foi aprovada explicitamente pelo usuário; aprimoramento de roadmaps/flashcards e sua configuração de IA permanecem como antes desta mudança. Falha do Gemini não bloqueia uma importação Classroom.

## Decisions

### 1. Consentimento mínimo separado do login

Callback próprio `/integrations/google-classroom/callback`, protegido por sessão, state único/expirável, PKCE e vínculo ao navegador. Validar `sub`, e-mail confirmado e escopos efetivos. A conta da integração não modifica identidade de login. Tokens usam AES-GCM com chave independente e contexto do usuário. Nenhuma credencial entra em DTOs ou logs.

Solicitar `classroom.courses.readonly` e `classroom.coursework.me.readonly`; consentimento incremental para `classroom.coursework.students.readonly` ao ler atividades como professor. Aceitar somente aliases canônicos de leitura conhecidos retornados pelo Google. Não solicitar materiais/Drive, participantes, submissões ou notas escolares. Reconexões não reintroduzem escopos de arquivos de testes anteriores. Restrições institucionais e verificação Google permanecem pré-requisitos operacionais; não são contornadas pela aplicação.

Desconexão remove tokens locais e incrementa versão antes de tentar revogação remota. Falha remota não restaura credenciais. Refresh temporariamente indisponível preserva credenciais; `invalid_grant` invalida e exige reconexão. Troca de identidade Google remove seleção anterior; conteúdo importado permanece.

### 2. Onboarding e seleção

Conta autenticada → módulos → Classroom opcional → seleção/revisão → resultado ou continuar. Preferências são salvas antes do OAuth. Cancelar, pular e falhar permitem uso manual; operações iniciadas continuam acessíveis no perfil. Padrões são preservados, ao menos um módulo de estudo permanece ativo e IA é independente.

Listar turmas paginadas sem seleção automática. Com matérias ativo, exigir matéria própria existente ou preenchimento dos campos obrigatórios de uma nova; sugerir apenas o nome. Com matérias desligado, tarefas são independentes; com tarefas desligado, importar apenas matérias. Mudança de destino e vinculação de tarefas já importadas exigem confirmação. Nenhum módulo é ativado implicitamente.

### 3. Escritas nos módulos proprietários

Classroom orquestra serviços públicos de Subjects/Tasks. Controllers tratam HTTP e schemas; serviços aplicam regras; repositórios dos produtores persistem entidades, origens, snapshots e recibos atomicamente. O composition root injeta dependências. Compartilhados não importam apps; IA não recebe dependência desta integração.

Origem única por usuário, identidade Google, turma e atividade. Locks e revisões serializam alterações de preferências/conexão com cada commit. Recibos fecham a janela entre commit do dado e atualização do job. Merge compara local, último importado e remoto: preservar edição manual, registrar conflito e exigir decisão com revisão. Status, prioridade, subtarefas e progresso não são controlados pela origem. Tombstones impedem recriação silenciosa; restauração é explícita. Desmarcar turma, remoção remota e desconectar não apagam dados.

Preservar título, descrição suportada, links HTTPS de origem/anexos e prazo remoto. Links de anexos são metadados, sem download. Excesso de texto gera erro por item, sem truncamento. Capturar fuso de estudo no job e conservar data/horário originais e instante UTC quando informado; reimportação sem mudança de prazo remoto não reinterpreta datas antigas. Não emitir eventos de conclusão por importação.

### 4. Jobs manuais MySQL

Endpoint de importação com requestId idempotente retorna 202. Uma operação ativa por usuário; concorrentes recebem a mesma operação. Worker separado usa lease, heartbeat, checkpoint e recuperação limitada. Backoff limitado para 429/5xx no cliente Google, com revalidação de autorização. Não há agendamento de novas importações.

Estados queued/running/completed/partial/failed/cancelled. Contadores por matéria/tarefa e motivos por turma/item, paginação e progresso persistido. Sucesso vazio sem erro; parcial com resultados úteis e pendências; falha sem resultado útil diante de erros. Retry explícito preserva sucessos e reavalia falhas; mudança de conexão requer nova importação. Após desconectar ou desativar módulo, não confirmar novos dados daquela versão/capacidade.

### 5. Interface e migração

`features/classroom` integra onboarding, `/conta#account-integrations` e proveniência no detalhe de matérias/tarefas. Endpoints autenticados: connection, connect/callback, courses, selection, imports e operations/retry. Não existe endpoint de geração de notas ou CRUD de notas.

Rótulos, foco visível, teclado, live region moderada, estados de carregamento/vazio/sucesso/parcial/erro, largura mínima de 320 px e regras existentes de movimento reduzido. Escritas inclusive DELETE/POST sem payload enviam JSON para cumprir proteção de origem/conteúdo.

Migration adiciona onboarding, conexão/OAuth, seleções, jobs/itens e origens/recibos dos produtores. `synchronize: false`; contas anteriores ficam concluídas, novas começam em módulos. Nenhuma tabela de notas. O banco descartável usado antes da redução pode conservar tabelas/jobs experimentais; não são entregues por migrations novas nem executados pelo worker final.

## Risks / Trade-offs

- Políticas institucionais e escopos podem impedir acesso: informar motivo/reconexão e preservar uso manual.
- Planejamento pessoal ausente na origem exige revisão adicional.
- Concorrência, crash e retries exigem locks, recibos e índices únicos com testes MySQL reais.
- Descrições extensas recusadas não são truncadas; resultado parcial informa limite atual.

## Migration Plan

1. Validar OAuth, callback, chave privada independente e aplicar migrations versionadas.
2. Subir API, worker e web com o mesmo banco/configuração; manter dados manuais.
3. Validar consentimento e importação/reimportação/revogação reais já autorizados e regressões locais. IA real não é critério desta entrega sem chamadas de IA.
4. Rollback operacional oculta integração e para worker, preservando dados. Down destrutivo de metadados exige decisão de retenção e backup.
