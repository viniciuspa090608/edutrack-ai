# Proposal

## Why

As telas de autenticação precisam de uma apresentação mais consistente, legível e organizada, tomando o Stitch como referência visual. A atualização deve valorizar o fluxo real do EduTrack sem transformar suposições do protótipo em funcionalidades.

## What Changes

- Atualizar layout, hierarquia, espaçamento, cards, inputs, botões e feedback de login e cadastro em `/acesso`, confirmação em `/confirmar-email` e todas as etapas de `/recuperar-senha`.
- Adaptar o painel lateral e os formulários desktop do Stitch a uma composição responsiva desde 320 px, respeitando os temas claro/escuro existentes.
- Preservar campos, validações, payloads, Google existente, mensagens reais, redirecionamentos e estados de envio, falha e sucesso.
- Excluir campos acadêmicos, Microsoft, lembrar dispositivo, links fictícios e alegações não comprovadas do protótipo.
- Executar apenas testes de UI afetados, com verificações estáticas e build restritos à web; não executar suítes gerais, backend ou banco.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `user-authentication`: adicionar requisitos observáveis de apresentação visual consistente das telas e etapas existentes, com adaptação segura da referência e suporte aos dois temas.

## Impact

Principalmente `apps/web/src/features/landing/AccessPage.tsx`, `apps/web/src/features/auth/EmailVerificationPage.tsx`, `PasswordRecoveryPage.tsx`, estilos de autenticação e seus testes. Pode haver um componente de composição compartilhado restrito à autenticação. Reutilizar `packages/ui` e os tokens atuais, sem novas dependências. Backend, banco, contratos, cliente de autenticação, sessão e rotas não requerem alteração. Mudanças preexistentes no dashboard e sua proposta devem ser preservadas.
