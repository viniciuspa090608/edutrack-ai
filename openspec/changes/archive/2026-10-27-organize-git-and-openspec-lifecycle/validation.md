# Validação do apply

## Git e escopo

Baseline em baseline.md. Origin foi restaurado com a URL fornecida pelo usuário; consulta real confirmou somente master em 86c3414. Master local em 5acb1ba acompanha origin/master com um commit exclusivo local, sem divergência. Implementação isolada em codex/organize-git-and-openspec-lifecycle. Nenhum push, tag, reset ou alteração de commits preexistentes.

O escopo inclui scripts de conclusão/testes, package.json e lockfile, configuração ESLint para scripts Node, documentação, orientação OpenSpec, inventário, specs consolidadas e movimentos de archive auditados. Não altera código de produto, banco ou credenciais. A CLI OpenSpec 1.13.1 é dependência de desenvolvimento fixada para instalação reproduzível e CI; o lockfile acrescenta suas dependências e a resolução do peer YAML, sem trocar versões de runtime existentes.

## Verificações executadas antes da conclusão

- pnpm lint: aprovado, incluindo scripts, workspaces e Prettier.
- pnpm typecheck: aprovado para os workspaces.
- pnpm test: aprovado; contratos 16 arquivos/37 testes, API 37 arquivos/220 testes em MySQL real isolado e web 28 arquivos/255 testes. Nesta execução a suíte do fluxo tinha 21 testes, todos aprovados.
- Proteção adicional de publicação imediatamente antes do amend e otimização de staging foram validadas depois: quatro testes dirigidos aprovados, incluindo execução real da CLI com e sem delta. O conjunto do fluxo possui agora 22 testes; o comando de conclusão reexecuta sua suíte completa junto aos quatro gates antes de criar o commit.
- pnpm build: aprovado. Permanece o aviso preexistente de chunk JavaScript acima de 500 kB: 1.095,14 kB, gzip 289,40 kB.
- OpenSpec validate --specs --strict: 44/44 specs aprovadas. Requisitos longos geram apenas informações, sem erro/warning de validação.
- Validação estrita de mudanças após consolidação: 36/37 aprovadas; add-study-tasks apresenta o bloqueio histórico documentado em audit.md e permanece ativa. A validação desta mudança e das specs finais é independente desse replay histórico incompatível.
- Fixtures verificam commit único, sync revisado, skip_specs, preservação de alterações preexistentes e staged alheio, tarefas incompletas, destino existente, falha de qualidade, lock, snapshots/HEAD alterados, aposentadoria explícita, ausência de commit vazio, idempotência, falhas entre fases e publicação em bare remoto real. Duas fixtures executam a CLI OpenSpec instalada, incluindo archive real.

## Ambiente e falhas corrigidas

O sandbox bloqueou escrita em .git e criação de repositórios temporários; os testes Git e operações autorizadas foram executados com a permissão apropriada. A consulta de rede inicial falhou dentro do sandbox e passou fora dele. Não houve bypass de checks ou execução com --no-validate/--no-verify.

A integração real detectou aspas literais ao executar shims Windows; a chamada foi corrigida para tokens de CLI validados, mantendo caminhos no cwd. A fixture de spec foi corrigida para ter Purpose descritivo suficiente à validação estrita. Após adicionar a CLI, pnpm install --frozen-lockfile restaurou links dos workspaces; a tipagem passou sem alterar código de produto. Uma tentativa de consultar serviços do Windows não teve acesso ao gerenciador; os 220 testes aprovados da API comprovaram a conectividade real necessária sem mudar serviços.

## Migração e conclusão

Inventário e audit.md distinguem evidências históricas, revalidação atual e pendências. São 34 archives históricos elegíveis, verificados por comparação SHA-256 dos arquivos antes/depois do movimento. Permanecem ativas refine-auth-desktop-layout e add-study-tasks pelos motivos registrados; seus checklists não são marcados ficticiamente.

O comando openspec:finish executa novamente lint, tipagem, testes e build antes de criar o commit de implementação. Após sucesso, arquiva esta própria mudança e incorpora o movimento por amend restrito ao commit recém-criado não publicado. O journal ignorado registra as fases e o hash final. O resultado só é considerado concluído após verificar o archive, o commit final e a ausência de paths próprios pendentes; falhas mantêm a conclusão pendente, sem segundo commit.
