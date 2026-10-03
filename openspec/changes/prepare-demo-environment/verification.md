# Verificação de prepare-demo-environment

Data: 2026-10-03. Publicação cancelada pela pessoa; somente dois commits locais.

- MySQL real isolado: seis testes de demo validam schema, constraints, índices, triggers e histórico de migrations preservados; falha real de TRUNCATE restaura FOREIGN_KEY_CHECKS; falha real do seed provoca rollback; repetição reconstrói composição e seed duplicado é recusado; credenciais, origem LAN e isolamento entre usuários funcionam.
- Banco de desenvolvimento inspecionado: localhost:3306/study_platform_dev, migrations aplicadas. Confirmação explícita recebida para parar a API, truncar dados e popular demo. Reset e seed concluídos com data-base 2026-10-03.
- Interface: perfil ativo com 7 dias de sequência, 26 dias ativos e 7 conquistas; intermediário com 9 dias ativos, progresso parcial e 8 revisões pendentes; iniciante com uma tarefa/matéria, sem atividade e sem baralhos. Logins finais conferidos no banco de desenvolvimento.
- Acesso por localhost e pelo IP LAN 192.168.15.12:5173, cookies persistentes, logout e revisão autenticada via proxy. Acesso cruzado e origem não autorizada rejeitados nos testes HTTP.
- Viewport 320 px: páginas verificadas. Overflow do botão de detalhes de tarefas foi corrigido com limite de largura e quebra de texto; largura de conteúdo após ajuste 305 px (viewport 320 px com scrollbar). Navegação e ação de revelar cartão por teclado conferidas; regras existentes de movimento reduzido preservadas, sem nova animação.
- npm run dev inicia web, API e worker após build dos pacotes compartilhados. Porta 5173 ocupada provoca saída 1 e encerramento dos filhos; Ctrl+C libera portas da execução supervisionada. A API preexistente na porta 3001 foi preservada durante os testes isolados e parada somente após confirmação do reset.
- Pré-requisitos, dados locais, credenciais, comandos de inspeção/reset/seed, data-base, portas, LAN, SMTP e consequências do TRUNCATE documentados no README. .env recebe somente a origem LAN e permanece ignorado.
- pnpm lint, pnpm typecheck, pnpm test e pnpm build aprovados. Suíte: 37 testes contracts, 195 API, 136 web, total 368. Build mantém aviso de chunk acima de 500 kB, sem impedir a compilação.
