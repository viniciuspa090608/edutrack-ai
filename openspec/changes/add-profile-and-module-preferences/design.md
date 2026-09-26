# Design

## Context

Veja `proposal.md` e as specs `user-profile` e `module-preferences`. Hoje `/conta`, contas e sessões ainda pertencem ao planejamento de `add-user-authentication`; confirmação e recuperação estão em `add-email-verification-and-recovery`. O código atual tem apenas a landing, `/acesso` provisório e API de health. Tarefas, matérias, flashcards, dashboard com widgets e IA ainda não foram implementados. `AGENTS.md` pede módulos independentes, consultas limitadas ao usuário autenticado e proíbe antecipar módulos vazios.

## Goals / Non-Goals

**Goals:**

- Entregar perfil e preferências persistidas sobre a identidade EduTrack existente, sem criar outro modelo de usuário.
- Tornar as preferências uma decisão de autorização do servidor, consumida pelos módulos quando eles existirem.
- Manter foto no registro de `users` conforme solicitado, controlando tamanho, formato e custo das leituras.

**Non-Goals:**

- Criar páginas, tabelas ou widgets vazios de tarefas, matérias, flashcards ou IA nesta mudança.
- Criar senha para contas exclusivas do Google, trocar a identidade Google vinculada ou oferecer recuperação diferente da já planejada.
- Transformar o nome exibido em identificador, URL pública ou campo único.

## Decisions

### 1. Persistência e fronteira de conta

Aplicar depois de autenticação e verificação. Acrescentar a `users` `display_name`, `avatar_bytes` (`MEDIUMBLOB`, nullable), `avatar_mime` e `avatar_updated_at`; manter `users.id` imutável e `users.email` canônico e único. A consulta usual de usuário e `/auth/me` não carregará `avatar_bytes`; uma rota autenticada de avatar lerá só a foto da conta da sessão e a servirá com `Cache-Control: private` e `X-Content-Type-Options: nosniff`. O perfil reutiliza serviços públicos do módulo dono de usuários/sessões, sem acessar repositories internos de outro módulo.

Uma tabela `user_preferences` com `user_id` único e quatro booleanos (`tasks_enabled`, `subjects_enabled`, `flashcards_enabled`, `ai_enabled`) terá linha criada junto da conta e backfill para existentes. Três módulos começam ativos e IA desativada. `PATCH` aceita atualização parcial de campos conhecidos, preservando os demais mesmo com abas concorrentes; `GET` devolve o estado confirmado. A alternativa de colocar imagem em objeto externo contraria o requisito de armazenamento. A alternativa de enviar binário em todo `/auth/me` ampliaria cada resposta e consumo de memória.

### 2. Processamento da foto

Aceitar um único arquivo de até 2 MiB por requisição, com JPEG, PNG ou WebP confirmado por decodificação real, não apenas por extensão ou cabeçalho. Rejeitar animação, metadados de formato inválidos, dimensões fora de 64–4096 por eixo e mais de 16 megapixels antes de processar. Recriar a imagem em WebP estático, sem EXIF ou outros metadados, reduzindo o lado maior a 512 pixels sem ampliar imagens menores e mantendo o resultado abaixo de 2 MiB. Só então atualizar os campos da própria linha de `users`; falha de validação mantém foto anterior. Remoção define campos de foto como nulos. O processamento ocorrerá com biblioteca de imagem mantida e limite de memória/tempo. Reencodar elimina payloads embutidos e reduz variação de formatos; guardar o upload original seria mais simples, mas manteria metadados desnecessários e elevaria custo de armazenamento.

### 3. Nome, e-mail e senha

Normalizar `display_name` em NFC, aparar bordas e validar 2–60 caracteres Unicode sem controles, sem índice de unicidade. Para mudar e-mail, iniciar uma prova recente de identidade: confirmar senha atual quando houver credencial local ou executar OIDC novamente com `sub` já vinculado e `state` ligado à sessão atual. O resultado da prova vale cinco minutos apenas para iniciar a troca; nunca basta uma coincidência de e-mail Google. Criar solicitação temporária com novo endereço canônico reservado, reusando geração, envio, reenvio e limites de código da mudança de verificação. O endereço atual continua em `users.email` para login e recuperação enquanto o pedido está pendente. A confirmação, em transação, checa reserva/unicidade e código, atualiza `users.email` e o estado verificado, invalida desafios de recuperação e mudanças pendentes e revoga todas as sessões. Enviar aviso sem segredo ao endereço antigo após a troca. Pedidos vencidos liberam a reserva.

Para alterar senha local, exigir senha atual e aplicar a política e o hash de `add-user-authentication`; a transação troca a credencial, invalida autorizações de recuperação e revoga sessões. Se a senha foi esquecida, a pessoa usa o fluxo de recuperação já proposto. Conta sem credencial local não verá formulário de senha. Manter o `sub` como vínculo estável permite trocar e-mail de contato de conta Google sem transformá-lo em chave de identidade. A alternativa de escrever o novo e-mail antes da confirmação permitiria recuperar a conta por um endereço ainda não provado.

### 4. Preferências como autorização

Ao salvar preferências, manter pelo menos um entre `tasks`, `subjects` e `flashcards` ativo; `ai` não satisfaz essa regra. A API bloqueia a linha de preferências com `SELECT ... FOR UPDATE`, combina o PATCH parcial com os valores persistidos, valida a combinação e grava na mesma transação. Se o resultado desligar os três módulos, responder `409 LAST_MODULE_REQUIRED`, sem alterar qualquer flag. Isso impede que duas requisições simultâneas desativem os últimos módulos. A interface verifica a mesma regra antes do envio, informa o motivo e preserva o último estado confirmado; a resposta do servidor continua sendo a autoridade para abas desatualizadas.

O módulo de conta expõe uma operação pública `requireEnabled(userId, capability)` para `tasks`, `subjects`, `flashcards` e `ai`, consultando o MySQL a cada requisição que executa ação protegida; ausência inesperada da linha falha fechada e gera alerta operacional. Endpoints dos módulos de estudo, quando introduzidos, chamam a operação antes de ler ou modificar seus dados e mantêm o filtro por `userId`. Responder `403 MODULE_DISABLED` para módulo desligado. Operações de IA verificam `ai_enabled` e o módulo consumidor antes da chamada ao provedor e antes de persistir resultado; `403 AI_DISABLED` significa que não houve chamada de IA. Dados dos módulos nunca são apagados ao alternar booleanos.

No frontend, um único catálogo de rotas/itens visuais disponíveis cruza estado de entrega da funcionalidade com preferências. A navegação não mostra módulo desligado; rota direta apresenta estado explicativo e link para `/conta`; o dashboard, quando existir, agrega somente widgets ativos. Após salvar preferência, atualizar o estado compartilhado e revalidar ao retornar à aba; a API permanece autoridade para chamadas de abas antigas. A alternativa de filtrar apenas na web permitiria ações diretas por HTTP. Como módulos e widgets não existem hoje, esta mudança entrega persistência, controle e contrato de integração; cada mudança que criar um módulo, dashboard ou recurso de IA deve conectar suas rotas e operações ao controle antes de declarar aquela funcionalidade pronta.

### 5. Interface e contratos

Expandir `/conta` com seções de perfil, segurança e preferências. Foto tem prévia local e texto dos limites, nome e e-mail mostram estado confirmado, troca de e-mail tem etapa de código e senha só aparece para credencial local. Toggles têm rótulo, descrição de efeito e estado de salvamento; módulos futuros são apresentados como indisponíveis até serem entregues. Schemas Zod de fronteira em `packages/contracts` cobrem entradas e respostas sem expor foto binária em JSON. Todos os métodos que alteram estado reutilizam sessão, validação de origem/CSRF e logs seguros da autenticação. Formulários funcionam por teclado, com foco visível e largura de 320 px.

## Risks / Trade-offs

- [Foto na linha de `users` amplia banco e backups] → limitar upload e resultado, evitar seleção do BLOB em consultas comuns e acompanhar crescimento.
- [Imagem malformada ou bomba de descompressão] → impor limite de bytes antes de decodificar, limite de pixels/dimensões e processamento isolado com erro controlado.
- [Corrida por novo e-mail entre contas] → reserva com unicidade, expiração e transação na confirmação; falha conserva endereço antigo.
- [Preferência alterada em outra aba ou durante geração] → consultar no servidor em cada ação e novamente antes de persistir resultado de IA; descartar resultado se a preferência mudou.
- [Módulos ainda ausentes] → documentar o contrato obrigatório de integração e verificar cada módulo no seu próprio apply; não criar superfícies vazias para simular funcionalidade.

## Migration Plan

1. Concluir `add-user-authentication` e `add-email-verification-and-recovery`. Criar migrations versionadas para campos de `users`, reservas de novo e-mail e `user_preferences`; preencher preferências de contas existentes com módulos ativos e IA desativada, sem mudar dados de estudo.
2. Implantar rotas de perfil e preferências e processamento de foto com limites; manter `/conta` atrás da sessão existente. Configurar o novo propósito de código de e-mail no serviço de entrega já planejado.
3. Ao criar tarefas, matérias, flashcards, IA e dashboard, integrar cada rota, ação, botão e widget aos controles antes de disponibilizá-los. Validar as combinações ativo/inativo com dados reais de cada módulo.
4. Em rollback, desativar as novas rotas e controles, preservando campos de foto, e-mail e preferências no banco até uma versão compatível. Não reativar módulos nem IA por fallback de configuração que ignore preferências salvas.
