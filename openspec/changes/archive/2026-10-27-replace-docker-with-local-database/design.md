# Design

## Context

Ver `proposal.md` para motivação. O Compose contém MySQL 8.4, volume persistente, healthcheck e Mailpit; `docker/mysql-init.sh` somente valida `TEST_DB_NAME` e cria o banco de teste. Não foram encontrados Dockerfiles. `package.json` contém `db:up`, `mail:up` e referências a `compose.yaml` em lint/format. O README e o comentário SMTP de `.env.example` orientam esses comandos. O CI usa `services.mysql` com imagem MySQL 8.4 e porta 3307.

O DataSource já usa exclusivamente variáveis validadas, migrations versionadas e `synchronize: false`. Os testes criam bancos com prefixo `TEST_DB_NAME` e sufixo aleatório, exigindo permissões CREATE/DROP DATABASE além de acesso às tabelas. Há alterações preexistentes nos arquivos alvo e diversos artefatos OpenSpec; o apply deverá isolá-las.

## Goals / Non-Goals

**Goals:** remover provisionamento por containers sem mudar o contrato de conexão, preservar testes reais e fornecer preparação reproduzível para banco e SMTP.

**Non-Goals:** alterar regras de negócio, entidades, repositories ou migrations; instalar serviços na máquina automaticamente; importar dados de volumes; excluir volumes; modificar histórico OpenSpec.

## Decisions

1. **Ambiente local como fonte da conexão.** O usuário autorizou usar e validar MySQL 8.0.46 local; MySQL 8.4 permanece no CI. Ajustar o exemplo para `localhost:3306` e `root`, mantendo os nomes atuais dos bancos. Deixar `DB_PASSWORD=` e instruir preenchimento privado; no apply ajustar somente as chaves DB do `.env` ignorado com a senha fornecida pelo usuário, preservando demais valores e sem imprimi-los. Não criar fallback de senha no código nem afrouxar a validação. A alternativa de alterar o DataSource seria redundante.
2. **Preparação explícita dos bancos.** Documentar `mysql -h localhost -P 3306 -u root -p`, com prompt de senha, e SQL para criar `study_platform_dev` e `study_platform_test`, adaptável aos nomes do ambiente. Documentar permissões CREATE/DROP para bancos temporários de teste. Manter comandos de migrations existentes; remover `db:up` sem substituí-lo por instalação automática. Isso evita comportamento destrutivo e acoplamento ao gerenciador de serviços do sistema operacional.
3. **Mailpit nativo ou SMTP existente.** Documentar download/instalação do binário nativo e execução nas portas 1025/8025, mantendo worker e variáveis SMTP. Remover `mail:up` e seu comentário do exemplo. Não exigir autenticação de provedor externo para desenvolvimento. A remoção isolada do MySQL do Compose deixaria uma dependência Docker para e-mail, contrariando o escopo confirmado.
4. **CI com serviço nativo.** Fixar uma imagem Ubuntu do runner e provisionar MySQL compatível com 8.4 diretamente por pacotes oficiais, sem action que inicie containers. Configurar usuário exclusivo de CI por credencial efêmera, armazenada em arquivo temporário protegido/ambiente e mascarada; usar porta 3306 e espera de prontidão limitada. Criar o banco base de teste e conceder permissões para bancos temporários. Extrair pacotes oficiais em diretório temporário do runner com configuração própria, evitando reutilizar dados ou arquivos de configuração do MySQL preinstalado. Desativar binary log somente nessa instância efêmera para permitir triggers das migrations sem conceder SUPER ao usuário de testes; verificar CREATE/DROP e criação de trigger no probe. Se a imagem não oferecer 8.4, configurar o repositório oficial explicitamente em vez de aceitar downgrade silencioso. Preservar lockfile imutável e as quatro verificações. A alternativa de manter `services.mysql` foi descartada pelo escopo confirmado.
5. **Remoção após substituição de todas as funções.** Remover Compose e init somente após documentar criação do banco de teste e SMTP nativo. Retirar Compose das listas explícitas de lint/format; conservar referências históricas em mudanças arquivadas como evidência do estado anterior.

## Risks / Trade-offs

- [Dados ainda no volume antigo] → Documentar que apontar ao servidor local não transfere dados; não apagar volume nem executar comandos destrutivos. Exportação/importação, se necessária, é uma operação separada.
- [MySQL ausente, incompatibilidade entre 8.0.46 local e 8.4 no CI ou permissões insuficientes] → Verificar versão, conexão e bancos temporários antes da suíte; informar falha real sem mocks.
- [Provisionamento de CI depende de pacotes oficiais] → Fixar imagem do runner, versão compatível e espera limitada; validar o workflow e execução real quando houver runner acessível.
- [SMTP fica indisponível após remoção] → Validar captura de mensagem com Mailpit nativo e worker, preservando chaves existentes.
- [Alterações anteriores misturadas ao commit] → Registrar baseline no apply e selecionar arquivos/hunks específicos, com revisão staged.

## Migration Plan

Durante apply, registrar Git, preservar ambiente existente, preparar banco/SMTP nativos, atualizar exemplo/documentação/scripts e substituir CI. Remover artefatos Docker sem tocar dados. Aplicar migrations pendentes e repetir o comando para confirmar ausência de reaplicação; executar lint, typecheck, test e build. Criar um único commit de conclusão incluindo `tasks.md` somente após sucesso e revisão staged. Para rollback, restaurar arquivos de tooling e configuração privada anterior; preservar bancos e volumes, sem reverter migrations de produto.

## Correção de fixtures autorizada

O usuário autorizou corrigir as fixtures após as falhas da suíte local. Os três cenários HTTP passam a alinhar datas iniciais dos cartões ao relógio controlado, verificando antes que a API persistiu revisão inicial com a mesma data de criação e revisão 1. O cenário de reset avança o relógio até o vencimento persistido. Analytics prepara cobertura conhecida em cada teste, mantendo o teste de migration com cobertura real recriada. Nenhuma regra de negócio ou migration é alterada.

A suíte web mostrou contenção e timeouts com o paralelismo padrão da máquina, enquanto todos os cenários passaram com dois workers. A configuração de testes jsdom limita `maxWorkers` a 2, mantendo a suíte e os deadlines originais.
