# Proposal

## Why

O módulo de Matérias já oferece cadastro, plano manual e roadmaps completos, mas sua apresentação precisa acompanhar a identidade visual do EduTrack inspirada no Stitch. Atualizar apenas a listagem deixaria formulários, detalhes, confirmações e revisões visualmente desconectados.

## What Changes

- Aplicar a linguagem visual do ZIP `C:/Users/vinic/Downloads/subjects_edutrack_ai.zip` à listagem paginada e ao detalhe de matérias, adaptando cards e hierarquia aos dados reais.
- Derivar o mesmo padrão para criação/edição, exclusão, assuntos conhecidos, plano manual, registros vinculados e componentes auxiliares de matéria.
- Atualizar todas as interfaces de roadmaps: lista, conteúdo, editor manual, parâmetros de IA, prévia e confirmação, progresso, reordenação, regeneração, histórico, leitura e restauração de revisões.
- Harmonizar loading, vazio, erro, sucesso, validação, ações pendentes e controles desabilitados; preservar teclado, foco, temas existentes e responsividade desde 320 px.
- Preservar APIs, schemas, regras, navegação, preferências, validações e persistência. Omitir elementos do protótipo sem fonte ou funcionalidade existente; não introduzir mocks em runtime nem novas funcionalidades.

## Capabilities

### New Capabilities

- `subjects-visual-experience`: apresentação visual coerente de todas as interfaces existentes de Matérias e roadmaps, baseada no Stitch e subordinada aos dados e fluxos reais.

### Modified Capabilities

Nenhuma. As specs principais ainda não contêm uma capability específica de Matérias; as mudanças concluídas `add-subjects`, `generate-subject-roadmaps-with-ai` e `regenerate-roadmap-steps` continuam como contexto funcional, sem revisão de suas regras.

## Impact

Principalmente `apps/web/src/features/subjects/{SubjectsPage,RoadmapsSection,RoadmapEditor,RoadmapRevisionTools,SubjectSelect,SubjectName}.tsx`, `apps/web/src/styles/subjects.css` e testes de interface correspondentes. Integrações dos auxiliares em tarefas, Pomodoro e flashcards serão verificadas sem redesenhar esses módulos. O shell privado será reutilizado; ajuste localizado de título/container em `PrivatePage.tsx` somente se necessário para evitar duplicação visual. Reutilizar componentes de `packages/ui`, ícones e tokens existentes, sem nova dependência prevista. Nenhuma mudança em backend, contratos, migrations, endpoints ou dados.
