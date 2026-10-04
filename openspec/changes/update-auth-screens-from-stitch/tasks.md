# Tasks

## 1. Preparação e composição visual

- [x] 1.1 Registrar branch, HEAD e estado Git ao iniciar apply, identificando alterações preexistentes no dashboard e OpenSpec; verificar que nenhum arquivo/hunk alheio será incluído.
- [x] 1.2 Implementar composição compartilhada de autenticação com painel contextual desktop e formulário em coluna no mobile, reutilizando UI e ícones existentes; verificar renderização sem inserir novas dependências ou lógica de sessão.
- [x] 1.3 Aplicar tokens, espaçamento, tipografia, cards e estilos escopados à autenticação; verificar temas claro/escuro e ausência de mudanças em seletores privados/de conta ou landing pública.

## 2. Telas e etapas existentes

- [x] 2.1 Atualizar login e cadastro em AccessPage mantendo tabs, query, campos editados, validações e payload `{email,password}`; verificar cenários de AccessPage.spec.tsx e ausência de campos acadêmicos ou política de oito caracteres.
- [x] 2.2 Adaptar posição do Google, separadores, links de recuperação e retorno à landing; verificar URL OAuth, returnTo permitido, erros de Google e navegação existente nos testes selecionados.
- [x] 2.3 Atualizar confirmação de e-mail com motivos visuais de envelope/código; verificar seis dígitos, foco inicial, mensagens, sucesso orientando login, bloqueio busy e contador de reenvio real em EmailPages.spec.tsx.
- [x] 2.4 Atualizar as etapas request e code da recuperação na mesma rota; verificar envio `{email}`, validação `{email,code}`, reenvio e mensagem genérica da API, sem afirmação de conta existente ou link fictício.
- [x] 2.5 Atualizar as etapas password e done; verificar senha 12–128, envio `{password}`, grant inválido, mensagem de resultado incerto, reinício de solicitação e sucesso apenas após resposta confirmada.
- [x] 2.6 Revisar textos, links, ícones e decoração de todas as telas; verificar ausência de Microsoft, lembrar dispositivo, consentimentos novos, suporte fictício, métricas inventadas, endosso institucional, MFA, criptografia ponta a ponta e ações sem integração.

## 3. Validação restrita à UI afetada

- [x] 3.1 Atualizar testes front-end afetados sem enfraquecer assertions de comportamento; verificar renderização, labels, campos inválidos, credenciais inválidas, conflito de e-mail, loading e botões bloqueados, mensagens API, erro de rede, código/grant inválido e sucesso nas três suítes auth/access, acrescentando cobertura útil apenas onde faltar.
- [x] 3.2 Executar `pnpm --filter @study-platform/web test src/features/auth/Auth.spec.tsx src/features/auth/EmailPages.spec.tsx src/features/landing/AccessPage.spec.tsx` e somente novos testes de UI auth se existirem; registrar resultado sem executar suíte completa, backend, banco ou módulos não alterados.
- [x] 3.3 Validar visualmente login, cadastro, confirmação e request/code/password/done em 320, 375, 768 e 1440 px nos dois temas; registrar evidências de ausência de overflow/corte, contraste, mensagens longas, foco, teclado, zoom e movimento reduzido.
- [x] 3.4 Executar `pnpm --filter @study-platform/web lint`, `pnpm --filter @study-platform/web typecheck` e `pnpm --filter @study-platform/web build`; registrar resultados e atribuir eventuais falhas preexistentes sem modificar módulos alheios para escondê-las.
- [x] 3.5 Revisar diff final comprovando preservação de rotas, auth-api, contratos, backend, sessão e conteúdo privado; confirmar que os cenários de navegação, retorno seguro e ausência de segredos na URL continuam cobertos pelos testes selecionados.

## 4. Conclusão do apply

- [x] 4.1 Após concluir tarefas e verificações, atualizar tasks.md, adicionar somente arquivos/hunks desta mudança, revisar diff staged e executar `git diff --cached --check`; verificar exclusão das alterações preexistentes.
- [x] 4.2 Criar exatamente um commit `[update] atualizar visual das telas de autenticação` incluindo implementação e tasks.md final; confirmar hash e arquivos incluídos, sem commit vazio, push, tag ou archive. Se apply estiver pausado ou com falhas, não criar commit de conclusão.
