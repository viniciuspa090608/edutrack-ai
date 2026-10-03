# Design

## Context

O repositório contém `openspec/config.yaml` e não possui ainda aplicações, pacotes, specs vigentes ou `AGENTS.md`. O diretório atual é a raiz do projeto; criar um subdiretório adicional `study-platform/` duplicaria a raiz e prejudicaria os comandos de workspace. Ver [proposal.md](./proposal.md) para a motivação e as specs desta mudança para os comportamentos verificáveis.

## Goals / Non-Goals

**Goals:** criar uma base executável, com limites claros entre web, API e contratos, que permita acrescentar os módulos planejados sem reestruturar o repositório. A configuração e a CI devem exercitar um MySQL real onde a conexão fizer parte da verificação.

**Non-Goals:** modelar entidades futuras, definir regras de domínio, escolher provedores de IA/e-mail, decidir a estratégia de sessão ou construir a interface final. O design não implementa uma infraestrutura genérica de eventos ou um registro de módulos antes de haver consumidores reais.

## Decisions

### 1. Estrutura do monorepo e responsabilidades

Usar a raiz existente para `package.json`, `pnpm-workspace.yaml`, lockfile, `.env.example`, README, `AGENTS.md` e configurações compartilhadas. Os pacotes terão nomes `@study-platform/web`, `@study-platform/api`, `@study-platform/contracts`, `@study-platform/ui` e `@study-platform/config`. `apps/web` contém o React; `apps/api`, o Express e TypeORM; `packages/contracts`, os schemas e tipos de fronteira; `packages/ui`, um componente visual mínimo efetivamente usado pela página técnica; `packages/config`, presets de TypeScript/ESLint/Prettier usados pelos workspaces. `openspec/` permanece na raiz. Arquivos `.env`, saídas de build e dependências instaladas ficam ignorados no Git.

A estrutura sugerida é mantida, com dois ajustes concretos: adicionar `apps/api/src/app.ts` para construir a aplicação Express sem abrir socket em testes, e criar subpastas somente quando houver código real. O primeiro módulo da API será `modules/health`; `auth`, `tasks` e os demais não ganharão stubs vazios. O frontend começa em `src/app`, `src/features/system` e `src/styles`; `components`, `hooks` e `services` surgem quando necessários. `packages/ui` exporta apenas o elemento visual usado na página técnica, evitando uma biblioteca de componentes fictícia.

**Alternativa considerada:** criar todos os diretórios e interfaces futuros de imediato. Isso sugere contratos ainda não conhecidos e impõe manutenção sem benefício executável.

### 2. Limites modulares e dependências permitidas

O grafo inicial é `apps/web -> packages/ui, packages/contracts, packages/config` e `apps/api -> packages/contracts, packages/config`; `packages/ui -> packages/config` se precisar de configuração de build, e nenhum pacote compartilhado importa `apps/*`. `packages/contracts` não importa código de API, React nem TypeORM. `packages/ui` não conhece persistência ou transporte HTTP. O health check é uma rota técnica com controller/route somente na medida usada, sem camada de service ou repository artificial.

Quando módulos de negócio forem adicionados, controllers cuidarão de HTTP, services de regras e repositories de persistência. Um módulo não importará repository interno de outro; integração ocorrerá por contratos públicos ou eventos internos quando houver caso real. Dados de usuário deverão ser filtrados pelo usuário autenticado. Analytics consumirá eventos dos produtores, sem se tornar dono de suas regras. No frontend, `features/*` acompanhará os limites de produto e o dashboard será um agregador. `AGENTS.md` registra essas convenções, a independência de tarefas/matérias/flashcards, o caráter opcional da IA e a proibição de antecipar entidades.

**Alternativa considerada:** uma camada genérica de repositories, event bus e módulos desativáveis na fundação. Ela não teria uso verificável agora; as regras ficam documentadas e serão concretizadas em mudanças específicas.

### 3. Contratos compartilhados

`packages/contracts` começa com schema e tipo derivados da mesma fonte para o corpo do health check e a resposta pública de erro (`{ error: { code, message } }`). Exportações explícitas dão uma API estável aos dois aplicativos. A API forma a resposta de health pelo contrato e a web valida o payload recebido antes de mostrar o estado de sucesso. Dados vindos da rede são validados em tempo de execução na fronteira; TypeScript sozinho não valida payloads. DTOs de tarefas, identidade, IA e entidades TypeORM permanecem fora do pacote nesta mudança.

**Alternativa considerada:** manter tipos duplicados em web e API. Isso permitiria divergência sem erro de compilação.

### 4. API, banco e migrations

`server.ts` carrega a configuração validada, inicializa o `DataSource` TypeORM e só então abre a porta. `app.ts` registra JSON parser, contexto de requisição, rota `GET /health`, 404 e middleware global de erro nesta ordem. Um sinal de encerramento fecha servidor e conexão. O health check é um sinal de prontidão do processo que já concluiu a conexão inicial; não executa consulta a cada requisição. Falha de banco impede o processo de anunciar prontidão.

O DataSource usa o driver MySQL, valores do ambiente e `synchronize: false` em todo ambiente persistente; para simplicidade, mantê-lo `false` em todos os ambientes desta fundação. Migrations são arquivos explícitos versionados e comandos de consulta/execução via pnpm; não existe entidade de produto nem migration de tabela de produto nesta etapa. Um Compose mínimo para MySQL local é útil para reduzir passos de instalação, sem tornar Docker obrigatório se houver um MySQL equivalente. O README explica ambos os caminhos.

**Alternativa considerada:** sincronização automática no desenvolvimento. Ela pode mascarar migrations ausentes e produzir diferença entre ambiente local e CI.

### 5. Configuração, erros e logs

Um schema de ambiente valida `NODE_ENV`, `API_PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `WEB_ORIGIN` antes de qualquer I/O da API. `WEB_ORIGIN` restringe CORS para a página técnica servida em outra porta. O build da web valida `VITE_API_BASE_URL`, única configuração pública necessária para consultar `/health`; nenhum segredo é incorporado ao frontend. O README explica como copiar `.env.example` para `.env` na raiz; scripts de desenvolvimento carregam esse arquivo explicitamente, enquanto CI injeta variáveis no processo. Erros mostram nomes das chaves inválidas, sem imprimir seus valores.

Erros esperados são mapeados para status e códigos estáveis; JSON malformado recebe 400, rota inexistente recebe 404 e exceção inesperada recebe 500 com mensagem genérica. Os logs estruturados incluem nível, evento, método, rota/status e identificador de requisição, com redação de headers de autorização, cookies, senhas e credenciais. A resposta pública não inclui stack trace, SQL ou valores de ambiente. Usar Pino para logs e Zod para schemas é justificado por saída estruturada e validação de runtime; um logger ou validador caseiro adicionaria código transversal sem benefício.

### 6. Web e qualidade

React com Vite e TypeScript estrito oferece um início pequeno e build estático. A página técnica usa layout mobile-first, landmarks semânticos, título e foco visível; qualquer animação pontual via Animate.css respeita `prefers-reduced-motion`. Não há navegação falsa para recursos ainda inexistentes. A consulta do health check fornece um fluxo real para estados de carregamento, sucesso e erro com botão de nova tentativa acessível por teclado; não há estado vazio aplicável a essa resposta unitária. A página continua utilizável quando a API está indisponível.

Presets em `packages/config` e scripts na raiz expõem `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`. O lint inclui a checagem de formatação do Prettier. Vitest cobre lógica e componente React com Testing Library; testes HTTP usam Supertest. A suíte de integração de conexão/migrations usa MySQL real e um banco de teste isolado; testes unitários de parsing de configuração e formato HTTP não substituem essa verificação. GitHub Actions é a escolha inicial de CI para este repositório Git: o workflow usa a versão de Node/pnpm declarada pelo projeto, instalação com lockfile congelado, serviço MySQL temporário e os mesmos quatro comandos da raiz. Se o repositório for hospedado fora do GitHub, o mesmo fluxo de comandos deverá ser portado ao provedor de CI antes da integração. O README lista a sequência de comandos e resultados esperados.

**Alternativa considerada:** vários comandos exclusivos de CI ou mocks da conexão para passar a pipeline. Isso esconderia falhas que a fundação deve detectar.

## Risks / Trade-offs

- [MySQL local ou CI não fica pronto a tempo] → usar health check do serviço e mensagens de erro claras; testar a conexão real antes de aceitar tráfego.
- [O pacote de UI/config vira abstração sem uso] → exportar apenas o que a página ou os workspaces consomem; excluir peças não usadas.
- [Testes de banco compartilham dados] → banco temporário dedicado, migrations explícitas e limpeza entre execuções.
- [Contratos de erro mudam sem coordenação] → schema único em `packages/contracts` e testes de resposta HTTP.
- [Animações prejudicam acessibilidade] → uso pontual e desativação por preferência de movimento reduzido.
- [Regras futuras forçam refatoração] → manter fronteiras documentadas sem entidades antecipadas; criar contratos e eventos quando cada módulo tiver comportamento definido.

## Migration Plan

Não há usuários, dados ou versão anterior a migrar. A implementação cria a estrutura, instala as dependências, disponibiliza MySQL de desenvolvimento, aplica migrations e executa as verificações locais antes da CI. Em falha, a alteração pode ser revertida no Git; o Compose usa volume de desenvolvimento descartável, cuja remoção deve ser uma ação explícita. A mudança OpenSpec só deve ser considerada implementada após os critérios de aceitação e comandos passarem; o arquivamento é uma etapa separada.

## Open Questions

Estas decisões pertencem a propostas futuras e não bloqueiam a fundação:

- Qual ação de conclusão de bloco de matéria mantém a sequência de estudos?
- Roadmaps substituídos conservarão histórico de versões? A regeneração futura deverá decidir retenção e exibição sem duplicar passos ativos.
- Qual será o limite de tamanho e número de linhas para CSV/TSV?
- Onde serão armazenadas fotos de perfil?
- Qual provedor de e-mail, política de expiração e tentativas de códigos, e necessidade de fila externa para mensagens?
- Qual provedor de IA, orçamento de uso e necessidade de fila externa para gerações longas?
- Qual duração de sessão e transporte de autenticação (cookies ou tokens)?

Nenhuma dessas escolhas altera os contratos desta fundação. A recomendação é decidi-las junto ao primeiro proposal que introduzir o respectivo fluxo, comparando custo operacional, segurança e experiência do usuário antes da implementação.

## Sequência sugerida de mudanças futuras

Não criar estas mudanças agora. Cada proposal deverá delimitar um incremento testável. A ordem abaixo coloca a autenticação antes da landing para que suas chamadas levem a fluxos reais, e matérias antes das associações opcionais em tarefas, Pomodoro e flashcards:

1. `add-user-authentication` — cadastro e login locais, sessão e proteção básica.
2. `add-public-landing` — página pública e chamadas para cadastro e login já existentes.
3. `add-google-authentication` — identidade vinculada pelo identificador permanente do provedor, sem mesclagem automática.
4. `add-email-verification` — verificação de endereço; primeira parte de `add-email-verification-and-recovery`.
5. `add-password-recovery` — recuperação de senha; segunda parte de `add-email-verification-and-recovery`.
6. `add-email-address-change` — troca de e-mail após código enviado ao novo endereço.
7. `add-profile` — dados de perfil; primeira parte de `add-profile-and-module-preferences`.
8. `add-module-preferences` — registro de módulos, navegação e bloqueio de ações; segunda parte de `add-profile-and-module-preferences`.
9. `add-subjects` — matérias manuais antes de suas associações opcionais e roadmaps.
10. `add-study-tasks` — tarefas independentes, com associação opcional à matéria já existente.
11. `add-task-subtasks-and-progress` — cálculo de progresso e conclusão idempotente da tarefa principal.
12. `add-pomodoro-sessions` — sessões e eventos de foco, com associação opcional a matéria/tarefa.
13. `add-study-routines` — recorrência apoiada nas sessões, sem absorver a regra do cronômetro.
14. `generate-subject-roadmaps-with-ai` — geração estruturada, pré-visualização e confirmação; a infraestrutura de IA surge com este primeiro consumidor.
15. `regenerate-roadmap-steps` — substituição parcial após haver roadmaps persistidos; decidir histórico aqui.
16. `add-manual-flashcards` — cartões e baralhos sem IA.
17. `import-flashcards` — fluxo de arquivo separado da criação manual e geração por IA.
18. `add-spaced-repetition` — agendamento e avaliações sobre cartões existentes.
19. `generate-flashcards-with-ai` — reutilizar infraestrutura de geração, mantendo persistência no módulo de flashcards.
20. `add-study-analytics` — consultas dos módulos produtores; eventos necessários devem ser introduzidos junto a cada produtor para não depender só de agregados mutáveis.
21. `add-study-streaks` — primeiro critério diário de sequência; primeira parte de `add-study-streaks-and-achievements`.
22. `add-achievements` — recompensas idempotentes; segunda parte de `add-study-streaks-and-achievements`.
23. `compose-user-dashboard` — agregação dos módulos habilitados depois de existirem dados e preferências.

Os incrementos de conta após autenticação local podem avançar em paralelo aos módulos de estudo, desde que cada proposal preserve seus contratos e limites. O dashboard não define regras internas dos módulos.
