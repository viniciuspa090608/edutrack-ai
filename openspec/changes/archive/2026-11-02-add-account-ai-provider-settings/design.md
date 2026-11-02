# Design

## Context

Ver `proposal.md` para motivação. Atualmente `app.ts` injeta `OpenAIStructuredProvider` nos flashcards e `OpenAIRoadmapProvider` nos roadmaps; o adaptador compartilhado chama a Responses API com a configuração global. A validação de ambiente exige `AI_API_KEY`, `AI_MODEL` e `AI_RECEIPT_KEY` juntos se qualquer um estiver presente. `/conta` já possui perfil e preferências, e os serviços verificam propriedade e módulos habilitados. Assinaturas de prévia existentes são independentes da credencial externa. Há criptografia AES-GCM para e-mail, mas sua chave e classes de domínio não serão reutilizadas para credenciais de IA.

## Goals / Non-Goals

**Goals:** oferecer resolução por sessão nos três fluxos existentes, contratos públicos sem segredos de leitura e um padrão Gemini controlado pelo operador.

**Non-Goals:** gateway genérico, URLs configuráveis, modelos sem compatibilidade validada, múltiplas chaves pessoais simultâneas, teste pago implícito ao salvar, ferramentas executáveis pela IA ou substituição dos domínios proprietários de roadmaps e flashcards.

## Decisions

### 1. Módulo dedicado com contrato público

Criar módulo `ai-settings` com rotas, service e repository próprios. Expor `GET /profile/ai/catalog`, `GET /profile/ai`, `PUT /profile/ai` e `DELETE /profile/ai`, todos autenticados; mutações usam proteção de origem/CSRF existente. O usuário é obtido da sessão, sem parâmetro de proprietário. `GET` retorna `mode`, provedor/modelo efetivos, disponibilidade do padrão e `hasPersonalKey`; respostas usam `Cache-Control: no-store`. `PUT` usa união discriminada: `platform` restaura padrão e apaga chave; `personal` exige provedor/modelo e permite omitir chave apenas no mesmo provedor. Campo `apiKey` é somente de escrita, string aparada de 1–4096 caracteres sem controles, e nunca integra DTO de resposta. Campos desconhecidos são rejeitados.

O catálogo é mantido no servidor, com IDs públicos `gemini`, `claude`, `openai`, `deepseek`, `kimi` e modelos compatíveis por provedor. O nome visual `ChatGPT (OpenAI)` não implica aceitar sessão, cookie ou assinatura do produto ChatGPT. Seleção de modelo é restrita ao catálogo para garantir os contratos estruturados existentes; texto livre e descoberta remota foram descartados por ampliar superfície e aceitar modelos incompatíveis. O apply fixa IDs de modelos vigentes após conferir documentação oficial, sem usar aliases inventados nem prometer disponibilidade de todos os modelos comerciais. O padrão usa modelo Gemini definido pelo operador, não pelo cliente.

### 2. Persistência e criptografia

Migration cria `user_ai_settings`, chave primária/FK `user_id` com cascade, modo, provedor, modelo, ciphertext, nonce, tag, versão da chave, revisão e timestamps. Ausência de linha significa modo padrão. Chave pessoal usa AES-256-GCM, nonce aleatório de 12 bytes por gravação e AAD contendo usuário/provedor/versão; isso impede transplantar ciphertext entre contas. Configuração e segredo são substituídos em transação, usando revisão para recusar atualização concorrente obsoleta. Todas as consultas incluem `user_id` da sessão. Somente service interno pode descriptografar; controllers serializam DTO explícito. Metadados não incluem sufixo ou hash da chave.

`AI_CREDENTIAL_ENCRYPTION_KEY` e `AI_CREDENTIAL_KEY_VERSION` ficam no ambiente privado. Exigir segredo independente de `EMAIL_HMAC_KEY`, `EMAIL_ENCRYPTION_KEY` e `AI_RECEIPT_KEY`. Não reutilizar a chave de assinatura como cifra. Rotação usa procedimento administrativo de manutenção para recifrar todas as linhas com nova versão antes da troca, conservando backups privados e sem exibir chaves. Não há rotação automática nem endpoint de exportação de segredos. Remoção apaga dados ativos; backups seguem retenção operacional documentada. Credencial padrão nunca entra nessa tabela.

### 3. Roteamento e adaptadores

Criar serviço público interno que resolve um snapshot `{provider, model, credential}` para `userId` já autenticado e despacha geração estruturada. Serviços consumidores mantêm validação de propriedade e preferências antes da resolução; não importam repository interno de configurações. Adaptar a interface existente para transportar a identidade da conta, sem aceitar credencial na requisição de geração. Reutilizar schemas de domínio e seus limites, validação local Zod, prazo de timeout incluindo leitura e limite de bytes.

Implementar adaptadores oficiais para os cinco provedores. OpenAI conserva Responses; os demais usam seus protocolos documentados para saída estruturada/JSON e normalizam o envelope para dados ainda sujeitos à validação local. Suporte de JSON não é presumido equivalente a schema estrito. O catálogo inclui somente modelos que passam fixtures dos três fluxos; restrições de schema por provedor são traduzidas sem relaxar os schemas locais. HTTP não segue redirecionamentos; hosts e caminhos-base são fixos, o ID do modelo vem do catálogo e segredos vão somente em cabeçalhos de autenticação, nunca query string ou prompt. Não ativar web search, ferramentas ou execução de código.

Falhas são mapeadas para códigos sanitizados: indisponibilidade, credencial pessoal recusada, limite, timeout e resposta inválida. Não registrar corpo bruto, headers, prompts completos ou configuração descriptografada. Manter uma tentativa por ação, sem fallback ou repetição automática. Prévia e confirmação continuam sob recibos atuais; troca de provedor não muda validade de recibos nem provoca regeneração na confirmação.

Referências oficiais consultadas para separar protocolos e capacidades; revalidar modelos na implementação:

- [Gemini: API keys](https://ai.google.dev/gemini-api/docs/api-key) e [Structured output](https://ai.google.dev/gemini-api/docs/structured-output).
- [Claude: Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- [OpenAI: Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
- [DeepSeek: Responses API](https://api-docs.deepseek.com/api/create-response/).
- [Kimi: API overview](https://www.kimi.ai/help/kimi-api/api-overview).

### 4. Ambiente e padrão privado

Adicionar `GEMINI_API_KEY` e `GEMINI_MODEL` como par opcional do padrão compartilhado. O valor fornecido pelo responsável é destinado apenas a `GEMINI_API_KEY` no `.env` ignorado ou secret manager da implantação; não será copiado a arquivos de planejamento, fixtures ou `.env.example`. A validade dessa chave não foi testada nesta proposta. `AI_RECEIPT_KEY` permanece segredo separado obrigatório para os fluxos de geração, inclusive pessoais; remover seu acoplamento com o par legado. Timeout e limite de bytes existentes permanecem. Detectar variáveis legadas `AI_API_KEY`/`AI_MODEL` e falhar com instrução de migração contendo apenas seus nomes, evitando conversão silenciosa. Sem par Gemini, conta padrão recebe indisponibilidade e conta pessoal continua utilizável.

### 5. Limites persistidos

Usar MySQL para reservas atômicas de uso e leases de concorrência com expiração, compartilhados entre processos. Antes da chamada, reservar cotas aplicáveis em transação curta; não manter transação aberta durante HTTP. Padrão inicial configurável: 5 chamadas por minuto e 1 em andamento por conta (todos os modos); 20 chamadas por dia UTC por conta e 500 por dia UTC global no modo compartilhado; concorrência compartilhada global 5. Variáveis `AI_USER_REQUESTS_PER_MINUTE`, `AI_USER_MAX_CONCURRENCY`, `AI_DEFAULT_USER_DAILY_LIMIT`, `AI_DEFAULT_GLOBAL_DAILY_LIMIT` e `AI_DEFAULT_GLOBAL_MAX_CONCURRENCY` aceitam inteiros positivos. Chamadas iniciadas consomem cota mesmo em erro externo; recusas locais não consomem. Liberação de lease em finally e expiração por prazo superior ao timeout evitam bloqueio após crash. Limite retorna 429 e orientação de espera sem divulgar consumo de outras contas. A chave pessoal não consome orçamento compartilhado.

### 6. Interface e proteção contra divulgação

Integrar seção na `ProfilePage` respeitando componentes e visual existentes. Exibir padrão gratuito sujeito a limites e opção pessoal com provedor/modelo e campo password para colar chave. Exigir confirmação antes de apagar a configuração pessoal; não guardar segredos em localStorage, sessionStorage, query cache, analytics ou relatórios de erro. Limpar campo após sucesso/unmount/logout. Na falha, manter seleção editável e distinguir do estado salvo. Solicitar confirmação do usuário antes do envio do primeiro conteúdo ao provedor por escolha explícita do modo pessoal e aviso sobre destino/custos.

Testes com chaves-canário sintéticas devem provar ausência em GET/PUT/DELETE, erros, logs, prompts e bundle, inclusive quando o upstream reflete headers ou tenta devolver a credencial em texto. O servidor não oferece rota de leitura do segredo padrão. Credenciais nunca são incluídas no contexto do modelo; saída contendo canário/segredo conhecido deve ser rejeitada antes da prévia e logs. Não prometer imunidade absoluta a comprometimento do servidor: controles verificáveis cobrem os canais de exposição da aplicação.

## Risks / Trade-offs

- Cotas externas e modelos mudam → catálogo explícito, fixtures por adaptador e configuração do padrão pelo operador; nunca garantir gratuidade ilimitada do provedor.
- Segredo pessoal precisa ser recuperável para HTTP → cifra autenticada com chave fora do banco e rotinas privadas de rotação; hashing não atende ao caso.
- Chave de criptografia perdida → recuperação depende de backup privado; sem ele usuários precisam cadastrar novas chaves.
- Chave padrão já foi compartilhada no chat → tratar sua substituição privada antes de produção como medida operacional, sem reproduzir valor ou bloquear o planejamento.
- Catálogo atualizado remove um modelo salvo → configuração continua visível, novas gerações falham recuperavelmente e solicitam seleção compatível; não trocar modelo silenciosamente.
- Resolução capturada pode terminar após remoção → requisição em andamento usa seu snapshot; próximas chamadas não podem usar a chave removida.

## Migration Plan

1. Durante apply registrar Git e preservar `.env` e alterações preexistentes; usar branch de trabalho adequada.
2. Adicionar migrations versionadas para configuração e contadores/leases, mantendo `synchronize: false`; conferir aplicação em MySQL isolado e integridade das contas existentes.
3. Configurar novos segredos e limites somente no ambiente privado. Migrar explicitamente o padrão para Gemini, remover par global legado e conservar recibos existentes. Usar a credencial fornecida apenas no `.env`/secret manager, sem imprimi-la; validar com chamada controlada autorizada na implantação, sem chamadas pagas nos testes automatizados.
4. Publicar backend e web compatíveis após checks; verificar configuração com duas contas, os três fluxos e ausência de segredos em tráfego de resposta e bundle.
5. Rollback operacional retorna para versão compatível ou desliga somente geração; não apontar chave Gemini para código OpenAI antigo. Preservar tabela criptografada, chave de cifra, dados e recibos. Reversão destrutiva da migration exige decisão explícita e backup privado.
6. Com apply concluído e checks aprovados, preparar manifesto explícito e snapshots semânticos, executar `pnpm openspec:finish` para commit único, sync e archive locais; sem push ou tag.
