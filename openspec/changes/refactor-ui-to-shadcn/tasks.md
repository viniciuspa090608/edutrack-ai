# Tasks

## 1. Baseline e configuração

- [x] 1.1 Registrar HEAD, branch, status e diffs preexistentes no início do apply e resultados baseline de lint/typecheck/test/build; verificar que o registro distingue arquivos desta mudança e falhas anteriores.
- [x] 1.2 Configurar components.json de web/UI, preset Shadcn baseado em Radix, TSX, CSS variables e aliases; registrar versão/preset escolhidos e verificar que a geração de Button grava somente no pacote UI e produz imports compatíveis.
- [x] 1.3 Integrar Tailwind v4 no Vite e Vitest, incluindo detecção de classes em ambos os workspaces; verificar que Button renderiza estilizado em desenvolvimento e no build de produção.
- [x] 1.4 Implementar cn, exports públicos de componentes/utilitário/CSS e dependências no workspace correto, preservando build NodeNext e declarations; verificar build de packages/ui, typecheck da web e ausência de imports de apps dentro do pacote.
- [x] 1.5 Criar tokens semânticos e folha compartilhada importada uma vez, com valores iniciais centralizados e suporte a portals; verificar que alterar um token muda os consumidores sem editar as páginas e que não há conflito de seletores globais.

## 2. Base compartilhada e páginas públicas

- [x] 2.1 Adicionar primitives utilizados nas primeiras telas e compor StatusPanel com Card/Alert/Button/Skeleton; verificar estados loading/success/error e retry em ApiStatus, preservando anúncios acessíveis.
- [x] 2.2 Migrar PublicLanding para Button/Card/Badge e menu mobile Sheet; verificar links, âncoras, header fixo, Escape, retorno de foco e seleção de seção nos testes de App e na viewport de 320 px.
- [x] 2.3 Migrar controles visuais de FeatureCarousel mantendo sua composição específica; verificar FeatureCarousel.spec.tsx com avanço de 6 segundos, navegação manual, pausa por foco/hover/visibilidade e movimento reduzido.
- [x] 2.4 Migrar AccessPage para Card, Tabs, Input, Label, Button e Alert/Form ou Field adequado; verificar Auth.spec.tsx com login, cadastro, validação, mensagens, Google e returnTo preservados.
- [x] 2.5 Migrar EmailVerificationPage e PasswordRecoveryPage; verificar EmailPages.spec.tsx cobrindo confirmação, reenvio, recuperação, pending, erro e sucesso.
- [x] 2.6 Migrar SystemPage e fallback de App; verificar App.spec.tsx e navegação de /status e rota inexistente com foco visível e retry operacional.

## 3. Shell autenticado e conta

- [x] 3.1 Migrar controles e feedback de PrivatePage; verificar testes de autenticação com sessão, logout, módulos condicionados por preferências, retorno de acesso e vínculo Google sem mudanças de API.
- [x] 3.2 Migrar ProfilePage com campos, avatar, preferências Checkbox/Switch conforme semântica e feedback; verificar ProfilePage.spec.tsx com atualização de nome, avatar, credenciais e preferências, incluindo erro/pending.

## 4. Tarefas e subtarefas

- [x] 4.1 Migrar formulário, filtros e cards de TasksPage para primitives Shadcn; verificar TasksPage.spec.tsx com criar/editar/listar/filtrar/paginar preservando payloads e validação.
- [x] 4.2 Migrar Dialog de edição e TaskConfirmation para Alert Dialog controlado nas ações destrutivas; verificar foco inicial/retorno, Escape, cancelamento, erro que mantém overlay aberto e bloqueio de submissão duplicada durante operação assíncrona.
- [x] 4.3 Migrar SubtasksSection e TaskProgress para Checkbox/Progress/Button; verificar SubtasksSection.spec.tsx e texto acessível, valores e arredondamentos de progresso intactos.

## 5. Matérias e roadmaps

- [x] 5.1 Migrar SubjectSelect e apresentação de SubjectName; verificar seleção sem matéria, seleção fora da página, carregamento, retry, disabled e paginação sem alterar valor enviado ao domínio.
- [x] 5.2 Migrar SubjectsPage e seus formulários/filtros/cards; verificar SubjectsPage.spec.tsx com CRUD, associação de tarefas, validação e estados vazios.
- [x] 5.3 Migrar RoadmapsSection e RoadmapEditor; verificar RoadmapsSection.spec.tsx com criação manual, edição de etapas e geração por IA mantendo preferências e payloads.
- [x] 5.4 Migrar RoadmapRevisionTools e confirmações; verificar RoadmapRevisionTools.spec.tsx com seleção de etapas, preview, confirmação, conflito e histórico de versões preservados.

## 6. Flashcards

- [x] 6.1 Migrar FlashcardsPage e FlashcardForms para cards e campos Shadcn; verificar FlashcardsPage.spec.tsx com CRUD, filtros e associações de matéria.
- [x] 6.2 Migrar CardViewer, ReviewQueue e ReviewHistory preservando componentes de domínio; verificar ReviewQueue.spec.tsx com frente/verso, avaliação, agendamento e histórico sem alterar cálculo ou API.
- [x] 6.3 Migrar ImportFlow, incluindo Input de arquivo, Select e Table do preview; verificar ImportFlow.spec.tsx com upload, duplicatas, erros, preview e confirmação sem mudar limites ou persistência.
- [x] 6.4 Migrar FlashcardAIFlow e seus estados/controles; verificar FlashcardAIFlow.spec.tsx com geração, edição, seleção e confirmação, incluindo restrições de preferência e falhas assíncronas.

## 7. Estudo, relatórios e dashboard

- [x] 7.1 Migrar PomodoroPage mantendo temporizador de domínio; verificar PomodoroPage.spec.tsx com início, pausa, retomada, conclusão, abandono, reload e associações existentes.
- [x] 7.2 Migrar RoutinesPage mantendo calendário e regras atuais; verificar RoutinesPage.spec.tsx com dias/horários, edição, exclusão e ocorrências de rotina.
- [x] 7.3 Migrar AnalyticsPage mantendo visualizações e cálculos de domínio; verificar AnalyticsPage.spec.tsx com filtros, período, fuso, loading, vazio e falha.
- [x] 7.4 Migrar StudyProgressPage e StudyTimeZoneSection com Card/Progress e controles adequados; verificar StudyProgressPage.spec.tsx com streaks, conquistas, fuso, progresso acessível e estados.
- [x] 7.5 Migrar DashboardPage para composições Shadcn; verificar DashboardPage.spec.tsx com resumos, atalhos, estados por seção e respostas parciais sem alterar agregações.

## 8. Auditoria e limpeza

- [x] 8.1 Auditar cada rota e todos os componentes prioritários do pedido, registrando destino ou ausência de uso adequado em implementation-review.md; verificar que nenhuma tela existente fica fora da migração e que primitivas manuais remanescentes possuem justificativa específica.
- [x] 8.2 Remover componentes, imports e CSS substituídos após buscar consumidores em todo o projeto; verificar ausência de referências mortas e de duplicações de Button/Card/Dialog/Select e demais primitives utilizados.
- [x] 8.3 Auditar animate.css e outras dependências visuais, removendo apenas as que perderam todas as utilizações; verificar instalação pelo lockfile e testes/build sem imports pendentes.
- [x] 8.4 Documentar como adicionar componentes Shadcn ao pacote UI, utilizar tokens/variants e decidir por componentes de domínio/wrappers; verificar que os exemplos usam exports reais e preservam limites do monorepo.

## 9. Validação integrada e conclusão

- [x] 9.1 Validar todas as rotas em 320 px, mobile e desktop, por teclado e com movimento reduzido; registrar evidência de foco, labels, overlays, portals, ausência de overflow de layout e estados loading/erro/vazio/sucesso aplicáveis.
- [x] 9.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build com sucesso, usando MySQL real e banco isolado nos testes de banco; registrar resultados e corrigir regressões sem ocultar falhas de configuração com mocks.
- [x] 9.3 Revisar diff final e confirmar ausência de mudanças funcionais em regras, HTTP, backend, autenticação, estado global, persistência e cálculos; verificar que novas cores de UI são tokens e que a paleta futura permanece centralizável.
- [x] 9.4 Finalizar tasks.md somente após validações e criar exatamente um commit de conclusão com arquivos/hunks desta mudança; revisar staged, executar git diff --cached --check e verificar hash e lista de arquivos, preservando diffs anteriores e sem tag, push ou archive. Não criar commit vazio ou concluir apply com verificações falhas.
