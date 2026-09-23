# Instruções do projeto

## Versionamento de mudanças OpenSpec

- Ao iniciar um apply, registre o estado do Git e identifique alterações preexistentes.
- Conclua as tarefas da mudança e execute as verificações exigidas antes de criar o commit de conclusão. Um apply pausado ou com falhas não recebe commit de conclusão.
- Crie exatamente um commit Git por mudança OpenSpec concluída, incluindo a implementação e o `tasks.md` final. Se um apply já concluído não produzir novo diff, não crie commit vazio.
- Adicione somente arquivos ou hunks da mudança aplicada. Preserve alterações preexistentes e não use `git add .` para capturar todo o working tree.
- Revise o diff staged e execute `git diff --cached --check` antes do commit.
- Use a mensagem `Apply OpenSpec change: <nome-da-mudança>`. Após o commit, confirme e informe o hash e os arquivos incluídos.
- Não crie tag, versão SemVer ou push como parte desta convenção. Arquivar uma mudança OpenSpec requer uma ação separada.

## Arquitetura da plataforma

- O monorepo usa pnpm workspaces e TypeScript estrito. `apps/web` contém a interface React; `apps/api`, a API Express; `packages/contracts`, schemas e tipos públicos; `packages/ui`, componentes visuais compartilhados; `packages/config`, configurações de ferramentas.
- Pacotes compartilhados não importam código de `apps/*`. `packages/contracts` não depende de React, Express ou TypeORM. A web não acessa entidades nem repositórios da API.
- Na API, controllers tratam HTTP, services contêm regras de negócio e repositories persistem dados. Um módulo não acessa repositories internos de outro módulo; integre por contratos públicos ou eventos internos quando houver um caso concreto. Schemas validam entrada externa.
- Toda consulta de dados de usuário deve filtrar pelo usuário autenticado. Módulos de tarefas, matérias e flashcards são independentes. Analytics consome eventos dos módulos produtores. IA complementa fluxos manuais e não é proprietária das entidades dos outros módulos.
- Organize a web por funcionalidades. Crie diretórios, entidades, contratos e abstrações futuras quando a mudança que os utiliza for implementada. Não antecipe módulos vazios.

## Qualidade e segurança

- Execute `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` antes de concluir uma mudança aplicável. Testes de banco devem usar MySQL real e banco isolado; não oculte falhas de configuração com mocks.
- Valide variáveis de ambiente e entrada externa. Não exponha segredos, hashes ou stacks em respostas e logs. Mantenha `synchronize: false`, use migrations versionadas e transações para operações críticas.
- Preserve acessibilidade, teclado, largura mínima de 320 px, estados de loading/erro/vazio/sucesso quando aplicáveis e preferência por movimento reduzido. Recompensas e eventos futuros exigem idempotência.
