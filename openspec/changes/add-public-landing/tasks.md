# Tasks

## 1. Rotas e dependência visual

- [x] 1.1 Registrar `lucide-react` em `apps/web` e atualizar o lockfile; verificar que `pnpm install --frozen-lockfile` conclui sem divergências.
- [x] 1.2 Extrair a página técnica atual para `features/system` e selecionar `/status` em `App`; verificar por teste que os estados de health check continuam acessíveis nessa rota.
- [x] 1.3 Criar a seleção de `/` e `/acesso`, com fallback simples para caminho desconhecido; verificar por testes de renderização que cada URL mostra a tela correta.

## 2. Conteúdo público

- [x] 2.1 Montar hero, seção **Funcionalidades**, seção **Tecnologias**, convite final e rodapé da EduTrack; verificar por teste que títulos, recursos planejados e CTAs aparecem em `/` sem chamada à API.
- [x] 2.2 Implementar header fixo com links de seção no desktop e compensação de rolagem; verificar no navegador que o header permanece visível e que os títulos de destino não ficam encobertos.
- [x] 2.3 Implementar menu hambúrguer mobile com links internos, `aria-expanded`, fechamento por seleção/Escape e retorno de foco; verificar por testes de interação via teclado e inspeção visual que fora do menu aparecem somente CTA e botão de menu.
- [x] 2.4 Criar `/acesso` com aviso **Em breve** e retorno à landing; verificar que todos os CTAs chegam à página sem apresentar formulário de autenticação.
- [x] 2.5 Ajustar título e descrição HTML da EduTrack e documentar no README o fallback de rotas para `index.html`; verificar metadados no navegador e abertura direta de `/acesso` e `/status` no preview local.

## 3. Carrossel e responsividade

- [x] 3.1 Criar pelo menos três ilustrações SVG locais originais para slides e registrar texto alternativo e descrição curta para cada um; verificar que todas as imagens carregam sem requisição a domínio externo.
- [x] 3.2 Implementar slide ativo, avanço automático cíclico, controles anterior/próximo e indicadores rotulados; verificar com teste de temporizador que há um único slide ativo, avanço e retorno ao primeiro.
- [x] 3.3 Pausar o avanço no hover, foco e documento oculto; desativar avanço automático com `prefers-reduced-motion` mantendo controles manuais; verificar os quatro comportamentos em testes de interação.
- [x] 3.4 Aplicar estilos mobile-first, foco visível, transições discretas e ícones Lucide; verificar visualmente a 320 px e no desktop que não há rolagem horizontal, sobreposição do header ou controles inacessíveis.

## 4. Verificações finais

- [x] 4.1 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; verificar saída com código zero para os quatro comandos.
- [x] 4.2 Executar `openspec validate add-public-landing --strict` e conferir manualmente as rotas `/`, `/acesso` e `/status`; verificar validação sem erros e todos os cenários da spec atendidos.
