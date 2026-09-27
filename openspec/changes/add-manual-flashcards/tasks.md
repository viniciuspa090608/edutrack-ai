# Tasks

## 1. Pré-requisitos e contratos

- [x] 1.1 Confirmar que autenticação, preferências e `add-subjects` estão aplicados, incluindo contrato público de propriedade de matérias; verificar migrations e rotas efetivas antes de integrar flashcards.
- [x] 1.2 Adicionar schemas e tipos de baralho, cartão, paginação e associação opcional em `packages/contracts`; verificar por testes que web e API compartilham representação de `subjectId: null` e rejeitam textos vazios, IDs malformados e campos extras.

## 2. Persistência e API

- [x] 2.1 Criar migrations versionadas para `flashcard_decks` e `flashcards`, FKs e índices, com `ON DELETE SET NULL` para matéria e `ON DELETE CASCADE` para cartões; verificar apply e rollback em MySQL real isolado com `synchronize: false`.
- [x] 2.2 Implementar repositories com filtro pelo usuário e pela hierarquia baralho/cartão, e services de CRUD de baralhos; verificar testes de criação, paginação, edição parcial, exclusão e IDs alheios/inexistentes.
- [x] 2.3 Implementar services de CRUD de cartões com frente e verso obrigatórios e exclusão individual; verificar que cartão de outro baralho retorna 404 e que um baralho vazio é válido.
- [x] 2.4 Integrar o vínculo opcional de matéria via serviço público de `add-subjects`, sem importar repository alheio; verificar matéria própria, alheia, inexistente, `null`, matéria excluída e matérias desativadas.
- [x] 2.5 Expor rotas autenticadas de baralhos e cartões com checagem de `flashcards_enabled` em cada requisição; verificar chamadas diretas com sessão ausente, módulo desativado e dois usuários, preservando dados na reativação.

## 3. Interface manual

- [x] 3.1 Criar `/app/flashcards` na navegação protegida com lista paginada, estados de loading/erro/vazio e bloqueio explicativo quando flashcards estiver desativado; verificar navegação e recarga a partir de 320 px.
- [x] 3.2 Implementar formulário de baralho com nome, descrição e matéria opcional, sem seletor quando matérias estiverem desativadas; verificar criação/edição sem matéria, vínculo próprio, `null` e preservação de entradas após erro.
- [x] 3.3 Implementar lista, criação e edição de cartões com frente e verso, validação de campo e exclusões confirmadas de cartões/baralhos; verificar que cancelar exclusão preserva dados e que confirmar baralho informa a remoção dos cartões.
- [x] 3.4 Implementar visualização com frente inicial, **Revelar resposta** e **Mostrar frente**, reiniciando a ocultação ao trocar cartão; verificar por teste de interface que o verso não aparece antes da ação e revelar não envia escrita.
- [x] 3.5 Verificar rótulos, foco, teclado, mensagens de erro/sucesso, layout desde 320 px e movimento reduzido em todos os estados da página; corrigir falhas observadas.

## 4. Integração e conclusão

- [x] 4.1 Documentar no README o uso manual, vínculo opcional, efeito da exclusão da matéria e ausência de importação, revisão espaçada e IA; verificar que o fluxo manual funciona com `ai_enabled=false` e sem provedor.
- [x] 4.2 Executar testes de integração com MySQL real isolado para duas contas, preferências, exclusões e FKs, além do fluxo de revelação na web; verificar todos os cenários das specs.
- [x] 4.3 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate add-manual-flashcards --strict`; corrigir falhas antes de concluir.
- [x] 4.4 Revisar diff, adicionar somente arquivos/hunks desta mudança e executar `git diff --cached --check` antes do único commit de apply conforme `AGENTS.md`; verificar hash e lista de arquivos incluídos.
