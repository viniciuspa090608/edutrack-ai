# Design

## Context

Ver motivação em proposal.md. A raiz usa pnpm 11.25.0, Node >=24 <27 e scripts separados dev:web, dev:api e dev:email; ainda não há dev integrado. Vite usa porta 5173 sem strictPort e exige VITE_API_BASE_URL como origem absoluta. A API usa MySQL com synchronize e migrationsRun desativados; a lista de entidades TypeORM não cobre todas as tabelas, pois vários módulos persistem por SQL. CORS permite uma WEB_ORIGIN, e rotas autenticadas também verificam Origin diretamente. Cookies usam SameSite=lax. SMTP e chaves de e-mail são obrigatórios na validação atual. Analytics publica atividades pelo contrato público publishActivity, integrado às projeções de progresso.

Estado observado antes de editar: branch master; nenhum diff staged; modificados .env.example, README.md e package.json; removidos arquivos das antigas mudanças add-public-landing, bootstrap-study-platform e document-commit-convention; arquivos novos incluem skills locais, propostas/specs de mudanças implementadas, arquivos de archive e specs principais. O inventário completo foi lido com git status --porcelain=v1 -uall. Esse estado deve ser novamente capturado no início do apply; arquivos desta proposta pertencem à nova mudança, mesmo que já apareçam no baseline do apply.

## Goals / Non-Goals

**Goals:** preparar operações locais verificáveis sem contornar regras de autenticação, consistência de histórico ou isolamento; permitir demonstração por localhost e LAN; concluir o apply com checks e dois commits segregados.

**Non-Goals:** executar reset nesta proposta, alterar migrations ou o esquema para facilitar fixtures, provisionar MySQL/SMTP automaticamente, criar integrações reais de IA ou OAuth de demonstração, publicar produção ou arquivar a mudança.

## Decisions

### Comandos de banco explícitos e protegidos

Adicionar comandos da raiz demo:inspect, demo:reset e demo:seed delegados à API por pnpm. Carregar o ambiente efetivo sem imprimir .env, credenciais ou chaves. Aceitar apenas NODE_ENV=development, DB_NAME diferente de TEST_DB_NAME e host local (localhost, 127.0.0.1 ou ::1); rejeitar nomes de sistema MySQL. Inspecionar o alvo efetivo da conexão e mostrar host:porta/banco, tabelas e migrations pendentes. Exigir migrations aplicadas antes de reset/seed. O reset exige confirmação humana do alvo; CLI não interativo exige argumento explícito com o alvo completo. Ao executar o apply, apresentar o alvo à pessoa e aguardar a confirmação antes de truncar o banco de desenvolvimento.

Usar lista explícita das tabelas da aplicação conferida contra information_schema e migrations, excluindo o histórico de migrations. Não derivar essa lista apenas de entities. Tabelas inesperadas fazem falhar antes de limpar. Parar web/API/worker antes de reset ou seed para evitar escrita concorrente. Executar TRUNCATE em conexão dedicada com FOREIGN_KEY_CHECKS desativado somente nessa sessão e restaurado em finally; não desativar globalmente nem remover constraints. MySQL faz commit implícito em TRUNCATE: informar que falha parcial não admite rollback, registrar a etapa sem payloads e permitir novo reset confirmado. DELETE transacional foi descartado porque o requisito exige TRUNCATE.

### Seed determinístico e transacional

Banco deve estar vazio nas tabelas de dados; caso contrário abortar antes de qualquer escrita e orientar reset. Construir fixtures tipadas em tooling de desenvolvimento na API, usando funções de domínio e contratos públicos disponíveis; inserções diretas necessárias permanecem neste tooling, sem ampliar acesso a repositories entre módulos. Usar transação única para a população, UUIDs estáveis, ordem coerente de vínculos e hash de senha pelo utilitário existente. Marcar contas confirmadas sem gerar desafios, sessões ou envios de e-mail.

Contas propostas: ativo@demo.edutrack.test, intermediario@demo.edutrack.test e iniciante@demo.edutrack.test, senha local DemoEduTrack2026! documentada como exclusiva da demonstração. Usar timezone America/Sao_Paulo e data-base opcional ISO validada; padrão é o dia local. Distribuir cerca de 60 dias de histórico, com atividade recente, períodos sem estudo, conclusões, progresso parcial e revisão vencida. Respeitar políticas de revisão e estados de sessões; publicar eventos idempotentes com occurredAt coerente e obter projeções pelo mecanismo existente. Evitar apenas preencher contadores de analytics e conquistas sem fontes correspondentes. Cobrir também importação de flashcards e versões de roadmaps quando disponíveis, com fixtures locais; não exigir credenciais nem chamar provedores de IA.

Ativo: três matérias, tarefas e subtarefas em vários estados, roadmap parcial/concluído, rotina semanal, sessões concluídas/interrompidas, decks e revisões com diferentes resultados, sequência recente e conquistas derivadas. Intermediário: duas matérias, tarefas parcialmente concluídas, sessões esparsas, deck com revisões devidas e progresso parcial. Iniciante: uma matéria e uma tarefa inicial; demais coleções vazias para apresentar primeiros passos. Habilitar módulos implementados para permitir navegação, mantendo vazio conforme perfil.

### Supervisão dos processos

Adicionar dev na raiz delegando à execução pnpm de um supervisor compatível com Windows. Preferir biblioteca de supervisão com encerramento de árvore de processos a implementação manual de sinais. Preparar contratos/UI antes de lançar web, API e worker; falha de preparação impede início. Ctrl+C ou falha de filho encerra todos e propaga código adequado. MySQL e SMTP/Mailpit são pré-requisitos externos documentados. O worker é incluído porque cadastro e recuperação dependem dele, mesmo que as contas seed já sejam confirmadas. Não anexar reset, seed ou migrations automaticamente ao dev.

### LAN por proxy de mesma origem

Vite inicia com --host 0.0.0.0 --port 5173 --strictPort e encaminha /api para API local na porta 3001. Cliente usa caminhos relativos /api no desenvolvimento; revisar o cliente existente e health check para preservar caminhos reais sem duplicar prefixos. Produção mantém configuração de origem absoluta atual. A API pode continuar vinculada ao loopback para o proxy.

Permitir localhost:5173 e o IP LAN explicitamente configurado em uma lista validada exclusivamente de desenvolvimento. Aplicar a mesma política a CORS, validações de Origin de auth/profile e demais mutações; não usar wildcard com credentials nem aceitar qualquer Origin encaminhado. Proxy preserva Origin e cookies HttpOnly host-only SameSite=lax em HTTP local, sem enfraquecer secure em produção. Ajustar URLs públicas documentadas para fluxos de e-mail conforme o endereço usado na demonstração; OAuth real não faz parte do seed. Alternativa de expor API diretamente na LAN foi descartada por exigir duas origens e mais configuração de cookies.

### Versionamento local

No apply, salvar baseline completo de status, diff tracked/staged e inventário de arquivos novos/removidos em local de trabalho ignorado, sem incluir conteúdo sensível em artefatos da proposta. Revisar os preexistentes antes de adicionar, incluindo .agents/skills/.openspec-target que pode conter caminho da máquina e relatórios/artefatos gerados. Excluir segredos, configuração local e artefatos indevidos do commit e informar exclusões; não apagar conteúdo preexistente. Separar hunks compartilhados em package.json, README.md e .env.example.

Após concluir implementação, documentação e validação, preparar exatamente um commit da mudança incluindo planejamento e tasks.md final; outro commit contém alterações preexistentes elegíveis. Ambos usam [tipo] descrição objetiva, diff staged revisado e git diff --cached --check. Não criar commits vazios. Registrar hashes e arquivos por commit. Durante o apply, a pessoa cancelou publicação, push e criação de repositório; concluir somente os dois commits locais. O origin configurado antes do cancelamento será mantido como configuração local, sem acesso para publicação.

## Risks / Trade-offs

- [Perda irreversível por TRUNCATE] → confirmar alvo completo, bloquear ambientes/hosts impróprios, parar processos e documentar backup manual antes da limpeza.
- [Fixture divergir das regras] → aproveitar domínio existente e validar fontes, projeções e fluxos autenticados com MySQL real isolado.
- [LAN mudar de IP] → origem configurável explícita, instruções para IP e firewall e validação pelo endereço real usado.
- [Processos órfãos no Windows] → supervisor de árvores e teste de Ctrl+C, falha de filho e portas liberadas.
- [Diferenças preexistentes misturadas] → baseline no apply, revisão dos hunks e commits segregados; dados locais e relatórios indevidos ficam fora e são informados.

## Migration Plan

1. Registrar baseline do apply; implementar tooling, supervisão e configuração sem alterar dados.
2. Validar em MySQL isolado com migrations versionadas, sem mocks de banco; executar lint, typecheck, test e build.
3. Inspecionar o banco efetivo de desenvolvimento, apresentar alvo e obter confirmação; somente então executar reset e seed explicitamente.
4. Validar logins e fluxos dos três perfis em localhost/LAN e encerrar processos; finalizar tarefas e revisar os dois commits locais.
5. Rollback de código por revert dos commits apropriados; recuperação dos dados truncados somente por backup anterior. Não arquivar nem criar tags.

## Ajustes verificados no apply

A verificação dos dados de exemplo em 320 px revelou overflow nos botões de detalhes das tarefas. Aplicar limite de largura e quebra de linha apenas nesse controle, mantendo seu nome acessível e navegação por teclado. A origem LAN verificada foi http://192.168.15.12:5173.
