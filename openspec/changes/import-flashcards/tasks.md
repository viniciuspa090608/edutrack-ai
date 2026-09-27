# Tasks

## 1. Preparar dependências e contratos

- [x] 1.1 Registrar estado Git e alterações preexistentes, confirmar que autenticação, preferências e `add-manual-flashcards` foram aplicados e conferir os limites reais de texto e IDs; verificar migrations e contratos existentes antes de editar.
- [x] 1.2 Adicionar schemas e tipos de mapeamento por índice, pré-visualização, erros por linha e resultado; verificar validação com testes de contrato para índices inválidos e contagens.

## 2. Arquivo e tentativa

- [x] 2.1 Criar migration versionada de tentativas temporárias com proprietário, baralho, estado, expiração e resultado; verificar aplicação e rollback em MySQL real isolado.
- [x] 2.2 Implementar upload limitado e parser CSV/TSV UTF-8 com BOM, aspas e linhas multilinha; verificar 2 MiB, 1.000 registros, arquivo malformado, largura de linha e nenhuma criação de cartão no upload.
- [x] 2.3 Implementar mapeamento e pré-visualização com amostra, erros, números de linha e contagens previstas; verificar troca de colunas, cabeçalhos repetidos, duplicatas internas/no baralho e cancelamento sem gravação.

## 3. Confirmação e autorização

- [x] 3.1 Implementar confirmação transacional com bloqueio do baralho, reclassificação, gravação atômica e resultado persistido; verificar duplicata adicionada após preview, rollback em falha e repetição idempotente em testes MySQL.
- [x] 3.2 Aplicar autorização por usuário e preferência de flashcards no upload, preview, consulta e confirmação, com limpeza de tentativas expiradas; verificar duas contas, baralho alheio, expiração e módulo desativado sem vazamento de conteúdo.

## 4. Interface e verificação final

- [x] 4.1 Criar fluxo web de envio, mapeamento, amostra, confirmação, cancelamento e resultado com três contagens; verificar teclado, estados de erro/loading e largura de 320 px.
- [x] 4.2 Verificar importação completa com IA desativada e ausência de chamadas de IA em testes de fluxo, incluindo CSV e TSV.
- [x] 4.3 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `openspec validate import-flashcards --strict`; corrigir falhas e revisar critérios de aceite.
- [x] 4.4 Revisar diff e alterações preexistentes, adicionar só arquivos/hunks deste apply, executar `git diff --cached --check` e criar exatamente um commit com implementação e `tasks.md` final; confirmar hash e arquivos incluídos.
