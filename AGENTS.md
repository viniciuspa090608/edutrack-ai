# Instruções do projeto

## Versionamento de mudanças OpenSpec

- Ao iniciar um apply, registre o estado do Git e identifique alterações preexistentes.
- Conclua as tarefas da mudança e execute as verificações exigidas antes de criar o commit de conclusão. Um apply pausado ou com falhas não recebe commit de conclusão.
- Crie exatamente um commit Git por mudança OpenSpec concluída, incluindo a implementação e o `tasks.md` final. Se um apply já concluído não produzir novo diff, não crie commit vazio.
- Adicione somente arquivos ou hunks da mudança aplicada. Preserve alterações preexistentes e não use `git add .` para capturar todo o working tree.
- Revise o diff staged e execute `git diff --cached --check` antes do commit.
- Use a mensagem `Apply OpenSpec change: <nome-da-mudança>`. Após o commit, confirme e informe o hash e os arquivos incluídos.
- Não crie tag, versão SemVer ou push como parte desta convenção. Arquivar uma mudança OpenSpec requer uma ação separada.

As convenções de arquitetura e qualidade da plataforma serão acrescentadas pelo apply de `bootstrap-study-platform`; preserve esta seção ao ampliar o arquivo.
