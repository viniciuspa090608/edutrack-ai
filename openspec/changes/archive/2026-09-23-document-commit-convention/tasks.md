# Tasks

## 1. Convenção documentada

- [x] 1.1 Conferir e, se necessário, ajustar `AGENTS.md` para conter o formato `[tipo] descrição objetiva da alteração`, os cinco tipos com seus significados, os cinco exemplos e a regra de uma alteração lógica por commit; verificar que a mensagem fixa antiga foi removida e que permanece a regra de um commit por apply concluído.
- [x] 1.2 Substituir em `openspec/config.yaml` a orientação de mensagem fixa por uma orientação compatível com `AGENTS.md`, preservando as demais regras de apply; verificar por busca textual que nenhuma das duas instruções ativas exige `Apply OpenSpec change: ...`.

## 2. Validação e revisão

- [x] 2.1 Executar `openspec validate document-commit-convention --strict` e `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; verificar saída zero de todos os comandos com o MySQL de teste ativo.
- [x] 2.2 Revisar o diff da mudança e o conteúdo staged, executar `git diff --cached --check` e verificar que somente os arquivos desta mudança entram no commit único do apply, com mensagem no formato `[update] descrição objetiva da alteração`.
