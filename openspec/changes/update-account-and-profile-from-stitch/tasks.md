# Tasks

## 1. Preparação do apply

- [x] 1.1 Registrar branch, HEAD, status e diff preexistentes antes de editar; verificar que o baseline distingue trabalhos de Pomodoro/Progresso e esta mudança.
- [x] 1.2 Conferir que o inventário de `design.md` continua válido no checkout do apply e que o ZIP está disponível; registrar somente diferenças concretas, sem ampliar contratos ou funcionalidades.

## 2. Estrutura visual e identidade

- [x] 2.1 Criar cabeçalho, resumo de identidade real e navegação por âncoras em `/conta`; verificar destinos existentes e preservação de drafts/etapas ao navegar por teclado.
- [x] 2.2 Aplicar layout desktop de coluna auxiliar/cards e navegação empilhada no mobile com estilos escopados e tokens; verificar ausência de overflow em 320, 390, 768 e 1280 px.
- [x] 2.3 Renovar nome, e-mail, verificação e meios de entrada com componentes existentes; verificar que dados vêm da API, nome salvo atualiza o shell e campos inexistentes no Stitch não aparecem.
- [x] 2.4 Renovar foto, fallback, input, ajuda, preview e ações salvar/remover; verificar upload de bytes/MIME, limite 2 MiB, tipos e dimensões atuais, object URL e estados de erro/disabled com testes de perfil.

## 3. Preferências e aparência

- [x] 3.1 Atualizar controles reais de tarefas/matérias/flashcards/IA e descrições; verificar persistência por ação, resposta confirmada, evento/callback e recusa do último módulo ativo nos testes UI relacionados.
- [x] 3.2 Aplicar o padrão visual ao `StudyTimeZoneSection`, incluindo loading/retry, campo IANA, sugestão e confirmação; verificar que sugestão não salva automaticamente e falha conserva estado confirmado em teste focado.
- [x] 3.3 Integrar controle claro/escuro usando `setTheme`/`useTheme` existentes; verificar atualização imediata, escolha persistida e aparência de todos os controles sem novos valores, endpoints ou storage.

## 4. Segurança e conta

- [x] 4.1 Renovar subfluxos da troca de e-mail, incluindo prova local/Google, novo endereço, código, reenvio e identidade expirada; verificar mesmas chamadas, mensagens, limites, cooldown e retorno ao login em testes focados de perfil.
- [x] 4.2 Renovar alteração de senha local e orientação Google; verificar mesmos campos, política 12–128, erros e reentrada, sem formulário local em conta Google exclusiva.
- [x] 4.3 Integrar visualmente vínculo Google e retornos `linked/failed/conflict` da área de conta preservando handlers do shell; verificar condicional, loading, erro, chamada e identidade atual em testes UI de conta.
- [x] 4.4 Adaptar logout à apresentação da conta mantendo `leave`, sessão e destino existentes; verificar submissão, falha/retry e sucesso nos testes de saída relacionados, sem confirmação obrigatória nova.
- [x] 4.5 Harmonizar feedback de loading/salvamento/sucesso/erro de perfil, fuso, Google e sessão; verificar visibilidade, anúncios sem duplicação e ausência de sucesso antes da resposta real. Se overlay for necessário, verificar foco/Escape/retorno e ações existentes.

## 5. Validação e conclusão

- [x] 5.1 Atualizar e executar apenas testes UI de `ProfilePage.spec.tsx` e controles diretamente modificados; adicionar casos focados para navegação, dados reais via adapter, falhas/loading/disabled, temas, fuso e integração da conta, usando filtros `-t` quando houver testes misturados com módulos fora do escopo. Registrar comandos e resultados sem suíte geral/backend/banco.
- [x] 5.2 Executar `pnpm lint`, `pnpm typecheck` e `pnpm build`; registrar resultados e separar falhas preexistentes sem alterar outros módulos ou contratos para contorná-las.
- [x] 5.3 Validar no navegador em claro/escuro e 320/390/768/1280 px: texto longo, avatar, formulários, navegação, foco/teclado, movimento reduzido, hover/selected/disabled e feedback; registrar screenshots e resultados em `validation.md`.
- [x] 5.4 Validar com APIs existentes e conta apropriada nome, foto, preferências, fuso, segurança, Google e saída conforme disponíveis; registrar evidências e limitações de OAuth/API sem dados fictícios de produto ou mudanças de backend.
- [x] 5.5 Revisar diff final contra o baseline e confirmar escopo visual, manutenção dos campos/regras/contratos e ausência de funcionalidades inventadas; finalizar `tasks.md` somente para itens efetivamente concluídos.
- [x] 5.6 Após todas as tarefas e verificações aprovadas, stage somente arquivos/hunks da mudança incluindo `tasks.md`, revisar diff staged e executar `git diff --cached --check`; criar exatamente um commit `[update] atualizar visual de perfil e conta`, conferir hash/arquivos e informar, sem commit vazio, push, tag ou archive.
