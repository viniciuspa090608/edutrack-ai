# Tasks

## 1. Pré-requisitos e contratos

- [x] 1.1 Confirmar que autenticação, preferências e `add-subjects` estão aplicados e registrar a ausência da base manual de roadmaps, incluída nesta mudança pela ampliação autorizada; verificar os endpoints e migrations entregues antes de integrar a geração.
- [x] 1.2 Adicionar em `packages/contracts` schemas de parâmetros, blocos, passos, prévia e confirmação com os limites do design; verificar casos válidos, limites e rejeição de campos extras por testes de contrato.
- [x] 1.3 Acrescentar configuração opcional e validada de chave, modelo, tempo limite, limite de resposta e segredo do comprovante; verificar que a API e as operações manuais iniciam sem IA configurada e que valores inválidos são recusados sem exibir segredos.

- [x] 1.4 Criar schemas e migrations versionadas da base manual de roadmaps, blocos e passos ordenados; verificar limites, aplicação e rollback em MySQL real isolado, preservando o plano simples.
- [x] 1.5 Implementar CRUD manual de roadmaps no módulo de matérias e contrato público de salvamento transacional; verificar isolamento, paginação, edição atômica e exclusão em MySQL real.
- [x] 1.6 Entregar consulta e editor manual de roadmaps com blocos/passos e controles de teclado, reutilizado pela prévia; verificar uso sem IA/provedor, confirmação de exclusão e estados de falha.

## 2. Geração e validação na API

- [x] 2.1 Implementar adaptador do provedor com limite de tempo e saída, isolamento de segredos e tratamento de erro; verificar resposta válida, indisponibilidade, timeout e saída excessiva com provedor simulado na fronteira externa.
- [x] 2.2 Implementar serviço de geração para matéria própria usando apenas o contrato público de matérias, conferindo sessão e preferências antes da chamada; verificar com dois usuários que ID alheio não vaza dados e IA desabilitada não chama o provedor.
- [x] 2.3 Validar a resposta bruta da IA antes da prévia e emitir comprovante assinado de 30 minutos sem persistir rascunho; verificar resposta vazia, bloco sem passos, limites, assinatura adulterada e expiração.
- [x] 2.4 Expor `POST /subjects/:subjectId/roadmap-generations` com erros seguros e parâmetros validados; verificar que entrada inválida não consome chamada de IA e que geração válida não escreve roadmap no MySQL.

## 3. Confirmação e persistência

- [x] 3.1 Adicionar migration versionada para identificador único de geração associado a roadmaps confirmados, preservando registros manuais existentes; verificar aplicação e reversão em MySQL real isolado com `synchronize: false`.
- [x] 3.2 Expor `POST /subjects/:subjectId/roadmaps/confirm-ai` e integrar o salvamento transacional do módulo de matérias, revalidando conteúdo, comprovante, propriedade e preferências; verificar rejeição sem escrita parcial e que um roadmap anterior não é substituído.
- [x] 3.3 Tornar a confirmação idempotente pelo identificador da geração e testar requisições repetidas e concorrentes em MySQL real isolado; verificar que produzem um único roadmap recuperável.

## 4. Prévia e edição na web

- [x] 4.1 Exibir **Aprimorar com IA** apenas em matéria própria com matérias e IA habilitadas, incluindo atualização após mudança de preferência; verificar botão oculto quando IA está desligada e uso manual preservado.
- [x] 4.2 Criar formulário de nível, objetivo, prazo, horas semanais e assuntos conhecidos com validação e estados de carregamento/erro; verificar campos e mensagens por teclado e a partir de 320 px.
- [x] 4.3 Exibir parâmetros, blocos e passos da prévia e permitir editar, adicionar, excluir e reordenar por teclado; verificar que a ordem e o conteúdo visíveis compõem o envio final e que resposta inválida nunca aparece.
- [x] 4.4 Implementar **Salvar roadmap** e **Cancelar**, preservando edição em falha e descartando prévia ao cancelar ou sair; verificar no banco que apenas confirmação explícita persiste e que repetição após falha de rede não duplica roadmap.

## 5. Integração e conclusão

- [x] 5.1 Documentar configuração opcional de IA, fluxo de prévia/confirmar e dependências em README sem divulgar credenciais; verificar que uso manual não exige provedor.
- [x] 5.2 Executar testes de integração com MySQL real isolado para duas contas, preferências alternadas, provedor indisponível, resposta inválida, edição, cancelamento e confirmação; verificar todos os cenários da spec.
- [x] 5.3 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate generate-subject-roadmaps-with-ai --strict`; corrigir falhas antes de concluir.
- [x] 5.4 Revisar diff e `git diff --cached --check`, adicionar somente arquivos desta mudança e criar o único commit de apply conforme `AGENTS.md`; verificar hash e lista de arquivos incluídos.
