# Tasks

## 1. Pré-requisitos, dados e contratos

- [x] 1.1 Confirmar que `add-user-authentication` e `add-email-verification-and-recovery` estão implementadas e que `/conta`, sessões, credenciais e códigos funcionam; verificar `openspec status`, migrations e testes desses fluxos antes de editar a conta.
- [x] 1.2 Criar migrations versionadas para nome e foto na própria tabela `users`, reservas de troca de e-mail e `user_preferences` com valores padrão/backfill; verificar execução e reexecução no MySQL isolado, mantendo `synchronize: false`.
- [x] 1.3 Adicionar schemas Zod e tipos públicos para perfil, solicitações de alteração e preferências em `packages/contracts`; verificar entradas inválidas, campos desconhecidos e respostas em testes de contrato.

## 2. Perfil e imagem

- [x] 2.1 Implementar leitura e atualização do próprio nome exibido, com normalização e validação de 2–60 caracteres sem unicidade; verificar nomes repetidos, inválidos e isolamento entre contas em testes HTTP/MySQL.
- [x] 2.2 Implementar upload autenticado de JPEG, PNG e WebP com limite de 2 MiB, validação de bytes/dimensões, rejeição de animação e reencodificação estática; verificar arquivos válidos, SVG, corrupção, tipo falso, excesso de bytes/pixels e preservação da foto anterior após erro.
- [x] 2.3 Implementar leitura privada da foto e remoção dos bytes na linha de `users`, sem selecionar o BLOB em consultas usuais; verificar resposta binária, headers seguros, avatar padrão e ausência de acesso a foto de outra conta.

## 3. Dados sensíveis

- [x] 3.1 Implementar prova recente de identidade para troca de e-mail por senha local ou novo OIDC com o mesmo `sub` vinculado à sessão; verificar rejeição de senha errada, sessão diferente, outro `sub` e prova vencida.
- [x] 3.2 Implementar solicitação e reenvio de código para novo e-mail, mantendo o antigo ativo e reservando endereço canônico disponível; verificar expiração, 60 segundos, três emissões por hora, colisão entre contas e liberação da reserva vencida.
- [x] 3.3 Implementar confirmação transacional do novo e-mail com cinco tentativas, invalidação de códigos/recuperações pendentes, revogação de sessões e aviso ao endereço antigo; verificar novo login, acesso Google pelo mesmo `sub`, código inválido e corrida por endereço.
- [x] 3.4 Implementar alteração de senha somente para credencial local, exigindo senha atual e política existente, com revogação de sessões e recuperações; verificar senha antiga/nova, erro de senha atual e que conta exclusiva do Google não ganha senha local.

## 4. Preferências e autorização

- [x] 4.1 Implementar leitura e atualização parcial das quatro preferências por conta, sem sobrescrever outros toggles; verificar valores iniciais, persistência após login, alterações concorrentes e isolamento entre usuários em MySQL real.
- [x] 4.2 Implementar verificação de preferência no servidor para módulos e IA, com falha fechada se faltar registro; verificar `MODULE_DISABLED` e `AI_DISABLED` antes de consultar dados ou invocar provedor usando rotas de integração de teste, sem criar módulos de produto vazios.
- [x] 4.3 Integrar ao catálogo de navegação e ao estado de página privada a ocultação de módulos desligados e o caminho para reativação; verificar troca de estado em outra aba, URL direta e exibição distinta de funcionalidades ainda não entregues.
- [x] 4.4 Registrar o contrato obrigatório para futuras rotas de tarefas, matérias, flashcards, widgets do dashboard e chamadas de IA, incluindo preservação de dados, consulta da preferência em cada ação e uso manual; verificar que o checklist de integração cobre leitura, escrita, navegação, widget e chamada ao provedor sem adicionar módulos vazios.

- [x] 4.5 Exigir ao menos um módulo de estudo ativo entre tarefas, matérias e flashcards, sem contar IA, com validação na interface e no servidor em transação; verificar recusa do último módulo, preservação de flags e desativações concorrentes com MySQL real.

## 5. Página de conta e integração

- [x] 5.1 Expandir `/conta` com foto, nome exibido e estados de carregamento, erro e sucesso, mantendo foto apenas na rota binária; verificar prévia, substituição, remoção e funcionamento em 320 px.
- [x] 5.2 Adicionar interface de troca de e-mail por prova recente e código e de alteração de senha apenas quando existir credencial local; verificar conta local, conta exclusiva do Google, expiração, reenvio e retorno ao login após alteração.
- [x] 5.3 Adicionar toggles independentes de tarefas, matérias, flashcards e IA, com indicação de indisponibilidade das funções ainda não entregues; verificar teclado, rótulos, mensagens anunciadas, falha de rede e que **Aprimorar com IA** não aparece com IA desativada onde esse controle existir.
- [x] 5.4 Verificar com testes HTTP/MySQL e interface que desligar e reativar um módulo não altera seus dados quando houver módulo implementado; enquanto não houver, verificar que a autorização e o catálogo usam as preferências e que nenhuma rota/widget fictício foi criado.

## 6. Verificação de conclusão

- [x] 6.1 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` com MySQL real em `TEST_DB_NAME`, `pnpm build` e `openspec validate add-profile-and-module-preferences --strict`; verificar saídas sem erro antes de concluir o apply.
- [x] 6.2 Revisar somente arquivos e hunks desta mudança, incluindo `tasks.md` final, executar `git diff --cached --check` e criar o commit único no formato de `AGENTS.md`; verificar hash e lista dos arquivos incluídos.
