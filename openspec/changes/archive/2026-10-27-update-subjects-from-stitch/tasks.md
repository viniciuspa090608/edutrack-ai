# Tasks

## 1. Preparação e base visual

- [x] 1.1 Registrar branch, HEAD, status e diffs preexistentes no início do apply; verificar que o registro distingue os artefatos desta proposta de alterações externas e permite staging seletivo.
- [x] 1.2 Reabrir as quatro referências do ZIP e estabelecer classes/tokens locais segundo o mapeamento de `design.md`; verificar que a base visual reutiliza UI/ícones/fontes existentes e não importa HTML, CDN, dados ou funcionalidades fictícias.

## 2. Matérias e plano manual

- [x] 2.1 Redesenhar cabeçalho, cards e paginação de `SubjectsPage`, preservando shell/título único e ações; verificar listagem com dados reais, objetivo longo, loading, vazio, erro/retry e múltiplas páginas.
- [x] 2.2 Atualizar o detalhe, metadados e assuntos conhecidos; verificar abrir/fechar e acesso por `?subject=<id>` e `#roadmap-<id>` sem novas rotas nem informações inventadas.
- [x] 2.3 Estilizar criação e edição em `SubjectForm`, mantendo todos os campos/limites e ações atuais; verificar teclado, validação, envio, cancelamento, sucesso e falha com valores preservados nos testes existentes.
- [x] 2.4 Harmonizar confirmação de exclusão de matéria e seus estados em portal; verificar título/contexto, cancelar/Escape, retorno de foco, bloqueio durante envio e mensagens corretas sobre preservação dos vínculos.
- [x] 2.5 Atualizar `PlanEditor` com linhas de assuntos, status e ações coerentes; verificar adicionar/renomear/reordenar/alterar status/remover por teclado, vazio, pendência e erro sem chamadas de IA.
- [x] 2.6 Atualizar `LinkedRecords`, seus links e estados; verificar tarefas opcionais, sessões reais, loading/erro/vazios e rótulos sem transformar registros recentes em totais globais.

## 3. Roadmaps e revisões

- [x] 3.1 Redesenhar lista paginada e conteúdo de `RoadmapsSection`, distinguindo roadmap/bloco/passo; verificar múltiplos roadmaps, loading, erro/retry, vazio e exclusão com confirmação/portal.
- [x] 3.2 Atualizar `RoadmapEditor` para criação/edição e prévias com campos agrupados e ações legíveis; verificar inclusão/exclusão/reordenação de blocos/passos, limites existentes e bloqueios do prefixo protegido.
- [x] 3.3 Estilizar parâmetros de geração, pendência/cancelamento e revisão/confirmar prévia; verificar parâmetros reais, foco em erros, falhas de IA, expiração e preservação de conteúdo sem persistência antecipada.
- [x] 3.4 Atualizar progresso e reordenação de pendentes em `RoadmapRevisionTools`; verificar checkboxes por teclado, prefixo protegido, atualização de progresso e funcionamento com IA desabilitada.
- [x] 3.5 Estilizar regeneração e prévias de revisão, seus avisos e ações; verificar edição/reordenação de sugestões, cancelamento, resposta tardia ignorada, conflito, expiração e confirmação existente.
- [x] 3.6 Atualizar histórico paginado, leitura de snapshot e prévia de restauração; verificar imutabilidade da leitura histórica, distinção da revisão ativa e restauração somente após confirmação, inclusive sem IA.

## 4. Auxiliares e regressão funcional

- [x] 4.1 Harmonizar `SubjectSelect` e `SubjectName` com estilos próprios isolados; verificar seleção opcional, seleção fora da página, loading/indisponibilidade, erro/retry e paginação em consumidores sem visita prévia a Matérias.
- [x] 4.2 Adaptar os testes `SubjectsPage.spec.tsx`, `RoadmapsSection.spec.tsx` e `RoadmapRevisionTools.spec.tsx` apenas conforme a apresentação exigir; verificar fluxos e requisições existentes, sem testes que apenas espelhem CSS nem mocks no runtime.
- [x] 4.3 Verificar integração com dashboard, shell, tarefas, Pomodoro e flashcards; confirmar links e preferências existentes, módulo desabilitado e ocultação de IA sem bloqueio dos fluxos manuais, sem redesenhar os módulos hospedeiros.

## 5. Validação e conclusão

- [x] 5.1 Inspecionar visualmente listagem, detalhe, formulários, plano, confirmações e cada fluxo de roadmaps em 320/375/768/1024/1440 px e temas claro/escuro; registrar comparação com Stitch, textos longos, vários blocos e ausência de overflow horizontal.
- [x] 5.2 Verificar teclado, nomes acessíveis, labels, foco inicial/retorno, anúncios de estados, contraste e movimento reduzido em página e portais; registrar evidência de que campos e ações continuam alcançáveis.
- [x] 5.3 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; registrar resultados e corrigir falhas atribuíveis à mudança, usando MySQL real em banco isolado e sem esconder falhas de configuração.
- [x] 5.4 Revisar o diff contra as restrições de `design.md` e validar `openspec validate update-subjects-from-stitch --strict`; verificar que backend, contratos, clients API e regras permanecem sem alterações e que toda a matriz de interfaces/estados foi coberta.
- [x] 5.5 Após todos os itens anteriores aprovados, finalizar `tasks.md`, adicionar somente arquivos/hunks desta mudança, revisar staged e executar `git diff --cached --check`; criar exatamente um commit `[update] atualizar visual do módulo de matérias` se houver diff e confirmar hash/arquivos, sem push, tag ou archive.
