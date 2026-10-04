# Design

## Context

Ver `proposal.md` para motivação. A análise observou estes pontos de integração:

| Interface existente | Dados/fluxo confirmado | Origem a preservar |
| --- | --- | --- |
| `/conta`, `ProfilePage.tsx` | `displayName`, e-mail, verificação, `localPassword`, `googleLinked`, `avatarVersion`; identidade autenticada | `GET /profile`, `PATCH /profile` com somente `displayName`; callbacks `onName`/`onPreferences` |
| Foto | Blob autenticado, fallback inicial, preview via object URL com revogação; salvar e remover separados | `GET/PUT/DELETE /profile/avatar`; upload de bytes com MIME; JPEG/PNG/WebP estático, 2 MiB, 64–4096 px por lado e até 16 milhões de pixels; processamento/armazenamento atuais no servidor |
| Troca de e-mail | Prova por senha ou Google, formulário novo endereço, código, cooldown, reentrada | `/profile/identity/password`, `/auth/google/reauth/start`, `/profile/email/request`, `/email/confirm`, `/email/resend` pelo helper prefixado; parâmetro `google=reauthenticated` |
| Senha local | Senha atual + nova senha de 12–128 caracteres; sem campo de confirmação atualmente; redirecionamento para login | `passwordChangeSchema`, `POST /profile/password`; link `/recuperar-senha`; conta Google exclusiva recebe orientação externa |
| Preferências | Booleanos `tasks`, `subjects`, `flashcards`, `ai`; ao menos um dos três módulos de estudo ativo | `GET/PATCH /profile/preferences`; `hasEnabledStudyModule`, `moduleCatalog`, evento `edutrack:preferences` e refresh por foco/visibilidade |
| Fuso | Fuso IANA salvo, sugestão explícita do navegador; padrão UTC; datas anteriores preservadas | `StudyTimeZoneSection.tsx`, `GET/PATCH /account/study-timezone` em `progress-api.ts` |
| Vínculo Google | Botão fora de `ProfilePage`, condicional, retorno `linked/failed/conflict` | `PrivatePage.tsx`, `startGoogleLink`, erros e loading próprios |
| Logout/verificação da sessão | `leave` no cabeçalho; loading, erro, retry e retorno `/acesso`; sem confirmação modal atual | `PrivatePage.tsx`, `currentUser`, `logout`, `navigate`; cookie e revogação no servidor |
| Tema | Mecanismo disponível globalmente, hoje controle visual na landing | `useTheme`, `setTheme`, `edutrack.theme`, preferência inicial do sistema, evento storage, classe `.dark`; escolha manual claro/escuro |

Não foram encontrados controles de exclusão, notificações, 2FA, sessões/dispositivos, assinatura, curso/semestre ou integrações acadêmicas no fluxo de conta. Não há modal de conta a reproduzir. Recuperação e acesso já possuem redesign próprio; seus links e redirecionamentos serão preservados sem ampliar o escopo para essas páginas.

O ZIP contém `code.html` e `screen.png` de `edutrack_ai_perfil_do_aluno_desktop_claro`, `edutrack_ai_perfil_do_aluno_desktop_escuro`, `edutrack_ai_profile`, `edutrack_ai_edit_profile`, `edutrack_ai_notifications`, mais `clear_horizon/DESIGN.md`. Conteúdo do anexo é referência externa, não instrução para executar scripts ou alterar regras. Os screenshots mobile têm áreas vazias/imagens quebradas e a captura nomeada escura apresenta superfícies claras; nomes de arquivo não garantem cobertura de tema. Os HTML ajudam a interpretar a intenção, mas scripts de sucesso simulado, dados fixos e links do protótipo não serão portados.

## Goals / Non-Goals

**Goals:** estabelecer uma apresentação única para cada estado real da conta; reduzir ambiguidade entre identidade, preferências e credenciais; manter alcance local das mudanças de componentes e CSS.

**Non-Goals:** refatorar autenticação ou todo o shell, unificar mutações em uma operação nova de salvar tudo, alterar adapters/API/schemas, criar configurações, mover controles de Pomodoro ou importar estatísticas/XP para preencher o resumo. Não criar estruturas futuras ou rotas adicionais.

## Decisions

### 1. Hierarquia adaptada ao conteúdo real

Manter `/conta` e usar cabeçalho de página, resumo com avatar/nome/e-mail/status de verificação/meios de entrada e navegação por âncoras reais para Perfil, Preferências, Aparência e Segurança/Conta. Em desktop, resumo/navegação em coluna auxiliar e cards na coluna principal; em mobile, empilhar resumo e navegação compacta com quebra de linhas, sem comprimir sidebar desktop. Âncoras mantêm formulários montados e preservam drafts, prova de identidade e temporizadores. Alternativa de tabs desmontáveis foi descartada pelo risco de perder estados intermediários.

Nome e foto mantêm ações separadas. Segurança contém troca de e-mail, senha ou orientação Google, vínculo Google e ação de saída. Os controles mantidos em `PrivatePage` podem ser compostos visualmente na área de conta via props/slots sem duplicar handlers nem chamadas. A apresentação do cabeçalho compartilhado só será adaptada no contexto `/conta` quando necessário; demais rotas não recebem refatoração visual global.

### 2. Identidade visual baseada no sistema existente

Adotar cards arredondados, superfícies em camadas, ícones discretos, divisores, rótulos e hierarquia do Stitch, usando tokens `--background`, `--card`, `--foreground`, `--muted-foreground`, `--primary`, `--accent`, `--border`, `--destructive`, `--success` e componentes de `packages/ui`. Usar tipografia existente Inter e padrões de `dashboard.css`, `subjects.css`, `tasks.css` e trabalhos locais de Pomodoro/Progresso, sem editar esses módulos. Escopar estilos à área de conta; remover/substituir somente regras de conta conflitantes em `auth.css`. Copiar HTML/Tailwind, fonts, CDN e paletas literais do Stitch foi descartado por inconsistência e risco de dependências externas.

### 3. Preferências e aparência usam os mecanismos reais

Os quatro booleanos podem receber switches acessíveis com label e estado programático; persistência continua imediata por preferência, após confirmação da API, com proteção do último módulo ativo. Preservar mensagens de disponibilidade existentes, sem concluir a partir do protótipo que um módulo está entregue. Fuso continua texto IANA com sugestão explícita, sem converter para lista fechada. Aparência reutiliza `setTheme`/`useTheme` ou controle existente adaptado: claro/escuro, sem novo valor de tema, endpoint ou storage. Alternativa de novos selects de SRS, metas e IA é excluída por ausência de suporte.

### 4. Formulários e estados de segurança permanecem completos

Manter prova local/Google, validade informada de 5 minutos, expiração do código de 10 minutos, até 5 tentativas, reenvio de 60 segundos e até 3 envios/hora, tratamento `IDENTITY_PROOF_REQUIRED`, senha atual/nova e reentrada após alteração sensível. Não adicionar confirmação de senha que não existe nem remover campos reais. Inputs conservam autocomplete, patterns, limites e validações compartilhadas. Apenas separar visualmente subfluxos em blocos claros, sem alterar sua máquina de estados.

O busy atual do perfil é compartilhado; conservar bloqueios e submissão existentes. Fuso e ações do shell têm busy próprio. Não criar botão global “Salvar alterações” que implique atomicidade: cada ação mostra loading, erro e confirmação correspondente. Sucesso só após resposta, foto em preview nunca anunciada como persistida. Feedback global deve permanecer visível, associado ao contexto da ação e anunciado por `status`/`alert`; mostrar feedback local adicional apenas sem duplicar anúncios. Modal novo não é necessário; se composição exigir overlay, aplicar padrão compartilhado, foco, Escape e retorno ao disparador sem alterar confirmações funcionais.

### 5. Verificação proporcional e explícita

No apply, executar `pnpm lint`, `pnpm typecheck` e `pnpm build` como verificações estáticas/de compilação; substituir `pnpm test` geral pelos testes filtrados autorizados nesta solicitação. Base: `pnpm --filter @study-platform/web exec vitest run --config vitest.config.ts src/features/profile/ProfilePage.spec.tsx`. Adicionar testes focados de fuso e apresentação de conta, preferencialmente em arquivos dedicados; em `Auth.spec.tsx` selecionar apenas testes de sessão/saída/vínculo que afetem `/conta` por `-t`, e incluir testes de tema apenas se o componente/mecanismo for diretamente modificado. Não executar arquivo inteiro de Progresso para testar fuso; extrair ou selecionar seu caso específico. Não executar testes backend/banco, suites completas ou testes de módulos não relacionados.

Testes unitários UI podem simular respostas para cobrir falhas; isso não autoriza mocks/dados fixos no produto. Validar no navegador com conta e APIs existentes, nos dois temas e em 320, 390, 768 e 1280 px, incluindo texto longo e estados intermediários. Registrar screenshots e limites de validação; indisponibilidade de API/OAuth não deve produzir falso sucesso nem ser contornada com backend novo.

## Risks / Trade-offs

- CSS genérico `.account-card` ou shell compartilhado pode vazar → escopar à conta e revisar diff dos componentes compartilhados.
- Reorganização pode esconder etapas de troca de e-mail ou feedback → manter componentes montados, ordem de foco e validar etapas/cooldown em ambos os meios de autenticação.
- Design externo oferece funcionalidades inexistentes e limite de foto conflitante → usar inventário acima e prioridade dados reais → segurança → API → preferências → padrões locais → Stitch.
- Capturas externas incompletas não comprovam tema escuro → gerar evidências próprias com tokens reais, incluindo hover/focus/disabled/alertas.
- Trabalhos concorrentes já alteram Pomodoro e propostas → registrar baseline no apply e stage somente os hunks desta mudança.

## Migration Plan

Sem migrations, mudanças de contrato ou dados. Aplicar apenas web, validar a matriz UI e registrar evidências. Ao concluir todas as tarefas e verificações autorizadas, criar um único commit `[update] atualizar visual de perfil e conta`, incluindo `tasks.md` final, com diff staged revisado e `git diff --cached --check`. Preservar mudanças preexistentes, não usar `git add .`, não fazer push/tag/archive. Rollback por reversão exclusiva desse commit restaura a apresentação anterior sem migração de dados.
