# Tasks

## 1. Consultas e filtros

- [x] 1.1 Estender contratos e consultas de Tarefas e Disciplinas com os parâmetros opcionais. Verificar com MySQL isolado busca parcial, caixa, espaços, caracteres literais, combinação de filtros, paginação e isolamento entre usuários.
- [x] 1.2 Adicionar busca por título ao painel de Tarefas e confirmar aplicação explícita, limpeza, retorno à primeira página e resultado vazio.
- [x] 1.3 Criar painel recolhível de Disciplinas com busca por nome e validar que recolher preserva o filtro aplicado e que limpar restaura a lista.

## 2. Interface e detalhes

- [x] 2.1 Atualizar textos e nomes acessíveis para Disciplina e Disciplinas e revisar navegação, formulários, mensagens, filtros e seletores integrados.
- [x] 2.2 Reorganizar o detalhe da disciplina e seus Roadmaps em seções irmãs e alinhar Voltar à direita dos cabeçalhos de detalhes. Verificar as ações por teclado, os dois temas e a largura de 320 px.
- [x] 2.3 Remover o parágrafo de Recursos de IA e conferir o rótulo e a alteração da preferência no perfil.
- [x] 2.4 Centralizar verticalmente Iniciar Pomodoro e conferir o alinhamento no card e o início de uma sessão pela Home.

## 3. Impressão

- [x] 3.1 Aplicar o layout A4 às abas Progresso e Estatísticas. Conferir indicadores, percentual, conquistas, notas, gráficos e tabela com dados reais, além dos estados em que a impressão fica indisponível.
- [x] 3.2 Validar a prévia e a saída em PDF com uma e várias páginas, conferindo contraste em escala de cinza, quebras, paginação, fuso e ausência de controles.

## 4. Verificação integrada

- [x] 4.1 Executar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` e registrar os resultados.

## Verificação

Lint, typecheck, testes do monorepo com MySQL isolado e build aprovados. Conferência no Edge a 320 px em tema claro e escuro. Impressão A4 validada com dados de exemplo em uma página de Progresso e seis de Estatísticas, com numeração e fuso em todas as páginas.
