# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD e git status, preservar alterações preexistentes e usar codex/refine-interface-navigation-and-creation quando necessário; verificar registro inicial e escopo dos arquivos.
- [x] 1.2 Revisar os pontos compartilhados com refine-auth-desktop-layout e os requisitos de preservação; registrar compatibilidade de altura desktop, feedback e Google branco antes de alterar auth/CSS.

## 2. Navegação persistente

- [x] 2.1 Unificar a instância privada no App e separar verificação de sessão de seleção de página em PrivatePage; verificar por teste de identidade DOM que header/sidebar e bootstrap não reiniciam a cada destino.
- [x] 2.2 Reutilizar navegação SPA para links suportados do shell, marca, avatar e atalhos internos, com pathname reativo; testar rota ativa, voltar/avançar, query/hash, clique modificado, acesso direto e módulo desativado.
- [x] 2.3 Preservar scroll/estado aplicável da sidebar e fechamento do Mais após seleção, com foco no conteúdo de destino; verificar desktop/mobile e mudança de breakpoint sem overlay residual.
- [x] 2.4 Verificar gates na entrada e expiração durante navegação, descarte de respostas obsoletas e limpeza por identidade/logout; testes não devem expor conteúdo antes da validação nem manter dados de outra sessão.

## 3. Movimento e saída

- [x] 3.1 Consumir origem landing uma vez e aplicar backInLeft ao modo correto de AccessPage; testar Entrar/Criar conta, returnTo, acesso direto, rerender e alternância de modo sem repetição.
- [x] 3.2 Aplicar fadeIn somente ao conteúdo principal por troca efetiva de destino; testar que sidebar/header não recebem animação e atualizações de dados/tema não a reiniciam.
- [x] 3.3 Coordenar logout único de shell/Conta com backOutLeft em paralelo à chamada real, guarda contra duplo clique, término/cancelamento e timeout; testar sucesso, resposta lenta, erro recuperável, animationend ausente e desmontagem sem cancelar logout.
- [x] 3.4 Integrar prefers-reduced-motion inicial e alterado durante movimento; verificar navegação imediata, sem atraso artificial nem espera por evento ausente e cleanup de listeners/timers.

## 4. Tema, botões e favicon

- [x] 4.1 Ajustar tokens dark e overrides de superfícies, incluindo sidebar, cards, campos e modais; medir contraste conforme application-theme e conferir que valores light e estados de feedback são preservados.
- [x] 4.2 Substituir transition-all e padronizar hover de Button e equivalentes em 500 ms com propriedades explícitas; inspecionar estilo computado de variantes e overrides nos dois temas, com foco, active, disabled, loading e movimento reduzido.
- [x] 4.3 Se o favicon fornecido estiver disponível, integrá-lo em public/index.html e verificar resposta válida no build servido e em rotas diretas; se ausente, registrar pendência explícita sem referência quebrada, sem afirmar que o favicon foi entregue.

## 5. Modal compartilhado e cadastros

- [x] 5.1 Compor modal compartilhado sobre Dialog/AlertDialog de packages/ui com título, ações e rolagem interna; testar nome acessível, foco inicial, trap, retorno ao acionador/fallback e 320 px.
- [x] 5.2 Centralizar dirty/descarte para Esc, Cancelar, fechar e outside quando permitido, e bloqueio durante envio; testar formulário limpo, alterações em campos/listas, confirmação recusada/aceita e acionamento duplo sem duplicar mutação.
- [x] 5.3 Adaptar criação em TasksPage ao padrão preservando edição compartilhada e associações; testes devem cobrir validação, erro, sucesso, refresh sem reload e retorno de foco.
- [x] 5.4 Converter criação de matérias em SubjectsPage preservando detalhes, campos e regras; testar cancelamento dirty, persistência, erro e atualização com paginação existente.
- [x] 5.5 Converter criação de baralho e card em FlashcardForms/FlashcardsPage sem alterar revisão, importação ou geração IA; testar contexto do baralho, campos, erros, sucesso e listagem sem reload.
- [x] 5.6 Converter criação de rotinas em RoutinesPage preservando slots, fuso e edição existente; testar validação, descarte de listas alteradas e sucesso/erro sem envio duplicado.
- [x] 5.7 Converter criação manual de roadmap em RoadmapsSection preservando editor, etapas, validações e fluxos IA/edição; testar salvamento, erro, descarte e coleção atualizada.

## 6. Validação integrada e conclusão local

- [x] 6.1 Validar em navegador real temas claro/escuro, 320 px e desktop, pouca altura, teclado, foco/contraste, sidebar com rolagem, navegação/histórico, logout e cada modal; registrar evidências e pendências reais, incluindo favicon se ausente.
- [x] 6.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build; registrar resultados e usar MySQL real em banco isolado nos testes de banco, sem ocultar falhas por mocks.
- [x] 6.3 Revisar deltas semanticamente, preservar requisitos e cenários posteriores e preparar snapshots locais e manifesto explícito conforme README; validar mudança e revisar diff/staged com git diff --cached --check, sem incluir arquivos alheios.
- [x] 6.4 Preparar e inspecionar a execução controlada de pnpm openspec:finish com nome, manifesto e mensagem definidos, verificando plano de sync, arquivos próprios e política de journal/retomada; a execução efetiva e a confirmação do hash/archive ocorrem após este checklist, conforme a seção abaixo.

## Conclusão controlada após o checklist

Executar `pnpm openspec:finish --change refine-interface-navigation-and-creation --manifest .openspec-local/refine-interface-navigation-and-creation-manifest.json --message "[update] refinar navegação e interface do Edutrack"` somente após checks aprovados. Confirmar archive, hash final único e arquivos. Sem tag/push. Em falha, registrar pendência e retomar o journal sem segundo commit. A preparação do comando não declara sua execução concluída.
