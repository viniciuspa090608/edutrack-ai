# Tasks

## 1. Controles e listas

- [x] 1.1 Padronizar campos de texto, seleção e data. Conferir altura, alinhamento e colunas iguais nos quatro filtros de Tarefas, quebra em 320 px e altura própria de campos multilinha.
- [x] 1.2 Reservar o rodapé da lista de baralhos para a paginação existente. Conferir listas curta e longa, navegação entre páginas e visibilidade da última linha e do foco acima da navegação do shell.

## 2. Home e Matérias

- [x] 2.1 Estabilizar a grade desktop da Home e limitar a rolagem de Tarefas ao corpo do card. Comparar vazio e preenchido na mesma viewport, com e sem módulos adjacentes, e alcançar a última tarefa e Abrir tarefas por teclado.
- [x] 2.2 Alinhar os resumos de Tarefas, Pomodoro, Flashcards e Estatísticas abaixo dos títulos com 3 px. Conferir quebra de texto. Simplificar o Progresso sem atividade e verificar que falhas e histórico válido mantêm tratamentos distintos.
- [x] 2.3 Fazer o estado Nenhuma matéria ainda ocupar a área útil. Verificar ausência de rolagem extra quando couber, CTA utilizável com pouco espaço e apresentação preservada quando houver registros.

## 3. Configurações da conta

- [x] 3.1 Reorganizar Seu perfil em três seções e posicionar Salvar nome ao lado do campo quando couber. Conferir upload, preview, remoção, validação e salvamento de nome, acesso à troca de e-mail, âncoras e comportamento a 320 px.
- [x] 3.2 Incorporar Google Classroom ao card Acesso à conta e alinhar os ícones. Conferir vínculo Google, Classroom conectado e desconectado, ações de importação, navegação da Conta, logout e card autônomo no onboarding.

## 4. Programação e estatísticas

- [x] 4.1 Implementar a grade semanal 4 + 3, duas colunas e uma coluna. Conferir ordem, dimensões mínimas, realce de fim de semana, estado vazio e abertura do formulário existente com o dia escolhido.
- [x] 4.2 Priorizar totais e recolher a tabela diária por padrão. Conferir acesso por teclado, equivalência das métricas com os dados atuais, comparação, período parcial, estados sem atividade e indisponibilidade.

## 5. Autenticação e recuperação

- [x] 5.1 Ajustar em cerca de 3 px a separação abaixo da ação Google e animar Voltar à landing em login e cadastro. Conferir foco, movimento reduzido e acomodação desktop prevista por refine-auth-desktop-layout.
- [x] 5.2 Animar mudanças de etapa e retorno à entrada na recuperação. Verificar avanço confirmado, falhas na etapa atual, reenvio sem mudança de etapa, foco de destino e movimento reduzido.

## 6. Verificação

- [x] 6.1 Revisar as telas afetadas em ambos os temas, de 320 px a desktop, com teclado, altura reduzida e movimento reduzido. Conferir acessibilidade e estados aplicáveis de carregamento, vazio, erro e sucesso.
- [x] 6.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build. Usar MySQL real e isolado nos testes de banco exigidos e registrar os resultados.

Lint, typecheck e build aprovados. A suite completa passou com 628 testes, incluindo 278 testes da API com MySQL local isolado. A verificacao no Edge cobriu as telas internas em 320, 768 e 1440 px nos dois temas, a estabilidade da Home, as transicoes de acesso e 1.116 estados da matriz de autenticacao.
