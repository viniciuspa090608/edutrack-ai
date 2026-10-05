# Proposal

## Why

A composição atual de autenticação usa espaçamentos orientados à largura, sem garantir que formulário, feedback e painel lateral caibam na altura desktop. É necessário refinar essa apresentação e a identificação visual do Google preservando a identidade e os fluxos já implementados.

## What Changes

- Ajustar login e cadastro em `/acesso`, confirmação em `/confirmar-email` e recuperação `request`, `code`, `password` e `done` para caber integralmente nas viewports 1366×768, 1440×900 e 1920×1080 a 100%, nos dois temas, incluindo os estados reais de validação, loading, erro e sucesso aplicáveis.
- Adaptar espaçamentos, dimensões e decoração pela altura disponível; preservar conteúdo essencial e permitir rolagem vertical em alturas menores, zoom ampliado e conteúdo excepcionalmente longo, sem mascarar excedentes com `overflow: hidden`.
- Manter uso desde 320 px sem overflow horizontal, teclado, foco, anúncios de feedback e movimento reduzido.
- Exibir logo multicolorida do Google e superfície branca com texto escuro, borda e foco perceptíveis em login/cadastro; manter branco em hover, foco e demais interações.
- Preservar OAuth, destinos permitidos, campos, validações, payloads, bloqueios atuais e transições. Não alterar contratos ou regras de autenticação.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `user-authentication`: acrescentar critérios de acomodação desktop por altura e apresentação do Google, complementando acessibilidade e estados existentes.

## Impact

Estilos escopados em `apps/web/src/styles/auth.css`, composição `features/auth/AuthLayout.tsx` e apresentação de `features/landing/AccessPage.tsx`, `EmailVerificationPage.tsx` e `PasswordRecoveryPage.tsx` quando necessário. Reutilizar componentes e tokens existentes, com asset local de logo, sem nova dependência. Verificar regressões nas suítes auth/access e em navegador real; no apply executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, incluindo MySQL real isolado nos testes de banco. Backend, contratos, cliente auth, landing, área privada e tema global ficam fora do escopo de edição. Esta etapa cria somente planejamento, sem implementação, commit de conclusão ou archive.
