# Tasks

## 1. Instruções persistentes

- [x] 1.1 Adicionar a `openspec/config.yaml` a orientação de um commit Git por apply concluído, com mensagem `Apply OpenSpec change: <nome-da-mudança>`, staging apenas do escopo aplicado e sem tag/push; verificar que `openspec instructions apply --change bootstrap-study-platform --json` retorna a regra em `operationGuidance`.
- [x] 1.2 Criar ou atualizar `AGENTS.md` com a mesma regra, incluindo verificação das tarefas, testes, diff staged e preservação de alterações preexistentes; verificar que a seção de Git é legível e não conflita com as convenções previstas para a fundação.

## 2. Validação e primeiro commit

- [x] 2.1 Validar esta mudança com `openspec validate commit-each-openspec-apply --strict` e conferir que `openspec status --change commit-each-openspec-apply` mostra todos os artefatos necessários completos, com specs dispensadas.
- [x] 2.2 Após marcar todas as tarefas concluídas, revisar `git diff --cached --check` e o diff staged dos arquivos desta mudança, criar exatamente um commit com a mensagem definida e verificar seu hash e a lista de arquivos com `git show --stat --oneline HEAD`; deixar alterações alheias fora do commit.
