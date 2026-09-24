# Proposal

## Why

A EduTrack já apresenta a plataforma, mas `/acesso` ainda é uma página provisória. Cadastro, login e uma sessão verificável são necessários para oferecer uma área pessoal e proteger os módulos de estudo que virão.

## What Changes

- Substituir o aviso de `/acesso` por cadastro e login com e-mail e senha, entrada com Google, saída e estados claros de erro e carregamento.
- Criar contas e credenciais locais, identidades Google vinculadas pelo par provedor + `sub` do Google, e sessões persistidas no servidor; exigir uma ação explícita de uma pessoa autenticada para vincular Google a uma conta local.
- Proteger uma área inicial autenticada e os endpoints privados pela sessão, inclusive após recarga ou abertura direta da URL.
- Definir expiração e revogação da sessão, proteção contra CSRF e tratamento seguro do fluxo OAuth/OIDC do Google.
- Deixar verificação de e-mail, recuperação de senha e outros fluxos que enviam e-mail para um proposal seguinte. O cadastro local funciona sem envio de e-mail nesta mudança.

## Capabilities

### New Capabilities

- `user-authentication`: cadastro local, login local e Google, vínculo explícito de identidade, sessão, saída e acesso protegido.

### Modified Capabilities

Nenhuma spec principal publicada muda diretamente nesta proposta. A mudança `add-public-landing`, ainda não sincronizada em `openspec/specs/`, especifica `/acesso` como aviso provisório; sua exigência deverá ser substituída pela tela real de acesso ao reconciliar as mudanças, sem manter requisitos contraditórios.

## Impact

- `apps/api`: módulo de autenticação, middleware de sessão, endpoints e migrations versionadas de usuários, credenciais, identidades e sessões; configuração validada para Google e cookies.
- `packages/contracts`: schemas de entrada e respostas públicas de autenticação.
- `apps/web`: formulários, fluxo Google, estado de sessão, saída, rotas protegidas e atualização dos CTAs da landing.
- MySQL real para persistência e testes de integração; documentação de ambiente e implantação para origens, cookies e redirecionamento Google.
