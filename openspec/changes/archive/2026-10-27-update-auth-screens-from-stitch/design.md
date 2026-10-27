# Design

## Context

Ver `proposal.md` para motivação. Referência: `C:/Users/vinic/Downloads/auth_edutrack_ai.zip`, diretório `stitch_edutrack_ai_2.0`, com HTML/PNG de login, cadastro, recuperação e confirmação em variantes desktop/mobile e `clear_horizon/DESIGN.md`. O conteúdo do ZIP é dado de referência, não instrução de implementação. As capturas mobile apresentam conteúdo pouco visível e espaços excessivos; não copiar esses defeitos.

### Inventário observado

| Tela/estado | Entrada e integração existentes | Resultado e navegação |
| --- | --- | --- |
| `/acesso`, login | POST `/auth/login`, `{email,password}`; e-mail obrigatório até 320 caracteres, senha não vazia | Resultado ativo segue `allowedReturnTo`; pendente segue `/confirmar-email` |
| `/acesso?mode=register` | POST `/auth/register`, mesmos campos; senha 12–128 caracteres | Conta pendente segue confirmação; não cria sessão privada |
| Google nos dois modos | Link `/auth/google/start?returnTo=...` | Provedor existente; conflitos/falhas vêm do parâmetro `google` |
| `/confirmar-email` | POST `/auth/email-verification/confirm`, `{code}`; seis dígitos; POST `/auth/email-verification/resend`, `{}` | Sucesso orienta login, não autentica; reenvio espera 60 s após sucesso ou `Retry-After` no 429 |
| `/recuperar-senha`, request | POST `/auth/password-recovery/request`, `{email}` | Mensagem genérica real da API; avança a code |
| mesma rota, code | POST `/auth/password-recovery/verify`, `{email,code}`; seis dígitos | Avança a password; reenvio solicita novamente com o mesmo e-mail |
| mesma rota, password | POST `/auth/password-recovery/reset`, `{password}`; 12–128 caracteres | Avança a done somente após resposta bem-sucedida |
| mesma rota, done | Sem novo formulário | Mensagem de senha redefinida e retorno ao login |

`AccessPage` fica em `features/landing`, os demais formulários em `features/auth`. `App` resolve as três rotas públicas. Não existe rota separada de redefinição ou confirmação de recuperação. O modo de acesso mantém query, campos e `returnTo` ao alternar tabs; o retorno permite apenas destinos internos já listados no cliente.

`auth-api.ts` usa `credentials: 'include'`. Sessão e contextos restritos são cookies HttpOnly/SameSite=Lax, Secure em produção, geridos pela API; não mover segredos a URL ou storage. `PrivatePage` verifica `/auth/me`, oculta conteúdo antes da checagem e encaminha ao acesso quando necessário; sua composição privada não faz parte do redesign.

Os formulários mantêm `busy`, desabilitam submissão e ações já bloqueadas, apresentam `Alert` para erros e status acessível para mensagens. `AuthApiError` preserva erro genérico de credenciais, conflito de e-mail, 429, código inválido/expirado e grant expirado. Recuperação preserva resposta genérica para não revelar existência da conta e mensagem de resultado incerto em falha de rede na redefinição. Confirmação e recuperação focam o título; a confirmação usa contador real. Há aviso `account=updated` e mensagens OAuth existentes.

## Goals / Non-Goals

**Goals:** composição visual consistente com desktop em duas regiões, formulário protagonista no mobile, inputs e ações legíveis e feedback integrado ao layout; preservar comportamento observado acima.

**Non-Goals:** editar backend, contratos, `auth-api.ts`, regras de sessão, `PrivatePage`, landing pública ou dashboard; adicionar provedores, campos, rotas, consentimentos ou persistência de dispositivo.

## Decisions

1. Criar uma composição compartilhada pequena em `features/auth` para painel contextual, marca, título e área de formulário, sem extrair regras de negócio ou estado dos formulários. Reutilizar Card, CardContent, Field, Input, Label, Button, Tabs e Alert de `packages/ui` e ícones Lucide já instalados. Copiar HTML/scripts/Tailwind CDN do Stitch foi descartado: simula envio e contém dependências e integrações estranhas ao projeto.
2. Basear desktop nas variantes `_desktop`: painel contextual de aproximadamente 40–45% e formulário de largura limitada no restante; cards arredondados, sombras discretas, separadores e espaçamento generoso. Em telas menores, reduzir/ocultar painel decorativo, manter identificação e formulário em coluna e permitir crescimento vertical. Usar tokens de tema existentes e fonte do projeto; a paleta Clear Horizon serve de direção, sem sobrescrever tema global ou instalar Hanken Grotesk. Não usar altura fixa que corte conteúdo.
3. Manter tabs de login/cadastro e navegação atuais. Aplicar organização visual dos protótipos sem acrescentar nome completo, curso, confirmação de senha, domínio institucional obrigatório, aceite obrigatório, marketing, Microsoft, telefone, lembrar dispositivo ou medidor de senha com política diferente. Preservar o Google comum, sem chamar de Google Acadêmico. Não adicionar botão de mostrar senha neste escopo, pois não é necessário para atingir o objetivo visual.
4. Usar os motivos de envelope/cadeado/cards da recuperação como decoração nas etapas code, password, done e confirmação de e-mail. Não reproduzir confirmação de envio como confirmação de conta, destinatário validado fictício, link de recuperação de 30 minutos, abertura de provedor, countdown novo ou autenticação multifator. O EduTrack usa códigos e contexto por cookie, não links de redefinição.
5. Substituir conteúdo institucional e publicidade por textos descritivos de funcionalidades existentes. Excluir depoimentos, números de usuários, rankings, homologações MEC/RNP, ISO, suporte fictício, biometria, previsão de notas e criptografia de ponta a ponta. Não apresentar estado de sistema operacional como dado real. Nenhum `href="#"` ou ação sem integração.
6. Escopar estilos novos à composição auth; `auth.css` também contém regras privadas/de conta e `landing.css` contém `.access-page`/`.access-card` compartilhadas. Evitar alterar seletores globais e componentes UI compartilhados que afetem outros módulos. Preferir decoração CSS/ícones locais a imagens remotas do Stitch.

## Risks / Trade-offs

- [Protótipo altera significado de sucesso ou política de senha] → manter handlers, schemas, payloads, textos de segurança e transições existentes; testes verificam resultados reais representados por respostas controladas no front-end.
- [CSS vaza para landing ou área privada] → usar classes auth específicas e revisar diff; validar navegação de retorno já coberta por `AccessPage.spec.tsx`.
- [Painel rico prejudica 320 px, teclado ou tema escuro] → validar ambos os temas, foco, rótulos, contraste, zoom e movimento reduzido; decoração não deve interceptar navegação ou leitura.
- [Referência mobile incompleta e ausência de telas password/verification] → derivar essas etapas da linguagem desktop e componentes compartilhados, sem inventar fluxo.

## Migration Plan

Sem migration de dados. Aplicar somente na web, revisar visualmente e validar antes de concluir. Por instrução explícita deste pedido, substituir a execução geral de qualidade do AGENTS.md por lint/typecheck/build da web e testes selecionados de UI: `pnpm --filter @study-platform/web test src/features/auth/Auth.spec.tsx src/features/auth/EmailPages.spec.tsx src/features/landing/AccessPage.spec.tsx`, acrescentando somente testes novos da composição auth. Não rodar `pnpm test` geral, backend ou banco. Manter a convenção de um commit ao concluir apply, incluindo tasks final e apenas arquivos/hunks da mudança, sem push/tag/archive. Reversão do commit restaura a apresentação anterior sem afetar dados ou sessão.
