# Tasks

## 1. Contratos e persistência

- [x] 1.1 Adicionar gate do piloto, limites configuráveis e contratos públicos do chat. Verificar rejeição de entradas e configurações inconsistentes, incluindo teto diário de chat igual ou superior ao limite geral correspondente.
- [x] 1.2 Criar migrations MySQL para conversas, mensagens, tentativas, prévias e recibos com índices de propriedade, cursor e expiração. Verificar aplicação e reversão em MySQL isolado.
- [x] 1.3 Implementar listagem e paginação privadas e persistência de envios/tentativas. Testar isolamento entre contas, vencimento no limite exato e deduplicação e recuperação de tentativas interrompidas.

## 2. Turnos e confirmação

- [x] 2.1 Integrar os seletores e projeções de estudo aos serviços públicos. Testar a consulta de vencimentos da semana, módulos desativados, identificadores alheios, ambiguidades e injeção de instruções em conteúdo de estudo.
- [x] 2.2 Integrar a categoria chat às reservas de uso e aos adaptadores estruturados por conta. Testar tetos concorrentes em MySQL, uso pessoal, capacidade dos fluxos existentes, configuração incompatível e no máximo uma chamada por envio, inclusive após erro externo.
- [x] 2.3 Implementar orquestração do turno e validação de resposta, prévia e destino. Testar preservação da mensagem em timeout, cota esgotada e indisponibilidade e recuperação por tentativa explícita sem duplicar a mensagem.
- [x] 2.4 Integrar confirmação transacional aos serviços públicos de matérias, tarefas e flashcards. Em MySQL real, confirmar os três tipos, repetir após perda de resposta, concorrer a mesma chave, provocar falha parcial de lote e verificar revalidação de sessão, preferências, propriedade, schema e validade, sem nova chamada à IA.

## 3. Interface autenticada

- [x] 3.1 Integrar o destino ao shell e implementar histórico, composição, aviso de compartilhamento, sugestões editáveis, estados de resposta e falha e prévia com confirmação. Verificar início e retomada, troca de módulos, navegação direta protegida e atualização após sucesso.
- [x] 3.2 Verificar a experiência em desktop e a partir de 320 px nos temas disponíveis, incluindo menu Mais, foco, teclado, anúncios de carregamento e erro, movimento reduzido e ausência de rolagem horizontal.

## 4. Operação e validação

- [x] 4.1 Implementar a limpeza em lotes e registrar seu agendamento pós-build no deploy. Verificar em MySQL real remoção sem tráfego, retomada após reinício, concorrência com envio e preservação de criações confirmadas. Registrar evidência de execução no ambiente do piloto.
- [x] 4.2 Instrumentar métricas agregadas e revisar amostras de logs e telemetria para assegurar ausência de textos, tokens, credenciais e dados de outras contas.
- [x] 4.3 Testar os protocolos do catálogo com fixtures e validar em smoke autorizado as combinações oferecidas no piloto. Registrar compatibilidade, limites iniciais e evidência de erro claro para configurações excluídas.
- [x] 4.4 Medir e registrar volume e concorrência validados, latência, chamadas por mensagem, erros de cota, crescimento do histórico e folga compartilhada sob carga mista com roadmaps e flashcards. Ajustar limites com base nos resultados antes de ampliar acesso.
- [x] 4.5 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build, com MySQL real e isolado nos testes de integração. Registrar resultados e concluir o fluxo local OpenSpec conforme AGENTS.md.
