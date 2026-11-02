# Resultados da baseline

## Estado inicial e ambiente

- Apply em 02/11/2026 (America/Sao_Paulo), Node 25.3.0 e pnpm 11.25.0, Windows/PowerShell.
- Branch inicial: `codex/organize-git-and-openspec-lifecycle`; branch de execução: `codex/establish-project-regression-baseline`.
- Estado inicial: somente duas pastas não rastreadas, `openspec/changes/establish-project-regression-baseline/` e `openspec/changes/add-account-ai-provider-settings/`. A segunda é preexistente e fica fora do manifesto. Nenhum arquivo rastreado alterado no início.
- `.env` preservado; nenhum valor de credencial real integra este relatório. Testes de integração usam MySQL local real 8.0.46 (versão consultada no banco de teste), bancos temporários com prefixo de teste, migrations versionadas e `synchronize: false`. O teste de fundação aplica/desfaz apenas sua migration de probe no banco de teste dedicado. Nenhum banco de desenvolvimento foi resetado.

## Execução anterior às alterações

| Comando | Resultado | Classificação |
| --- | --- | --- |
| `pnpm lint` | Aprovado | ESLint e Prettier dos arquivos mantidos. |
| `pnpm typecheck` | Aprovado | Contratos, UI, API e web. |
| `pnpm test` no sandbox | Falhou ao criar Git temporário | Restrição de filesystem do sandbox, não defeito de produto. |
| `pnpm test` com permissão de execução apropriada | Workflow: 22/22; contratos: 37/37; API: 28 arquivos falharam, 9 passaram; 7 testes falharam e 37 passaram | Configuração/isolamento dos testes. `loadEnv()` lia grupo parcial de IA local e rejeitava `AI_API_KEY`/`AI_MODEL` antes de carregar as suites. O comando propagou a falha e não chegou à web. |
| `pnpm build` | Aprovado | Aviso informativo de bundle acima de 500 kB; sem falha. |

## Correção e evidência de regressão

Problema reproduzido: a suíte dependia de segredos/configuração pessoal de serviços externos no `.env`. A configuração parcial conhecida impedia testes de banco e de funcionalidades manuais mesmo sem nenhuma chamada comercial. Isso viola o objetivo de fixture de teste independente de credenciais reais; o parser de produção estava correto ao recusar o grupo parcial.

Correção mínima: `test/setup.ts` carrega o ambiente local para MySQL e aplica `isolatedTestEnv` somente no Vitest, substituindo valores de serviços externos por fixtures sintéticas e mantendo IA ausente por padrão. Suites de IA continuam injetando sua configuração sintética completa e HTTP simulado. O helper tem teste específico que conserva todos os campos de banco e remove canários de segredos externos sem mutar o input. `env.spec.ts` verifica os seis subconjuntos parciais contra o parser real, incluindo recibo isolado; nenhum relaxamento foi feito em `src/config/env.ts`.

Depois dessa correção, a suíte API passou com 38 arquivos / 222 testes, usando MySQL real. Não foi necessário alterar código de produção. Não houve correção de layout nem alteração visual; validação de 320 px em navegador não foi aplicável. Workers e timeouts existentes foram preservados; não há skips, retries adicionais ou mocks de banco.

## Cobertura ampliada e reutilizada

- Novo teste de isolamento de configuração externa; novo teste dos seis grupos parciais de IA.
- Dois cenários HTTP de geração de roadmap: recusa e excesso, sem persistir e sem bloquear criação manual.
- Quatro cenários HTTP de regeneração: timeout, excesso, recusa e JSON malformado; garantem uma chamada, revisão inalterada, prefixo preservado e edição manual após falha.
- Recusa adicionada à matriz já existente de falhas de flashcards, mantendo contagem de cartões e erros sanitizados.
- Cenários existentes de autenticação, preferências, contratos, isolamento, CRUD, concorrência, rollback, recibos/idempotência e componentes foram reutilizados conforme `regression-matrix.md`.
- Execução focada dos quatro arquivos de ambiente e roadmap: 36 testes aprovados. Execução web independente: 28 arquivos / 255 testes aprovados.

## Execução final

Os quatro comandos finais foram executados em sequência, com saída zero:

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | Aprovado, incluindo formatação após build. |
| `pnpm typecheck` | Aprovado. |
| `pnpm test` | 22 testes de workflow, 37 de contratos (16 arquivos), 228 da API (38 arquivos) e 255 da web (28 arquivos): 542 testes aprovados. |
| `pnpm build` | Aprovado; permanece apenas aviso informativo de bundle. |

A API executou integrações reais no MySQL 8.0.46. A revisão dos arquivos do manifesto não encontrou correspondências dos segredos configurados de oito ou mais caracteres; nenhuma credencial real foi utilizada nas simulações de IA. Não houve alteração no `.env`, publicação remota ou reset do banco de desenvolvimento. O relatório e a matriz integram o manifesto de conclusão junto aos testes e artefatos desta mudança; a proposta de provedores por conta permanece fora dele.

## CI e limites da evidência

Revisado `.github/workflows/quality.yml`: instalação por lockfile congelado, MySQL 8.4 nativo, variáveis sintéticas e os mesmos quatro comandos. Os scripts raiz já alcançam Node tests de workflow, contratos, API e web; testes Vitest mantidos são descobertos automaticamente. Não foi necessário adicionar runner ou alterar CI. A falha inicial de `pnpm test` demonstrou retorno não zero e identificação dos arquivos afetados.

Nenhum CI remoto foi disparado e nenhum push realizado. Saídas externas de IA são simuladas; compatibilidade com Gemini/Claude/DeepSeek/Kimi fica para a próxima mudança. jsdom verifica comportamento de componentes, não layout de navegador. Avisos de `--localstorage-file` no Node e tamanho de bundle não impediram execução. Cobertura crítica da matriz não é garantia de ausência absoluta de regressões.

## Ordem de aplicação

Concluir esta baseline antes de `add-account-ai-provider-settings`. A mudança seguinte deve reler a matriz, manter paridade de comportamento e atualizar explicitamente expectativas de ambiente que sua spec substituir, sem remover testes apenas para obter aprovação.
