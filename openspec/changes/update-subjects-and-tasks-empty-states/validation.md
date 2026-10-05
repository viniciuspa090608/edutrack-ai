# Validação do apply

## Estado inicial e escopo

- Branch: `master`; HEAD inicial: `ee13f274f4b86907465c59670a270d29aeb93e74`.
- Antes das edições, apenas a pasta desta proposta estava não rastreada. Não havia alterações preexistentes em código ou no index.
- Implementação: componente de apresentação na web, CSS exclusivo, dois branches de listagem vazia e callbacks de criação locais compartilhados com as toolbars. Sem dependências novas, alterações em fetch/API/stores/backend ou mudanças nos editores.
- Revisão do diff: branches de cards preenchidos, filtros, ordenação, paginação, detalhes, plano manual e formulários permanecem iguais. Os seletores antigos `.subject-empty` e `.task-empty` não foram alterados.

## Verificações automatizadas

- **24 testes aprovados**, somente `SubjectsPage.spec.tsx` e `TasksPage.spec.tsx`. Os testes cobrem resposta pendente controlada, ausência real, dados presentes, erro/retry, filtros sem resultados, página vazia com total positivo, teclado, criação existente, cancelamento e retorno de foco.
- Lint da web, typecheck da web e Prettier dos seis arquivos de código modificados: aprovados.
- Build da web: aprovado. O Vite mantém aviso de chunk maior que 500 kB; não é falha de build nem justificativa para ampliar este escopo.
- Nenhuma suíte global ou teste backend foi executado.

Os comandos pnpm do ambiente não resolveram corretamente os binários e o loader padrão de configuração tentou empacotar uma dependência nativa. As verificações usaram os mesmos binários/configurações do projeto diretamente, sem alterar dependências:

```powershell
# cwd: apps/web
node node_modules/vitest/vitest.mjs run --config vitest.config.ts --configLoader native --pool threads src/features/subjects/SubjectsPage.spec.tsx src/features/tasks/TasksPage.spec.tsx
node node_modules/vite/bin/vite.js build --configLoader native
# cwd: raiz do projeto
./node_modules/.bin/eslint.CMD apps/web/src apps/web/vite.config.ts
./apps/web/node_modules/.bin/tsc.CMD --noEmit -p apps/web/tsconfig.json
```

O pool threads contorna `spawn EPERM` do pool forks no sandbox. O último run completo dos dois arquivos passou; tentativas anteriores de inicialização não executaram testes. Os ajustes nas duas asserções de Matérias refletiram o nome real da paginação e distinguiram erro de formulário de erro da listagem.

## Inspeção de browser

Chromium headless instalado localmente; respostas de teste interceptadas apenas no browser, sem mocks em runtime de produto ou contato com dados reais. Não foi necessária instalação de browser/dependências. As capturas dos novos vazios e as medidas estão em `validation/`.

| Tela | Tema | Larguras de viewport | Resultado |
| --- | --- | --- | --- |
| Matérias | claro | 320, 768, 1280 px | aprovado |
| Matérias | escuro | 320, 768, 1280 px | aprovado |
| Tasks | claro | 320, 768, 1280 px | aprovado |
| Tasks | escuro | 320, 768, 1280 px | aprovado |

- As 12 capturas foram inspecionadas: conteúdo centralizado, ícone proporcional, texto quebrável, CTA alcançável e sem overflow horizontal do novo componente. CTA com altura mínima de 44 px e largura fluida no mobile.
- Contraste de título, descrição e texto do CTA medido em cada combinação: mínimo **5,55:1**. Cores derivadas dos tokens atuais nos dois temas.
- Preferência `reduced-motion: reduce` ativa; nenhuma animação nova no componente. CTA alcançado por teclado com contorno de foco de 2 px; Enter abre o cadastro existente e cancelar mantém o comportamento de retorno de foco da página.
- Loading e falha da listagem não exibem o novo bloco; retry recupera o vazio real. Em Tasks, filtro sem correspondência mantém mensagem própria e limpar filtros restaura o vazio somente após a resposta.

## Comparação com dados

As páginas anteriores foram carregadas a partir do Git HEAD em arquivos temporários, ao lado da implementação atual, com a mesma fixture de dados e CSS do projeto. Todos os arquivos temporários de comparação foram removidos pelo script ao terminar.

Nas **12 combinações** de tela/tema/largura, a geometria e os estilos computados de todos os elementos renderizados foram idênticos. Nove pares de screenshots foram idênticos em pixels; três pares de Tasks escuro tiveram apenas 8–16 pixels de borda com variações de antialiasing de até 6/255 por canal, sem mudança de geometria/estilo. Resultados em `validation/regression.json`.

O diff confirma adicionalmente que detalhes, formulários e plano manual não foram redesenhados. Os testes existentes dos dois arquivos continuam verificando criação, edição, exclusão e fluxos relacionados sem ampliar a suíte executada.
