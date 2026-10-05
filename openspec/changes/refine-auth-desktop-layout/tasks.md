# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD e `git status` antes de editar, identificando alterações preexistentes; verificar o registro e delimitar arquivos/hunks desta mudança, preservando trabalhos alheios.
- [x] 1.2 Preparar a execução da web e fixtures de navegador para a matriz do design, medindo primeiro os estados mais altos em 1366×768; verificar dimensões efetivas da viewport, medidas de documento/regiões e capturas de ambos os temas, sem alterar lógica para alcançar estados.

## 2. Layout por altura e apresentação Google

- [x] 2.1 Refinar tokens locais de espaçamento, padding, dimensões e alinhamento de AuthLayout/auth.css com adaptação por altura desktop e fluxo natural expansível; verificar pior estado em 768/900/1080 de altura sem scroll interno, clipping, escala global ou início inacessível.
- [x] 2.2 Compactar features, ilustração e ornamentos do painel conforme altura, preservando marca, paleta e instruções úteis; verificar comparação visual nos dois temas e que somente decoração/repetição promocional pode ser omitida.
- [x] 2.3 Ajustar apresentação de login/cadastro, tabs, dicas, separador, links e feedback coexistente sem alterar handlers; verificar campos, mensagens e ações integrais no pior estado de acesso em 1366×768 e ausência de diff em regras de autenticação.
- [x] 2.4 Ajustar confirmação e recuperação request/code/password/done quando necessário para acomodação e refluxo; verificar status+erro, contador, instruções, dica de senha e ações completas sem modificar transições, foco inicial ou bloqueios atuais.
- [x] 2.5 Adicionar logo multicolorida Google local com origem documentada e estilo escopado de fundo branco/texto escuro/borda, incluindo hover/focus-visible/active e tema escuro; verificar logo e nome acessível único, estilos computados brancos e feedback perceptível nos dois modos e temas, com OAuth/href preservado.

## 3. Regressão de comportamento

- [x] 3.1 Executar `pnpm --filter @study-platform/web test src/features/auth/Auth.spec.tsx src/features/auth/EmailPages.spec.tsx src/features/auth/AuthFeedback.spec.tsx src/features/landing/AccessPage.spec.tsx`, acrescentando testes úteis somente onde faltar cobertura; verificar payloads/validações, tabs/query/campos, resultados ativos/pendentes, erro OAuth, retorno permitido e rejeição de retorno externo, sem enfraquecer assertions existentes.
- [x] 3.2 Verificar confirmação e recuperação com respostas controladas de UI: código inválido/expirado, reenvio/429/Retry-After, busy, mensagem genérica, contexto expirado, resultado incerto, reinício e sucesso confirmado; confirmar testes aprovados e que não há segredos em URL/storage, sucesso fictício ou alteração de auth-api/contratos/backend.

## 4. QA de layout e acessibilidade em navegador

- [x] 4.1 Validar login e cadastro nos dois temas em 1366×768, 1440×900 e 1920×1080 a 100%, com todos os estados/combinações da matriz do design, inclusive aviso+OAuth+erro; registrar medidas e capturas comprovando conteúdo/foco completos e ausência de scroll vertical/horizontal de documento e regiões internas.
- [x] 4.2 Validar confirmação nos mesmos temas/viewports a 100% com estado inicial, validação, envio/reenvio, erro coexistente, espera/429 e sucesso; registrar evidências integrais de mensagem, campo, contador e ações, sem scroll.
- [x] 4.3 Validar separadamente recuperação request, code, password e done nos mesmos temas/viewports a 100%, cobrindo todos os estados aplicáveis do design; registrar medidas/capturas integrais, inclusive status+erro, contexto expirado e resultado incerto, sem scroll.
- [x] 4.4 Repetir todas as telas/etapas e estados aplicáveis em 320×568, 375×667, 768×600 e 1366×600 nos dois temas; verificar ausência de overflow horizontal, scroll vertical disponível e conteúdo inteiro alcançável, sem ocultar excedentes.
- [x] 4.5 Repetir todas as telas/etapas e estados aplicáveis com zoom real de navegador de 200% nas três resoluções desktop, nos dois temas; registrar viewport efetiva e verificar refluxo, scroll vertical necessário, legibilidade e acesso ao início/fim, sem escala CSS ou corte.
- [x] 4.6 Exercitar feedback excepcional longo em cada fluxo nos dois temas (fixture de 1000 caracteres com trecho contínuo de 200); verificar quebra, scroll necessário e acesso integral a mensagens/ações sem overflow horizontal, incluindo status+erro coexistente.
- [x] 4.7 Percorrer todas as telas/etapas por Tab/Shift+Tab em ambas as cores, a 100% e 200%, operar tabs por setas e ativar controles por teclado; verificar rótulos, foco visível/desobstruído, foco no título nas transições, anúncios alert/status, bloqueios e preferência por movimento reduzido.
- [x] 4.8 Inspecionar Google em login/cadastro nos dois temas, em repouso/hover/foco/active por mouse e teclado; registrar estilos computados/capturas que provem fundo `rgb(255,255,255)`, texto escuro, logo fiel e borda/foco/interação perceptíveis sem mudar superfície ou destino.
- [x] 4.9 Consolidar evidências em relatório desta mudança com tema, viewport, zoom, tela/etapa/estado e resultado, distinguindo fixtures UI de integração real; verificar cobertura completa da matriz e ausência de dados sensíveis no relatório.

## 5. Qualidade e conclusão do apply

- [x] 5.1 Preparar configuração de teste e MySQL real com banco isolado conforme projeto para a suíte geral; verificar isolamento e conectividade sem exibir segredos ou substituir falhas de configuração por mocks.
- [ ] 5.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` na raiz e registrar resultados; verificar aprovação das quatro verificações, incluindo testes reais de banco. A exceção de suítes restritas da mudança anterior não se aplica; falhas impedem conclusão.
- [x] 5.3 Revisar diff final e relatório, confirmando escopo visual local, identidade, rotas, OAuth, retorno permitido, validações, bloqueios e contratos preservados; executar `openspec validate refine-auth-desktop-layout --strict` e marcar tarefas somente com verificações comprovadas.
- [ ] 5.4 Após todas as tarefas/verificações aprovadas, finalizar tasks.md, adicionar somente arquivos/hunks da mudança, revisar diff staged e executar `git diff --cached --check`; verificar exclusão de alterações preexistentes e inclusão da implementação e tasks final, sem `git add .`.
- [ ] 5.5 Criar exatamente um commit de conclusão `[update] refinar layout desktop de autenticação`, confirmar e informar hash e arquivos incluídos; verificar ausência de commit vazio, tag, SemVer, push ou archive. Apply pausado/com falhas não recebe commit de conclusão.
