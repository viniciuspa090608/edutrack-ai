# Proposal

## Why

A EduTrack precisa permitir que cada pessoa mantenha seus dados de conta e escolha quais partes da experiência de estudo deseja usar. As escolhas devem valer também no servidor, sem apagar conteúdo nem obrigar o uso de IA.

## What Changes

- Expandir `/conta` com perfil: foto, nome exibido, e-mail e alteração de senha para contas que possuem credencial local. O nome exibido pode se repetir; o ID da conta continua sendo o identificador único.
- Guardar a foto na própria tabela `users`, validar imagem e tamanho antes da gravação e permitir removê-la.
- Alterar e-mail somente após nova prova de autenticação e confirmação do novo endereço por código; até lá, o endereço atual permanece ativo. Contas exclusivas do Google usam nova autenticação Google e continuam vinculadas pelo `sub`, sem criar senha inexistente.
- Permitir ligar ou desligar tarefas, matérias e flashcards de modo independente; módulos desligados saem da navegação e do dashboard e suas páginas e ações ficam indisponíveis, com dados preservados para reativação.
- Oferecer preferência separada para IA; quando desligada, ocultar **Aprimorar com IA** e recusar operações de IA, preservando os fluxos manuais dos módulos ativos.
- Exigir ao menos um módulo de estudo ativo entre tarefas, matérias e flashcards, sem contar IA; recusar a desativação do último na interface e no servidor, inclusive em atualizações concorrentes.

## Capabilities

### New Capabilities

- `user-profile`: dados de perfil, foto armazenada em `users`, alteração verificada de e-mail e alteração de senha local.
- `module-preferences`: preferências individuais de tarefas, matérias, flashcards e IA, com efeitos em navegação, dashboard e autorização.

### Modified Capabilities

Nenhuma spec principal publicada cobre perfil ou os módulos privados. Esta mudança pressupõe `add-user-authentication` e `add-email-verification-and-recovery`, ambas ainda não aplicadas. Os módulos, seus widgets e os recursos de IA também ainda não existem; a integração descrita aqui deverá acompanhar sua implementação, sem criar módulos vazios antecipadamente.

## Impact

- `apps/api`: migrations de perfil e preferências, endpoints autenticados, validação/processamento de imagem, reutilização dos fluxos de autenticação e confirmação, bloqueio de módulos e de IA no servidor.
- `apps/web`: página `/conta`, formulários de perfil, controles de preferências, filtragem de navegação/widgets e tratamento de páginas indisponíveis.
- `packages/contracts`: schemas e tipos públicos de perfil, atualização de conta e preferências.
- Integração futura com tarefas, matérias, flashcards, dashboard e IA quando cada funcionalidade existir; MySQL real isolado nos testes de dados.
