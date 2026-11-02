# Tasks

## 1. Contratos e ambiente

- [x] 1.1 Registrar branch e estado inicial do Git, preservar alterações preexistentes e `.env`, usando branch `codex/add-account-ai-provider-settings` se necessário; verificar registro sem valores secretos.
- [x] 1.2 Definir catálogo dos cinco provedores e IDs de modelos compatíveis após conferir documentação oficial, com referências e fixtures de compatibilidade; verificar rejeição de provedor/modelo incompatíveis e URLs arbitrárias.
- [x] 1.3 Criar schemas estritos de catálogo, leitura sem segredos e escrita discriminada em `packages/contracts`; verificar testes para campos desconhecidos, chave vazia, troca de provedor e limites.
- [x] 1.4 Validar par Gemini opcional, cifra e versão dedicadas, recibos independentes e limites de uso; rejeitar legado implicitamente OpenAI; verificar testes de ambiente sem valores secretos em erros.

## 2. Persistência e configuração privada

- [x] 2.1 Criar migrations versionadas para configuração por conta, contadores e leases; verificar aplicação/rollback em MySQL real isolado, cascade e preservação de contas existentes com `synchronize: false`.
- [x] 2.2 Implementar cifra autenticada dedicada com AAD e versão; verificar roundtrip, nonce independente, ciphertext adulterado, conta/provedor trocado e ausência de chave em texto puro no banco.
- [x] 2.3 Implementar repository e service de configuração com transações e revisão; verificar isolamento de duas contas, chave omitida, troca de modelo, exigência de chave na troca de provedor, conflito concorrente, remoção e restauração padrão.
- [x] 2.4 Expor rotas autenticadas de catálogo e configuração com proteção de origem, DTO explícito e no-store; verificar chamadas sem sessão, mutação entre origens e ausência de credenciais em todas as respostas.

## 3. Roteamento e provedores

- [x] 3.1 Introduzir contrato interno de resolução por conta e snapshot da configuração; verificar padrão Gemini, ausência do padrão, chave pessoal e alteração durante chamada em andamento sem fallback.
- [x] 3.2 Adaptar OpenAI e implementar Gemini com destinos fixos, autenticação por cabeçalho, redirecionamento bloqueado, timeout e limite de leitura; verificar fixtures válidas, recusa, erro, JSON inválido e resposta excessiva.
- [x] 3.3 Implementar adaptador Claude com tradução de schema compatível; verificar fixtures dos três fluxos e sanitização dos erros sem relaxar validação local.
- [x] 3.4 Implementar adaptadores DeepSeek e Kimi com suas capacidades documentadas; verificar fixtures dos três fluxos, respostas vazias/inválidas e rejeição de modelo fora do catálogo.
- [x] 3.5 Integrar resolução nos serviços de roadmaps, regeneração e flashcards via contrato público sem acesso a repository de outro módulo; verificar matriz cinco provedores por três fluxos, preferências desativadas e recursos alheios sem chamada externa.
- [x] 3.6 Manter recibos, revisão e confirmação idempotente independentes da seleção atual; verificar confirmação de prévia válida após troca de provedor, expiração, adulteração e repetição sem nova geração.
- [x] 3.7 Implementar reservas e leases MySQL com limites por conta e globais; verificar disputa pela última cota em duas instâncias, limite pessoal, reset UTC, liberação/expiração e ausência de consumo compartilhado no modo pessoal.

## 4. Configurações da conta

- [x] 4.1 Integrar seção IA em `/conta` com padrão Gemini, modo pessoal, catálogo dependente e campo de chave mascarado sem leitura posterior; verificar estados de carregamento, vazio, erro e sucesso em testes de interface.
- [x] 4.2 Implementar substituir/remover/restaurar padrão com confirmação e limpeza de campos transitórios; verificar preservação do estado confirmado em falha, retorno à tela sem segredo e limpeza em logout/unmount.
- [x] 4.3 Mostrar destino dos conteúdos, custos de chave pessoal e limites do padrão; verificar fluxo por teclado, foco/mensagens acessíveis, movimento reduzido e layout de 320 px.

## 5. Segurança, documentação e conclusão

- [x] 5.1 Adicionar testes de divulgação com chaves-canário sintéticas em respostas, validação, logs, telemetria, prompts, saída refletida e bundle; verificar que somente o cabeçalho enviado ao provedor correto contém o segredo e que nenhum teste usa a chave real.
- [x] 5.2 Atualizar `.env.example` e README com migração, catálogo, limites, custeio, configuração privada da chave fornecida, rotação de cifra e rollback; verificar ausência de segredos reais e nenhuma alteração não autorizada no `.env` durante documentação.
- [x] 5.3 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, com MySQL real isolado e fronteiras HTTP dos provedores simuladas; registrar resultados sem chamadas pagas automáticas.
- [x] 5.4 Conferir deltas e snapshots semânticos preservando requisitos posteriores; preparar manifesto explícito conforme README, revisar diff staged e executar `git diff --cached --check`; verificar que inclui somente arquivos/hunks desta mudança.
- [x] 5.5 Após todas as tarefas e verificações aprovadas, executar `pnpm openspec:finish --change add-account-ai-provider-settings --manifest .openspec-local/add-account-ai-provider-settings-manifest.json --message "[feat] permitir configurar IA por conta com Gemini padrão"`; verificar commit único final, sync, archive e hash/arquivos, sem tag ou push.
