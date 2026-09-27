# Tasks

## 1. Pré-requisitos e contratos

- [x] 1.1 Confirmar que autenticação, preferências e `add-manual-flashcards` estão aplicados, com serviço público de baralhos/cartões e limites de frente/verso; verificar os contratos e migrations efetivos antes de integrar IA.
- [x] 1.2 Acrescentar em `packages/contracts` schemas de texto de entrada, cartão gerado, prévia e confirmação revisada; verificar em testes os limites, lista não vazia, IDs válidos e rejeição de campos desconhecidos.
- [x] 1.3 Reutilizar o adaptador de IA compartilhado se já existir ou criá-lo em infraestrutura genérica da API, com configuração opcional validada; verificar inicialização e fluxos manual/importação sem provedor configurado.

## 2. Geração e prévia na API

- [x] 2.1 Implementar serviço de geração que verifica sessão, preferências e baralho próprio antes da chamada; verificar com duas contas, IA desativada, flashcards desativados e ID alheio que o provedor não é chamado.
- [x] 2.2 Limitar entrada, tempo e saída do provedor e validar integralmente de 1 a 20 cartões contra os limites manuais; verificar respostas vazias, malformadas, parcialmente inválidas, excessivas e timeout sem qualquer gravação.
- [x] 2.3 Emitir IDs aleatórios para os cartões e comprovante assinado de 30 minutos vinculado ao usuário e baralho, sem persistir a prévia; verificar assinatura adulterada, expiração e ausência de novos cartões no banco após geração.
- [x] 2.4 Expor `POST /flashcard-decks/:deckId/ai-generations` com erros recuperáveis sem divulgar prompt, saída bruta ou segredo; verificar entrada vazia, destino inexistente e geração válida.

## 3. Confirmação no módulo de flashcards

- [x] 3.1 Adicionar migration versionada de `flashcard_ai_confirmations` com ID de geração único e resultado recuperável; verificar apply e rollback em MySQL real isolado com `synchronize: false`.
- [x] 3.2 Implementar validação da confirmação para usuário/baralho/IDs da prévia, subconjunto não vazio, campos revisados e preferências atuais; verificar destino trocado, cartão extra, ID repetido, conteúdo inválido e prévia vencida sem escrita parcial.
- [x] 3.3 Implementar comando público transacional de flashcards que cria somente os cartões confirmados e registra o resultado idempotente; verificar com MySQL real que repetição, concorrência e perda de resposta não duplicam cartões.
- [x] 3.4 Expor `POST /flashcard-decks/:deckId/ai-generations/confirm` retornando cartões efetivos e recuperando confirmação concluída; verificar que cartões preexistentes não mudam e que exclusão do baralho entre prévia e confirmação resulta em não encontrado.

## 4. Revisão na web

- [x] 4.1 Mostrar **Aprimorar com IA** somente com flashcards e IA habilitados, mantendo ações manuais e importação separadas; verificar alternância de preferências e rota direta.
- [x] 4.2 Criar formulário de texto de conteúdo ou assunto e seleção de baralho próprio, com validação e estados de carregamento/erro; verificar teclado, mensagens de campo e layout desde 320 px.
- [x] 4.3 Mostrar baralho, entrada e todos os cartões validados na prévia, com edição de frente/verso e remoção individual; verificar que somente IDs restantes e conteúdo visível são enviados à confirmação, sem executar HTML.
- [x] 4.4 Implementar **Salvar cartões** e **Cancelar**, preservando edição em erro recuperável e impedindo salvar lista vazia; verificar cancelamento/saída sem escrita e salvamento como gerado ou revisado.

## 5. Integração e conclusão

- [x] 5.1 Documentar configuração opcional da IA e fluxo de revisão, deixando claros os caminhos manual e de importação; verificar que nenhum segredo aparece na documentação ou logs.
- [x] 5.2 Executar testes integrados com MySQL real isolado para duas contas, preferências, falhas de provedor, resposta inválida, cancelamento, edição/remoção e confirmação repetida; verificar todos os cenários das specs.
- [x] 5.3 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate generate-flashcards-with-ai --strict`; corrigir falhas antes de concluir.
- [x] 5.4 Revisar diff, adicionar somente arquivos/hunks da mudança e executar `git diff --cached --check` antes do único commit do apply conforme `AGENTS.md`; verificar hash e arquivos incluídos.
