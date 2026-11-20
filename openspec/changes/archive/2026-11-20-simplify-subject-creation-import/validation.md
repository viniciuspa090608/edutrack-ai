# Validação

## Implementação

Criação mínima de disciplinas com objetivo automático e sugestões editáveis. Importação com nova disciplina selecionada na interface e confirmação explícita dos dados, Select de disciplinas próprias com todas as páginas, reimportação idempotente e desconexão sem dados visuais antigos. Ajustes de formulário, ações, mensagens e estados vazios conforme referências enviadas.

## Verificações

- pnpm lint, pnpm typecheck, pnpm test e pnpm build aprovados antes da conclusão; o fluxo openspec:finish repete os quatro comandos antes do commit.
- Suíte completa: 22 testes do workflow, 45 de contratos, 315 da API e 326 da web aprovados. Verificação adicional de Classroom: 15 testes aprovados, incluindo resposta tardia após desconexão.
- API usa MySQL real com bancos isolados. Cobertura inclui criação mínima, atualização parcial, importação com defaults e repetição sem nova disciplina, autorização de destino e confirmação de prévia do assistente.
- Conferência em navegador headless com respostas sintéticas nos limites HTTP, temas claro/escuro e larguras 1280 e 320 px. Verificados ausência de overflow horizontal, pares de campos em desktop, empilhamento móvel, cards vazios até a margem útil e botão de envio de 44 por 44 px.
- Snapshots de cinco capacidades revisados semanticamente; requisitos e cenários anteriores preservados. Validação estrita da mudança aprovada.
- Nenhuma alteração OAuth, migration ou publicação remota.

## Arquivos da implementação

- apps/api/src/modules/ai/assistant.service.ts
- apps/api/test/assistant.http.spec.ts
- apps/api/test/classroom.http.spec.ts
- apps/api/test/subjects.http.spec.ts
- apps/web/src/features/assistant/AssistantPage.tsx
- apps/web/src/features/assistant/assistant.css
- apps/web/src/features/classroom/ClassroomSection.spec.tsx
- apps/web/src/features/classroom/ClassroomSection.tsx
- apps/web/src/features/subjects/SubjectsPage.tsx
- apps/web/src/styles/classroom.css
- apps/web/src/styles/collection-empty-state.css
- packages/contracts/src/ai-assistant.ts
- packages/contracts/src/subjects.spec.ts
- packages/contracts/src/subjects.ts

## Artefatos e specs

proposal.md, design.md, tasks.md, validation.md e cinco deltas desta mudança, mais suas specs principais sincronizadas pelo fluxo local de conclusão.
