# Design

## Context

Veja `proposal.md` para a motivação e as specs desta mudança para o comportamento esperado. `add-user-authentication` já foi aplicada e versionada; suas contas, credenciais, identidades Google e sessões são a base desta mudança. A spec principal agora existe e o delta `MODIFIED` altera os requisitos que permitiam acesso imediato após cadastro local.

## Goals / Non-Goals

**Goals:**

- Acrescentar desafios temporários sem transformar códigos de e-mail em sessões de acesso.
- Garantir limites e consumo únicos em múltiplas instâncias da API usando MySQL.
- Integrar confirmação e recuperação ao mesmo modelo de identidade e sessão da autenticação.

**Non-Goals:**

- Recuperar uma identidade Google perdida por prova apenas do endereço de e-mail, mesclar contas ou oferecer suporte manual para transferir dados entre identidades.
- Criar senha local para contas exclusivas do Google durante **Esqueci minha senha**.
- Oferecer links mágicos ou autenticação permanente por e-mail; os dois fluxos usam códigos.

## Decisions

### 1. Sequência e estado da conta

Aplicar esta mudança após `add-user-authentication`. Adicionar `email_verified_at` à conta. Cadastro e login local com credenciais válidas de endereço pendente entregam apenas um contexto curto de verificação, vinculado à conta e guardado em cookie `HttpOnly`; não concedem sessão com acesso privado. O middleware dos endpoints privados verifica o estado confirmado no servidor, inclusive para sessões já existentes. Depois de confirmar o código, a pessoa faz login para obter uma sessão regular. Contas Google exclusivas recebem o estado confirmado quando a resposta OIDC válida traz `email_verified=true`; uma identidade não conhecida nunca é vinculada por coincidência de e-mail.

Essa decisão mantém a senha e o Google como meios de autenticação e usa o código somente para provar controle do endereço local. A alternativa de aceitar a sessão regular e esconder apenas a UI deixaria endpoints privados expostos. A alternativa de confirmar uma conta local pelo e-mail de um Google não vinculado violaria a regra de vínculo explícito da autenticação.

### 2. Desafios e limites persistidos

Usar uma tabela de desafios com finalidade (`verify_email` ou `reset_password`), identificador de conta, resumo do código, emissão, expiração, tentativas, estado e consumo; manter no máximo um desafio ativo por conta e finalidade. Gerar seis dígitos com fonte criptográfica e guardar somente HMAC do código com chave do servidor e identificador do desafio. HMAC, em vez de hash simples, impede busca offline prática no espaço pequeno de seis dígitos. Reenvio invalida desafio anterior. Confirmar ou bloquear usa transação e bloqueio da linha para evitar consumo simultâneo.

Persistir contadores por HMAC do e-mail canônico e por origem da requisição, mesmo para e-mails inexistentes, com janelas de uma hora e intervalo de 60 segundos. A tentativa de validação incrementa antes de responder e bloqueia após cinco erros; limites adicionais de origem protegem os endpoints públicos. O servidor devolve erros controlados e `Retry-After` quando aplicável sem expor dados da conta. Limites persistidos em MySQL funcionam após reinício e entre instâncias. A alternativa de contadores em memória falharia nesses casos.

### 3. Entrega de e-mail

Adicionar adaptador de envio SMTP com configuração validada na inicialização e templates separados para confirmação e redefinição. Persistir desafio e item de envio em transação; cifrar o código e o destinatário no item de entrega com chave separada do HMAC, para que o worker envie sem manter códigos em claro no banco. Apagar o payload cifrado após entrega e registrar somente metadados seguros. O worker usa reserva atômica, repetição com atraso e descarta entrega de desafio revogado ou vencido; o prazo de dez minutos começa na entrega e é gravado no desafio. A interface da solicitação informa para verificar a caixa de entrada sem prometer que a entrega já ocorreu.

Essa fila transacional evita perder e-mail entre a gravação do desafio e o envio. Envio direto na requisição simplificaria o código, mas uma falha do SMTP após o commit poderia deixar a pessoa presa com um código nunca entregue. Testes usam transporte de e-mail controlado, sem substituir o MySQL de integração por mocks.

### 4. Recuperação local em duas etapas

`POST /auth/password-recovery/request` recebe e-mail e responde de modo uniforme para conta local, conta Google exclusiva e e-mail desconhecido. `POST /auth/password-recovery/verify` recebe e-mail e código; para desafio válido, consome o código e cria autorização opaca de redefinição de cinco minutos, cujo segredo fica somente em cookie `HttpOnly`, `Secure` em HTTPS e `SameSite=Lax`, e cujo hash fica no banco. `POST /auth/password-recovery/reset` recebe a nova senha e exige essa autorização, além da proteção de origem/CSRF da autenticação. A transação troca o hash da senha, confirma o e-mail se estava pendente (o código provou seu controle), consome a autorização e revoga todas as sessões da conta; não cria sessão nova. Nova solicitação invalida códigos e autorizações anteriores.

O grant separado permite validar o código antes de pedir a nova senha sem passar código ou token por URL ou armazenamento JavaScript. A alternativa de redefinir com código e senha em uma única chamada é mais simples, mas não oferece a etapa de validação pedida para a experiência proposta. O e-mail público e a resposta da solicitação sempre incluem orientação geral para **Entrar com Google** e usar a recuperação do Google quando necessário, sem revelar qual conta existe.

### 5. Fronteiras e interface

O módulo de autenticação é dono das contas, sessões e regras; serviços de confirmação e recuperação usam suas interfaces públicas, sem acesso a repositories internos de outros módulos. Schemas Zod em `packages/contracts` validam os corpos e padronizam respostas. A web organiza formulários de confirmação e recuperação na funcionalidade de acesso; mantém os códigos apenas em estado de formulário e não em URL. Erros de provedor ou de banco são registrados sem senha, código, token, payload de e-mail, hash ou stack em respostas públicas. Campos têm rótulos, foco visível, avisos anunciados e estados úteis em 320 px.

## Risks / Trade-offs

- [Mudança de acesso para contas locais já existentes] → A migration deixa contas com senha local sem confirmação como pendentes e o servidor bloqueia acesso privado até a verificação; planejar comunicação e testar o reenvio antes do deploy.
- [Fila demora além do prazo do código] → Iniciar a validade ao enviar, descartar itens revogados e expor reenvio após o intervalo; monitorar backlog sem registrar payload.
- [Resposta genérica reduz diagnóstico para a pessoa] → Mostrar instruções universais para e-mail e Google, enquanto métricas internas agregadas acompanham falhas de entrega e limites.
- [Ataque por força bruta ou requisições paralelas] → HMAC com chave, limites persistidos por endereço/origem e transações que consomem desafios e autorizações uma única vez.
- [Dependência do provedor Google] → Conta exclusiva do Google depende da recuperação da identidade original junto ao Google; a EduTrack não promete recuperação independente nesse caso.

## Migration Plan

1. Partir da implementação concluída de `add-user-authentication` e reconciliar sua spec principal pelo delta `MODIFIED`, substituindo a permissão de acesso imediato para contas locais pela exigência de confirmação.
2. Introduzir migrations de estado de confirmação, desafios, limites, autorizações e envio. Para dados preexistentes, manter contas com senha local pendentes até confirmação; marcar Google exclusivo como confirmado somente onde a identidade prévia satisfazia a validação OIDC exigida. O middleware deve negar acesso privado de contas pendentes mesmo se existir sessão antiga.
3. Configurar chaves e SMTP, iniciar o worker de entrega e confirmar funcionamento antes de expor cadastro e recuperação. Implantar API e web com os novos fluxos; acompanhar falhas de envio e tentativas bloqueadas.
4. Em rollback, desabilitar emissão dos novos fluxos e reverter aplicação/API; manter tabelas e estado de confirmação para uma nova implantação, evitando reabrir automaticamente acesso privado a contas pendentes. Limpar dados temporários expirados por rotina de retenção.
