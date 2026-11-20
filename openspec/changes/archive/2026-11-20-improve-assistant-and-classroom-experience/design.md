# Design

## Context

Ver proposal.md para motivação e escopo. A análise do repositório identificou:

- AssistantPage renderiza “Conversa de” e updatedAt; AssistantHistory.conversations retorna somente id e updated_at. O CSS limita a largura a 80rem; rolagem de mensagens com altura limitada só é ativada em desktop a partir de 1280 × 800.
- ClassroomGoogleClient.courses pagina sem filtro de estado. course é consultado novamente durante seleção e execução, permitindo validar estado nessas fronteiras.
- ClassroomSection já usa o Checkbox compartilhado, mas a regra .classroom-section button impõe min-height de 2.5rem também ao botão Radix do checkbox, explicando a aparência alongada.
- SubjectsRepository.importClassroom retorna ignored para destination.kind=none; isso representa configuração ausente, não falha do Google.
- O contrato de tarefa limita description a 2.000 caracteres. O serviço já traduz erro de validação sem truncar. As imagens mostram 12 disciplinas ignoradas e 3 tarefas com erro; não há evidência de uma falha única de rede.
- O worker processa por turma, mantém resultados e receipts idempotentes. A operação armazena snapshot da seleção; retry reutiliza esse snapshot.
- Há alterações preexistentes não commitadas em ClassroomSection.tsx, ClassroomSection.spec.tsx e classroom.css, autorizadas no chat: badges, modal e seleção recolhida. Preservá-las e revisá-las no apply. Cinco testes locais de interface passaram; lint/typecheck/build passaram na execução anterior. A suíte geral falhou em testes do fluxo OpenSpec com “Somente mudanças repo-local são suportadas”; não considerar a mudança validada por completo.

## Goals / Non-Goals

**Goals:** manter contratos, autorização e retenção existentes enquanto torna o fluxo compreensível e operável. Reaproveitar os controles da plataforma e o trabalho já implementado, validando lacunas.

**Non-Goals:** alterar provedores, gerar títulos com IA, baixar materiais, mudar callbacks, ampliar silenciosamente limites de tarefas, truncar descrições ou criar disciplinas com campos obrigatórios fictícios.

## Decisions

1. **Layout contido pelo shell.** Usar grid/flex com min-height: 0 e altura útil do shell, removendo a limitação de largura do Assistente e isolando overflow no histórico e transcript. Manter cabeçalho/compositor alcançáveis e overscroll contido. Evitar altura fixa de desktop que falha em telas baixas. Adaptar histórico recolhível no mobile, preservando barra inferior e teclado virtual. Alternativa de rolagem global foi descartada porque contraria o pedido.

2. **Título derivado de mensagem vigente no servidor.** Estender a listagem e o contrato de conversas com title e createdAt. Buscar primeira mensagem user não expirada, ordenada por created_at e id, com filtro da conta em todas as correlações; manter paginação por updatedAt/id. Usar texto puro, sem chamada ao provedor e sem coluna persistida com texto que sobreviva à retenção. Exibir createdAt no subtítulo em pt-BR no fuso da interface; mensagens seguintes não renomeiam a conversa. Título longo sofre apenas elipse visual com acesso ao texto completo. Alternativas de cache do título ou geração por IA adicionariam retenção indevida ou custo desnecessário.

3. **Superfícies por autoria e tema.** Aplicar atributo de autoria no item da mensagem e tokens semânticos para superfície azul clara da IA, rótulos textuais e contraste nos dois temas. Não usar azul claro com texto branco de baixo contraste.

4. **Ativas em todas as fronteiras.** Enviar filtro courseStates=ACTIVE na listagem e validar ACTIVE ao salvar seleção e antes de confirmar importação. Turma que foi arquivada durante a operação gera pendência segura sem apagar dados locais. Seleção antiga de arquivadas fica indisponível para nova importação. Validar acesso e estado no servidor, sem confiar no navegador.

5. **Seleção em lote real.** A ação “Selecionar todas as matérias” percorre páginas até o fim, deduplica IDs e preserva configurações existentes. Preparar seleção completa antes de aplicá-la; falha conserva seleção anterior e informa erro. Bloquear concorrência e detectar token repetido. Evitar “selecionar todas” limitado à primeira página. Corrigir CSS para excluir data-slot=checkbox das regras de altura de botões de ação, preservando foco e alvo acionável do rótulo.

6. **Resultado compacto com detalhes sob demanda.** Reutilizar Dialog acessível e badges com cores semânticas e texto. O resumo usa contagens da operação, não da página. Modal separa Disciplinas/Tarefas e mostra pendências de turmas somente quando presentes; explicitar página atual e conservar paginação, erros e revisão de conflitos. Não carregar todos os itens indiscriminadamente nem omitir falhas de turma. Recolher seleção ao obter estado terminal, inclusive após recarga; “Alterar seleção de matérias” restaura formulários. Não limpar seleção persistida.

7. **Pendências e recuperação.** Antes de iniciar, indicar turmas sem destino e oferecer configurar ou confirmar somente tarefas quando permitido. Não criar disciplina sem revisão obrigatória. Erro de descrição extensa conserva limite e conteúdo, informa revisar a atividade na origem e permite retry após correção; successes continuam idempotentes. Para destino alterado, salvar a seleção e iniciar nova solicitação explícita, pois retry usa snapshot antigo. Não reaproveitar silenciosamente uma operação com destino obsoleto. Para outros erros reais, capturar somente código/motivo sanitizado e corrigir causa reproduzida; a tentativa anterior de leitura do MySQL retornou EACCES, portanto o incidente real ainda precisa ser conferido com acesso autorizado.

## Risks / Trade-offs

- [Seleção em lote com muitas páginas] → loading, bloqueio concorrente, detecção de repetição de token e falha sem falsa seleção completa.
- [Turma arquivada após listagem] → revalidar na gravação/processamento e preservar importações anteriores.
- [Título expõe mensagem expirada] → consulta derivada com expires_at e testes de retenção/isolamento.
- [Modal mostra só uma página] → indicar paginação, diferenciar “nesta página” e permitir navegar por todos os resultados.
- [Descrições extensas continuam inelegíveis] → orientação explícita e retry após correção; não alegar que o limite foi eliminado.
- [Alterações preexistentes ou suíte global indisponível] → registrar diff inicial, validar hunks próprios e resolver/bloquear conclusão conforme resultados reais, sem mocks de banco.

## Migration Plan

A inspeção da migration original confirmou que conversas não possuem created_at. Adicionar migration versionada para essa coluna, preenchendo conversas legadas com a menor data de mensagem disponível ou updated_at quando vazias. Novas conversas gravam created_at explicitamente. Títulos continuam derivados por consulta e não são persistidos. Atualizar contratos e consumidores na mesma entrega. Validar a consulta com MySQL real isolado; se a inspeção de índices revelar necessidade, documentar migration versionada antes de aplicá-la, mantendo synchronize: false. Rollback reverte interface/consulta e preserva dados já importados e histórico.

No apply, manter branch adequada, registrar o estado inicial e revisar as alterações anteriores do chat. Após todas as tarefas e verificações aprovadas, preparar snapshots semânticos das duas specs e manifesto de paths explícitos conforme README; executar pnpm openspec:finish para commit único, sync e archive. Não criar commit de conclusão ou arquivar com falhas. Não publicar nem alterar callbacks OAuth locais ou de produção.
