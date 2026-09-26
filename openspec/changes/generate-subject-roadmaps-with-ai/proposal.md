# Proposal

## Why

Um roadmap pode ajudar a transformar o objetivo de uma matéria em uma sequência de estudo compatível com o tempo disponível. Como a IA pode produzir etapas inadequadas, o resultado precisa ser validado e revisado pela pessoa antes de integrar seus dados.

## What Changes

- Acrescentar o modelo e o CRUD manual de roadmaps no módulo de matérias, com blocos e passos ordenados, preservando o plano de assuntos já entregue.
- Adicionar, para matérias já criadas, **Aprimorar com IA** somente quando a preferência de IA e o módulo de matérias estiverem habilitados.
- Solicitar nível atual, objetivo, prazo, horas semanais disponíveis e assuntos já conhecidos para gerar um roadmap com blocos e passos.
- Validar a resposta estruturada da IA antes da prévia; permitir editar blocos e passos, salvar a versão revisada ou cancelar sem persistir conteúdo gerado.
- Manter criação, consulta e edição manual de matérias e seus roadmaps funcionando sem IA.
- Deixar a regeneração parcial de passos para `regenerate-roadmap-steps`.

## Capabilities

### New Capabilities

- `subject-ai-roadmaps`: modelo e CRUD manual de roadmaps, geração, validação, prévia, edição e confirmação por matéria, com isolamento por usuário e IA opcional.

### Modified Capabilities

Nenhuma spec principal publicada de matérias ou IA existe atualmente.

## Impact

- Autenticação, preferências e `add-subjects` estão aplicados. O modelo entregue por matérias contém um plano simples de assuntos, sem roadmaps de blocos/passos; esta mudança passa a incluir essa base manual, conforme ampliação autorizada.
- Acrescenta contratos de fronteira em `packages/contracts`, serviço de geração na API, integração com o provedor de IA, rotas autenticadas e fluxo de prévia em `apps/web`.
- A geração é opcional e não altera a disponibilidade dos fluxos manuais. Não inclui regeneração parcial, salvamento automático, criação de matérias pela IA nem associação com tarefas ou Pomodoro.
