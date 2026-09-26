# Tasks

## 1. Modelo e contratos

- [x] 1.1 Conferir os contratos implementados por `add-subjects` e `generate-subject-roadmaps-with-ai` e integrar os schemas desta mudança aos tipos reais de roadmap; verificar que o TypeScript compila sem dependências vazias ou paralelas.
- [x] 1.2 Criar migration MySQL para revisões imutáveis, origem, data, passos ordenados e revisão ativa única por roadmap; verificar `migration:run` e rollback em banco de teste isolado, mantendo `synchronize: false`.
- [x] 1.3 Adaptar edições manuais confirmadas e a primeira substituição para registrar snapshots e atualizar a revisão base; verificar em teste de integração que uma edição manual invalida prévia antiga e que roadmaps existentes ganham revisão inicial sem perder passos.
- [x] 1.4 Definir schemas públicos de solicitação e resposta para prévia, confirmação, histórico e restauração, incluindo limites e revisão base; verificar testes de validação de entradas inválidas em `packages/contracts`.
- [x] 1.5 Expor IDs estáveis e conclusão, integrar conclusão/reabertura explícita e preservar identidade/progresso no editor manual; verificar migração de passos preexistentes, revisões de progresso, bloqueio do prefixo e conflitos sem depender de IA.

## 2. Regeneração e confirmação na API

- [x] 2.1 Implementar validação do limite após o último passo concluído e da nova ordem pendente, preservando identidades e conteúdo do prefixo; verificar testes com `DDL → DQL → DML → TCL` e tentativas de mover passos concluídos.
- [x] 2.2 Integrar a geração de sufixo ao serviço público de IA de roadmaps com validação estruturada, sem persistir a prévia; verificar sucesso, resposta inválida e falha do provedor em testes do serviço.
- [x] 2.3 Validar no servidor a sequência final, rejeitando IDs e títulos normalizados repetidos, alterações do prefixo e conteúdo fora dos limites; verificar testes de duplicatas provenientes tanto da IA quanto da edição da pessoa.
- [x] 2.4 Implementar confirmação transacional com verificação de revisão base, uma versão ativa e chave de idempotência; verificar em MySQL real concorrência, conflito e repetição do mesmo pedido sem duas revisões.
- [x] 2.5 Expor rotas autenticadas para gerar prévia e confirmar, consultando roadmap pelo usuário autenticado e preferência de IA; verificar testes HTTP de acesso próprio, acesso negado, IA desativada e erro sem vazamento de dados.

## 3. Histórico e restauração

- [x] 3.1 Implementar listagem paginada e leitura de snapshots confirmados próprios com data, origem e sequência; verificar testes HTTP de isolamento por usuário e histórico intacto após prévia cancelada.
- [x] 3.2 Implementar prévia de restauração que mantém o prefixo concluído atual e combina passos pendentes da revisão escolhida sem duplicatas; verificar testes com progresso posterior à versão histórica e incompatibilidade explicativa.
- [x] 3.3 Confirmar restauração como nova revisão transacional e idempotente, preservando a versão histórica e a antes ativa; verificar testes MySQL de restauração, cancelamento e conflito de revisão.
- [x] 3.4 Integrar exclusão do roadmap à remoção de snapshots segundo a política de matérias; verificar teste de banco sem revisões órfãs.

## 4. Interface de revisão

- [x] 4.1 Adicionar controles de reordenação por teclado somente para passos pendentes após o limite protegido e ação de regenerar condicionada à preferência de IA; verificar testes de interação e de bloqueio dos passos concluídos.
- [x] 4.2 Implementar prévia que diferencia passos preservados e sugeridos, permite editar/remover/reordenar o sufixo e oferece confirmar/cancelar; verificar testes de que cancelar ou falhar não altera o roadmap ativo.
- [x] 4.3 Exibir duplicatas, conflito de revisão, carregamento, erro e sucesso de modo acessível, permitindo nova tentativa; verificar testes de foco e inspeção a 320 px e com movimento reduzido.
- [x] 4.4 Adicionar histórico paginado, consulta de revisão e prévia de restauração com confirmação explícita; verificar por testes que restauração cria nova versão e preserva os passos atualmente concluídos.

## 5. Verificações finais

- [x] 5.1 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` com MySQL real e banco de teste isolado; verificar código zero nos quatro comandos.
- [x] 5.2 Executar `openspec validate regenerate-roadmap-steps --strict` e conferir manualmente geração, edição, cancelamento, confirmação, conflito e restauração; verificar que todos os cenários da spec estão atendidos.
