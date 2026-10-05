# Validação do apply

## Estado e implementação

Apply iniciado em `master`, HEAD `69eb7aedbbfb2268eaf28622fd2353e0f13f0684`. Somente os artefatos de planejamento desta mudança estavam sem versionamento; nenhum arquivo tracked estava alterado. Ver `baseline-git.txt`.

Mudanças de produto limitadas a `AccessPage.tsx`, `auth.css` e `features/auth/assets/google-g.png`. A composição adapta padding, gaps, margens, ilustração, features e controles em desktop até 1100 px de altura, com compactação adicional até 800 px. Nesse último intervalo, somente o ícone decorativo repetido da marca é omitido. Formulários mantêm dimensões intrínsecas e crescimento natural do documento; não foi introduzido clipping, altura fixa, truncamento ou scroll interno. Conteúdo longo e zoom podem rolar normalmente.

Google mantém anchor, URL gerada por `googleLoginUrl`, destino permitido e nome acessível; recebe imagem decorativa local, superfície branca, texto escuro e borda, sombra/contorno para interações. Asset oficial obtido de [Google G](https://developers.google.com/static/identity/images/g-logo.png), associado às [diretrizes Google Identity](https://developers.google.com/identity/branding-guidelines). A imagem tem 200×204 px, exibida com `object-fit: contain` em caixa de 20×20 px para preservar proporção. Não há requisição externa em runtime.

Handlers, estado, validações, schemas, payloads, cookies, OAuth, returnTo, rotas, contratos, API e módulos privados não foram modificados. Confirmação e recuperação não precisaram de alteração de JSX: receberam os estilos locais compartilhados.

## QA em Edge real

- `qa-matrix.cjs`: **1116 estados aprovados** nos temas claro/escuro. Inclui as três viewports de referência a 100%, 320×568, 375×667, 768×600 e 1366×600; todas as telas e etapas, estados aplicáveis de validação, busy, erro, reenvio e sucesso, mensagens coexistentes, casos longos e teclado. Após corrigir sincronização das fixtures e captura de zoom no harness, a matriz completa foi repetida e aprovada; falhas de harness não foram tratadas como aprovação de produto.
- `qa-errors.cjs`: **56 casos adicionais aprovados**, com HTTP 401/409/429 reais das fixtures e textos exatos, aviso de segurança+conflito OAuth+erro de envio simultâneos. Tabs percorridas por ArrowRight/ArrowLeft com espera explícita de cada transição.
- `qa-google.cjs`: **160 casos aprovados** após incorporar o asset final, nos dois modos/temas, todas as larguras/alturas e zoom real; imagem decodificada, proporção, alternativa vazia, nome do link, URL OAuth e cores/layout verificados. Repouso, hover, focus-visible e active inspecionados com pseudoestados do navegador. Fundo computado `rgb(255, 255, 255)` e texto `rgb(31, 31, 31)` em todos esses estados.
- Desktop de referência: documento sem overflow vertical/horizontal, controles e feedback completos dentro das dimensões e sem scroll/clipping interno. Tolerância de 1 px somente para arredondamento. O pior caso original medido em 1366×768 ocupava **1163 px** de documento e aproximadamente **1027 px** de formulário. Após ajuste, o mesmo caso de cadastro com mensagens simultâneas cabe em **768 px** de documento e aproximadamente **718 px** de formulário.
- Zoom **real de navegador de 200%**, aplicado em perfis temporários independentes pela preferência de zoom da partição, sem CSS zoom/transform. Viewports efetivas: **683×384**, **720×450** e **960×540**, com pixel ratio 2 e `body` CSS zoom 1. Essa redução aciona refluxo conforme largura/altura disponíveis e permite scroll vertical. Capturas finais de zoom usam `Page.captureScreenshot` em dimensões físicas; capturas iniciais pelo helper do Playwright cortavam a imagem ampliada e foram substituídas.
- Tab/Shift+Tab e acesso aos extremos verificados em cada tela/etapa; foco de transições, status/alert e bloqueios também cobertos nas regressões existentes. Movimento reduzido ativado no QA. Textos excepcionais de aproximadamente 1000 caracteres, incluindo trecho contínuo de 200, exercitados em acesso, confirmação e recuperação com scroll permitido.
- Capturas representativas foram inspecionadas, incluindo combinação de avisos em 1366×768 nos dois temas, confirmação em 1440×900, recuperação em 1920×1080, mobile 320 px e recuperação ampliada a 200%. Campos, mensagens e ações permaneceram legíveis.

Evidências detalhadas estão em `%TEMP%/edutrack-auth-refine/`: `matrix.json`, `errors.json`, `google-final.json` e capturas identificadas por tema/viewport/zoom/estado. `qa-summary.json` neste diretório de mudança preserva contagens, grupos de viewport, resultados e hash do asset. A verificação final também confirmou foco real do link e contorno azul `rgb(66, 133, 244)` após estabilização das transições. Os três scripts deste diretório permitem reproduzir QA contra `http://127.0.0.1:5173`, usando o Playwright do runtime local e Edge. Respostas controladas servem somente para alcançar estados de UI; não validam autorização real do provedor nem substituem testes de banco. Foram utilizadas credenciais fictícias, sem segredos reais nas evidências.

## Qualidade

| Verificação | Resultado |
| --- | --- |
| Regressões Auth/EmailPages/AuthFeedback/AccessPage | 4 arquivos, 25 testes aprovados; repetidos após import do asset final |
| Suíte completa da web | 25 arquivos, 198 testes aprovados |
| `pnpm lint` | Aprovado |
| `pnpm typecheck` | Aprovado |
| `pnpm build` | Aprovado; mantém aviso preexistente de chunk acima de 500 kB |
| `pnpm test` | **Falhou**: contracts 37/37; API 194/195. Parou antes da web; a suíte web foi executada separadamente |
| MySQL | Real, configuração existente e bancos isolados criados/removidos pelas suítes; sem mocks para esconder configuração |
| OpenSpec strict / diff check | Aprovados |

O sandbox bloqueou processos nativos do Vite; execução fora dele, autorizada pelo revisor automático, iniciou a web e permitiu as verificações sem alterar dependências/configuração.

## Bloqueio de conclusão

`apps/api/test/demo.spec.ts:247`, teste `authenticates all profiles, validates module data, chronology and derived progress`: esperado HTTP 200, recebido **410** na consulta de importação da demo. Falha reproduzida isoladamente com `pnpm --filter @study-platform/api test test/demo.spec.ts -t 'authenticates all profiles'`.

O seed fixa `expires_at: at(1)` com data-base `2026-10-03`; `import.repository.ts` compara a expiração com `Date.now()`. O relógio fixo fornecido pelo teste a progresso/dashboard/reviews não controla essa consulta. Todos esses arquivos são idênticos ao HEAD inicial e não fazem parte do diff de autenticação. Nenhuma alteração na API ou supressão da falha foi feita. Foi solicitada orientação para uma correção separada, pois ampliar o escopo silenciosamente contrariaria o plano.

O apply permanece com **20/23 tarefas concluídas**, aguardando aprovação da suíte geral e os passos de staging/commit. Não há commit de conclusão, staging, tag, push ou archive. Resolver a falha e aprovar as verificações é pré-condição para concluir as tarefas 5.2, 5.4 e 5.5.
