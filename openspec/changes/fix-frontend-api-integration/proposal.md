# Proposal

## Why

Fluxos já entregues apresentam falhas de integração: o atalho de preferências da IA aponta para uma rota inexistente, Flashcards não é preservado no retorno da autenticação e a gravação do fuso envia JSON sem o cabeçalho exigido pelo parser da API. A conta também anuncia IA como indisponível apesar dos fluxos implementados.

## What Changes

- Direcionar o atalho de preferências da IA para `/conta#account-preferences`.
- Preservar `/app/flashcards` ao solicitar autenticação e concluir login local ou Google, mantendo a validação de destinos internos.
- Enviar o PATCH de fuso com `Content-Type: application/json`, preservando validações e estados da interface.
- Substituir a mensagem desatualizada sobre IA por orientação sobre seu uso opcional em Flashcards e Matérias; disponibilidade operacional continua sujeita às preferências e configuração do provedor.
- Acrescentar regressões que comprovem os fluxos afetados.
- Restaurar exclusões de dependências, ambiente e arquivos gerados no `.gitignore`, preservando `/especificacoes`.
- Estabilizar as verificações de dashboard e demo: alinhar datas do fixture ao relógio de teste e limitar concorrência de bancos MySQL isolados. Ampliação de escopo autorizada pelo usuário durante o apply.

## Capabilities

### New Capabilities

- `frontend-api-integration`: coerência dos atalhos de preferências, transporte da atualização de fuso e apresentação da disponibilidade de IA nos fluxos existentes.

### Modified Capabilities

- `user-authentication`: explicitar retorno seguro a Flashcards após autenticação local e Google.
- `quality-commands`: explicitar verificações reproduzíveis com artefatos gerados e testes MySQL isolados.

## Impact

- Frontend: `FlashcardAIFlow`, `PrivatePage`, `auth-api`, `progress-api` e `ProfilePage`, com testes próximos aos fluxos.
- Backend: lista de destinos de retorno em `google.service.ts` e testes OAuth relacionados.
- Qualidade: `.gitignore`, fixture HTTP do dashboard e configuração de concorrência dos testes da API.
- Preserva endpoints, schemas, arquitetura do monorepo e modelo de dados; sem novas dependências ou migrations.
- Aplicação futura em uma mudança lógica e um commit, incluindo `tasks.md` final e verificações exigidas pelo projeto.

## Non-goals

- Criar URLs de detalhes, alterar o reconhecimento de subrotas ou implantar um novo roteador.
- Criar telas apenas para consumir endpoints individuais hoje sem chamada direta.
- Otimizar desempenho de produção, consultas ou bundles.
- Criar outra aplicação, redesenhar telas, refatorar autenticação ou disponibilizar credenciais de IA.
- Implementar, arquivar, fazer push ou criar versões durante a proposta.
