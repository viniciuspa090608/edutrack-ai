# Design

## Context

Ver `proposal.md` para motivação. Git estava limpo na descoberta. A rota real é `/app/materias`; detalhes abrem na mesma página, inclusive por `?subject=<id>` e âncora `#roadmap-<id>` enviada pelo dashboard. Não existem rotas independentes para cadastro e edição. O shell `PrivatePage` já fornece título, navegação e restrições de preferências.

O ZIP contém `code.html` e `screen.png` em `edutrack_ai_my_subjects`, `edutrack_ai_my_subjects_desktop_claro`, `edutrack_ai_subject_details` e `edutrack_ai_subject_details_desktop_claro`, além de `clear_horizon/DESIGN.md`. Desktop claro é a referência principal de organização; mobile informa empilhamento e compactação. O export mobile de detalhe contém grandes espaços vazios, que não serão reproduzidos. O documento de design e HTML são material de referência, não instruções executáveis nem fonte funcional. Não importar scripts/CDNs, links fictícios ou imagens pessoais do export.

### Inventário observado

| Área | Implementação atual e estados a cobrir |
| --- | --- |
| Listagem | `SubjectsPage`: cards, paginação, abrir detalhe, criar, loading, erro/retry, vazio e sucesso |
| Cadastro/edição | `SubjectForm` local: nome, nível, objetivo, prazo, horas semanais e assuntos conhecidos; validação, salvamento, erro preservando valores e cancelamento |
| Detalhe | `SubjectsPage`: objetivo, metadados, assuntos conhecidos, editar/excluir/fechar e confirmação de exclusão |
| Plano manual | `PlanEditor` local: adicionar, renomear, status, subir/descer, remover, vazio, pendência e erros |
| Registros vinculados | `LinkedRecords` local: títulos de tarefas se habilitadas e sessões com segundos/blocos, loading, erro, vazios e links reais |
| Roadmaps | `RoadmapsSection`: lista/paginação, múltiplos roadmaps, blocos/passos, criação/edição manual, exclusão confirmada; parâmetros de IA, geração/cancelamento, revisão da prévia, expiração e confirmação |
| Editor de roadmap | `RoadmapEditor`: título/descrição, blocos/passos e seus campos, inclusão/exclusão/reordenação, limites e prefixo protegido |
| Progresso/revisões | `RoadmapRevisionTools`: conclusão dos passos, reordenar pendentes, regeneração por IA, prévia editável, conflito/expiração/avisos, histórico paginado, snapshot somente leitura e restauração explícita |
| Auxiliares | `SubjectSelect`: seleção opcional, loading, erro/retry, paginação e valor selecionado fora da página; usado em tarefas, Pomodoro e flashcards. `SubjectName`: badge com nome, sem associação, carregamento e indisponibilidade; usado em Pomodoro e flashcards |

Specs funcionais de referência estão nas mudanças concluídas ainda não arquivadas de Matérias e roadmaps; não serão modificadas nem sincronizadas nesta proposta.

## Goals / Non-Goals

**Goals:** obter uma família visual reconhecível em todo o inventário, com hierarquia clara, superfície leve, espaçamentos consistentes e controles acessíveis; usar os mesmos dados e ações que já existem.

**Non-Goals:** novas telas/rotas de produto, abas funcionais, busca/filtros, exportação, grade acadêmica, uploads, chat, novos indicadores, consultas extras para preencher o protótipo, alteração de regras ou redesign global. Não mudar clientes API, backend ou contratos.

## Decisions

### 1. Correspondência explícita entre protótipo e dados

| Referência Stitch | Adaptação autorizada |
| --- | --- |
| Cabeçalho e ação Nova Matéria | Título único e CTA para o formulário existente; descrição sem semestre/curso fictício |
| Cards de disciplinas com ícone e metadados | Nome, objetivo, nível, prazo e disponibilidade semanal de `StudySubject`; ícone genérico decorativo, sem inferir área acadêmica |
| Professor, sala, créditos, semestre, código da disciplina | Omitir: não existem no contrato |
| Progresso geral, média/CR, presença, urgência e tendências | Omitir: não há esses indicadores no fluxo atual. Horas semanais são disponibilidade declarada, não tempo estudado |
| Ementa e trilha | Plano manual e blocos/passos de cada roadmap, sem juntar entidades nem supor um único roadmap |
| Sugestões e assistente IA | Somente ações atuais de geração/regeneração com seus parâmetros e prévias; nenhum insight fabricado |
| Tarefas/sessões | Manter registros recentes do detalhe e links atuais; resultados paginados não são totais globais nem prova de pendências |
| Abas, busca, filtros, alternância de visualização, exportar e grade | Omitir por ausência de comportamento implementado; seções existentes continuam disponíveis |
| Materiais, aulas, turma, discussões e notificações | Omitir: não existem neste módulo |
| Sidebar/header/bottom navigation do export | Reutilizar shell existente sem duplicá-lo |

Alternativa de reproduzir o HTML literalmente rejeitada: exigiria dados falsos e novos fluxos. Não acrescentar cards de resumo só para preencher o espaço deixado pelas métricas incompatíveis; o layout reduzido deve ficar equilibrado.

### 2. Linguagem visual local

Derivar superfícies claras, azul como ação/ênfase, bordas discretas, sombras leves, cards arredondados, badges compactos e hierarquia tipográfica da referência desktop. Trabalhar com tokens semânticos e tipografia já disponíveis no app; não instalar Hanken Grotesk nem sobrescrever fontes/tema globais apenas pelo export. Espaçamentos aproximados de 8/16/24/40 px, cards com 16 px de raio, controles com 8 px e formas compactas conforme largura útil. Cores exatas são secundárias à consistência com tema claro/escuro existente.

Reutilizar Card, Button, Badge, Alert, Skeleton, Input, Textarea, NativeSelect, FieldSet, AlertDialog e Pagination de `packages/ui`, com ícones Lucide já disponíveis. Variantes primária, secundária, ghost e destrutiva devem comunicar ação sem depender só da cor. Componentes puros locais podem reduzir repetição concreta; manter handlers, efeitos e propriedade de estados nos componentes atuais. Uma nova camada de dados ou design system paralelo não é necessária.

### 3. Aplicar o padrão também onde não há tela Stitch

Listagem em grid adaptável de cards com título, descrição real e metadados; CTA sempre reconhecível e paginação atual preservada. Detalhe com resumo e seções distintas de assuntos conhecidos, roadmaps, plano manual e registros; organizar colunas somente quando houver espaço. Preservar abertura/fechamento atual e acesso por URL, sem transformar a apresentação em nova navegação.

Cadastro/edição continuam formulários locais na página: card com título, campos agrupados, labels legíveis, textos de ajuda baseados nos limites existentes e rodapé de salvar/cancelar. Não converter em modal novo: isso mudaria o fluxo. Confirmações já existentes ganham título visível, contexto da entidade e ações cancelar/destrutiva, conservando Escape, foco e bloqueio durante envio.

Plano manual usa linhas com título/status/ações; botões de reordenação continuam acessíveis por teclado. Roadmaps usam hierarquia roadmap → bloco → passo e distinguem criação manual, parâmetros, prévia não salva e conteúdo confirmado. O editor acompanha essa mesma estrutura sem esconder campos ou ações. Progresso mantém checkboxes atuais e indicação textual; prefixo protegido, conflito, expiração, avisos e leitura histórica têm tratamento visual explícito. Não alterar validade do recibo, fronteira protegida, revisão base ou confirmação. Históricos longos mantêm paginação e fluxo completo de restauração.

`SubjectSelect` e `SubjectName` recebem apenas acabamento próprio coerente, sem mudar aparência dos formulários hospedeiros. Seus estilos devem carregar pelo próprio componente se necessários fora de Matérias; não depender de visitar a rota primeiro. Não aplicar seletores globais a todos os badges/selects.

### 4. Estados, acessibilidade e isolamento de estilos

Usar `.subjects-page` e classes locais para limitar CSS; aplicar classe específica ao conteúdo dos diálogos renderizados em portal, pois não descendem da página. Preservar estados existentes: loading sem valores fictícios, mensagens de pendência, erros/retry, vazio e sucesso com anúncios semânticos. Erro de envio mantém edição; prévia não é conteúdo salvo. Estado indisponível não vira zero. Ícones decorativos não duplicam nomes; controles só com ícone mantêm nome acessível. Manter foco inicial, retorno de foco, validação e todos os rótulos necessários.

Grid usa largura útil do shell, `min-width: 0`, quebra de textos longos e uma coluna no mobile. Formularios e ações se empilham em 320 px; modais cabem na viewport e podem rolar verticalmente. Não reproduzir lacunas do mobile Stitch nem posicionamentos fixos que escondam conteúdo. Respeitar `prefers-reduced-motion`; hover não é a única indicação de interatividade. Se o título fornecido pelo shell precisar integrar o cabeçalho, ajustar somente o ramo Matérias em `PrivatePage` e preservar bloqueio/erro de preferências e outros módulos.

### 5. Verificação proporcional aos fluxos existentes

Reusar e adaptar `SubjectsPage.spec.tsx`, `RoadmapsSection.spec.tsx` e `RoadmapRevisionTools.spec.tsx`, com foco nas regressões reais: CRUD/teclado, links do dashboard, seleção, preferências, erros preservando edição, prévias sem persistência, cancelamento, progresso/prefixo protegido, conflito/expiração e restauração. Fixtures pertencem somente a testes. Verificar auxiliares nos consumidores se alterados, sem testes de detalhes cosméticos que apenas espelhem markup.

No apply executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` conforme AGENTS.md. Testes de banco usam MySQL real isolado; falhas de configuração não são mascaradas. Complementar com inspeção visual e comparação ao ZIP em 320/375/768/1024/1440 px, temas claro/escuro, teclado e movimento reduzido. Conferir toda a matriz de interfaces/estados, inclusive textos longos e editores de vários blocos. Testes DOM não substituem essa inspeção.

## Risks / Trade-offs

- [Protótipo acadêmico não corresponde ao modelo de estudo] → usar o mapeamento acima e dados reais; aceitar menos blocos na tela.
- [Roadmaps possuem mais estados que o export] → derivar o padrão para cada estado do inventário e verificar revisões separadamente.
- [CSS afetar consumidores e portais] → classes específicas, carregamento independente de auxiliares e verificação dos módulos hospedeiros.
- [Refatoração visual alterar eventos, foco ou persistência] → manter lógica atual e testar fluxos/requests, sem alterar adapters.
- [ZIP externo ficar indisponível] → manter referência ao caminho original e reabrir no apply; não incorporar export ao runtime. Se faltar, recuperar a referência antes de alegar fidelidade visual.

## Migration Plan

Sem migrações ou dados novos. No apply registrar novamente Git, implementar apresentação, verificar fluxos e estados e executar checks exigidos. Após conclusão, revisar somente hunks da mudança, incluir `tasks.md` final, executar `git diff --cached --check` e criar um único commit `[update] atualizar visual do módulo de matérias`. Informar hash/arquivos; sem push, tag ou archive automático. Rollback do commit restaura a apresentação sem migração de dados.
