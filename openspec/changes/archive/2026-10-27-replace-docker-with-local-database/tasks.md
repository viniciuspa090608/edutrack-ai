# Tasks

## 1. Baseline e ambiente local

- [x] 1.1 Registrar `git status` e diffs iniciais no apply, incluindo alterações preexistentes nos arquivos alvo; verificar que o registro permite separar hunks da mudança.
- [x] 1.2 Atualizar `.env.example` para `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, senha vazia e bancos distintos, removendo o comentário `pnpm mail:up`; verificar que nenhuma credencial real foi incluída.
- [x] 1.3 Ajustar somente variáveis DB do `.env` privado com a configuração fornecida, preservando outras credenciais; confirmar que o arquivo é ignorado pelo Git e testar conexão sem imprimir segredos. Não alterar a senha do servidor automaticamente.

## 2. Preparação sem containers e remoções

- [x] 2.1 Atualizar README com MySQL 8.0.46 local autorizado e MySQL 8.4 no CI, conexão por prompt de senha, SQL explícito para os dois bancos e permissões CREATE/DROP dos bancos temporários; verificar os passos com MySQL real sem modificar dados de desenvolvimento existentes.
- [x] 2.2 Documentar instalação/execução nativa do Mailpit nas portas 1025/8025 e alternativa SMTP configurada, preservando worker e chaves; verificar uma mensagem capturada na caixa local com worker ativo.
- [x] 2.3 Remover `db:up`, `mail:up` e referências `compose.yaml` em lint/format, preservando comandos de migrations; verificar scripts resultantes e ausência de chamadas Docker ativas.
- [x] 2.4 Confirmar novamente que Compose serve MySQL e Mailpit e que o init script somente cria banco de teste, então remover `compose.yaml` e `docker/mysql-init.sh`; verificar que todas as funções têm substituição documentada e que nenhum volume/dado ou estrutura de persistência foi removido.

## 3. Integração contínua

- [x] 3.1 Substituir `services.mysql` por provisionamento nativo de MySQL compatível com 8.4 em runner Ubuntu fixado, com credencial efêmera protegida, porta 3306, bancos/permissões de teste e espera limitada; verificar sintaxe do workflow, versão instalada e conexão autenticada sem containers.
- [x] 3.2 Preservar instalação com lockfile imutável e lint/typecheck/test/build; verificar execução real do pipeline quando runner estiver acessível e registrar claramente qualquer verificação remota indisponível, sem declará-la aprovada.

## 4. Verificação e conclusão

- [x] 4.0 Corrigir fixtures de reviews, analytics e study-progress conforme autorização do usuário, alinhando datas ao relógio dos cenários sem modificar produção; verificar que os 23 testes afetados passam com MySQL real e limitar a execução jsdom a dois workers sem alterar deadlines, verificando a suíte web completa.

- [x] 4.1 Executar `pnpm db:migration:show` e `pnpm db:migration:run` no MySQL local, repetindo execução para confirmar ausência de reaplicação; verificar API pronta e `/health`, mantendo `synchronize: false` e migrations/entities/repositories intactos.
- [x] 4.2 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`; confirmar sucesso com MySQL real e bancos isolados, sem mocks que ocultem falhas de configuração.
- [x] 4.3 Revisar diff e buscar referências Docker em scripts, exemplos, documentação ativa e CI; confirmar que referências remanescentes são somente explicativas ou históricas e que não há senha real versionada nem mudanças de regras de negócio.
- [x] 4.4 Atualizar este checklist com evidências e validar `openspec validate replace-docker-with-local-database --strict`; após todas as verificações aprovadas, selecionar somente arquivos/hunks desta mudança, revisar staged e executar `git diff --cached --check`, criando exatamente um commit `[update] substituir Docker por serviços locais`; confirmar hash e arquivos incluídos, sem commit vazio, tag, push ou archive.

## Evidências do apply (2026-10-03)

- Baseline salvo em `%TEMP%/edutrack-local-db-baseline`: status, patch completo e cópias dos arquivos alvo. O index inicial estava vazio. Alterações preexistentes de SMTP, `dev:email` e documentação foram preservadas no working tree e excluídas do staged usando versões selecionadas de HEAD. Demais mudanças OpenSpec preexistentes não foram editadas.
- Usuário autorizou MySQL 8.0.46 local, mantendo 8.4 no CI, e posteriormente autorizou corrigir fixtures. Conexão autenticada, bancos de desenvolvimento/teste distintos e criação/remoção de banco temporário passaram. `.env` permanece ignorado e nenhum segredo foi versionado.
- Migrations: 18 aplicadas; repetição: 0 aplicadas. API compilada respondeu `/health` com 200. Worker entregou mensagem de cadastro ao Mailpit nativo v1.31.4 em banco temporário isolado; processos de verificação e banco desse smoke foram removidos.
- Fixtures corrigidas sem alterar produção: estado inicial validado antes de alinhar datas ao relógio controlado, reset avança o relógio até o vencimento persistido, cobertura de analytics preparada por cenário. Os 23 testes afetados passaram. Execuções completas confirmaram 189/189 testes da API.
- A concorrência padrão da web causou timeouts locais em cenários diferentes; a suíte completa passou com dois workers. A configuração jsdom agora limita workers a 2, mantendo os prazos e todos os testes originais.
- Verificação final pelos comandos padrão: `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passaram. Testes: contratos 37/37, API 189/189 e web 126/126, total 352. O build mantém aviso de tamanho de bundle sem falha.
- CI: provisionamento nativo entregue com pacotes oficiais MySQL 8.4 em Ubuntu 24.04, espera limitada, credencial efêmera mascarada, root bloqueado e probe de permissões CREATE/DROP/TRIGGER. YAML parseado, Bash validado com `bash -n`, checksum do pacote server-core 8.4.11 e caminhos do binário/plugins verificados. Verificações de versão instalada e autenticação estão implementadas no workflow. Execução real no runner não foi realizada: não há remote configurado ou runner Ubuntu acessível; essa limitação permanece explicitamente registrada conforme 3.2, sem declarar aprovação remota.
- Nenhuma alteração de migrations, entities, repositories ou regras de negócio. Busca em scripts, exemplo, documentação ativa e CI encontrou somente referências explicativas a Docker no README, sem comandos ativos. Compose e init foram removidos; volumes e dados antigos foram preservados.
- `openspec validate replace-docker-with-local-database --strict` passou. Diff staged revisado e `git diff --cached --check` aprovado antes do commit único de conclusão, incluindo este checklist. Hash e arquivos são confirmados após o commit e informados ao usuário. Não há tag, push ou archive.
