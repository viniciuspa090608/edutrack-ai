# Proposal

## Why

O teste real do Classroom revelou divergência entre o callback solicitado e os URIs autorizados no Google Cloud. Registrar a convenção local evita novas trocas de host ou porta e mantém o login existente.

## What Changes

- Documentar os três callbacks locais autorizados no README, AGENTS.md e comentários do .env.example.
- Diferenciar desenvolvimento na porta 3001, homologação isolada do Classroom na porta 3002 e produção HTTPS.
- Regularizar as alterações documentais existentes no fluxo de conclusão OpenSpec e integrar por fast-forward somente após aprovação dos checks.
- Normalizar a formatação preexistente com pnpm format, conforme autorização do usuário, para desbloquear o lint obrigatório.

## Capabilities

### New Capabilities

Nenhuma. Mudança documental com `skip_specs: true`.

### Modified Capabilities

Nenhuma. Os serviços continuam derivando os callbacks de API_PUBLIC_ORIGIN.

## Impact

Documentação, exemplo de ambiente e normalização de formatação autorizada, além dos artefatos desta mudança. Não altera o .env privado, comportamento do código, banco, permissões no Google Cloud ou specs funcionais. Preserva mudanças históricas ativas e não publica no remoto.
