## ADDED Requirements

### Requirement: Progresso visual e notificação terminal da importação
No onboarding e em Conta, a importação SHALL apresentar barra acessível desde a fila até o término. Com total positivo conhecido, SHALL usar processados e total reais; sem total conhecido SHALL usar estado indeterminado e fase textual, sem percentual fictício. Ao observar transição de uma operação ativa para terminal, SHALL anunciar um toast de conclusão completa, parcial ou falha, coerente com o resultado persistido. Toast e progresso SHALL respeitar teclado, temas, movimento reduzido e 320 px, sem roubar foco. O resumo e detalhes SHALL permanecer disponíveis após o toast. Polling repetido SHALL NOT repetir o toast da mesma transição na sessão de acompanhamento; recuperar resultado já terminal após recarga SHALL mostrar o resumo sem novo toast.

#### Scenario: Total desconhecido e conhecido
- **WHEN** uma importação sai da fila e disponibiliza total positivo e quantidade processada
- **THEN** a barra muda de indeterminada para progresso calculado pelos dados reais, com fase e valores acessíveis.

#### Scenario: Processamento parcial
- **WHEN** todos os itens foram processados mas alguns falharam
- **THEN** a barra pode indicar processamento completo e o toast informa conclusão parcial, mantendo erros e nova tentativa no resumo sem declarar sucesso integral.

#### Scenario: Polling e recuperação
- **WHEN** o mesmo resultado terminal é consultado repetidamente ou recuperado após recarga
- **THEN** o resumo permanece correto sem repetir notificações nem iniciar outra importação.

#### Scenario: Falha ou lista vazia
- **WHEN** a operação termina em falha ou conclui sem itens elegíveis
- **THEN** o toast informa falha ou sucesso sem adições respectivamente, sem calcular divisão por zero e sem remover detalhes.

### Requirement: Importação funcional no primeiro acesso
Uma conta nova SHALL conseguir conectar Classroom, retornar da autorização, selecionar turmas e destinos, confirmar e acompanhar importação durante o onboarding sem precisar abrir Conta. O retorno da autorização iniciada no onboarding SHALL retomar essa etapa com sessão e preferências persistidas; autorização iniciada em Conta SHALL manter seu retorno atual. Cancelamento e falha SHALL oferecer explicação e nova tentativa ou continuação manual. Continuar ou pular o onboarding SHALL NOT iniciar importação automática, cancelar trabalho confirmado nem perder resultado. Recarga e navegação entre onboarding e Conta SHALL recuperar a mesma operação autenticada sem duplicação.

#### Scenario: Conta nova importa antes de entrar no aplicativo
- **WHEN** uma conta sem disciplinas locais salva seus módulos, conecta Classroom no onboarding, revisa destinos de novas disciplinas e confirma a importação
- **THEN** retorna à etapa Classroom, acompanha a operação e consulta disciplinas e tarefas importadas sem passagem obrigatória por Conta.

#### Scenario: Continuar com operação em andamento
- **WHEN** a pessoa continua para o aplicativo durante uma importação iniciada no onboarding
- **THEN** a operação continua e fica recuperável em Conta sem novo envio ou duplicação dos registros.

#### Scenario: Recusa e preferências
- **WHEN** uma conta nova recusa OAuth ou mantém Tarefas e Disciplinas desabilitados
- **THEN** vê explicação adequada e pode continuar manualmente; nenhum módulo é ativado nem importação iniciada sem confirmação.

#### Scenario: Retorno seguro de Conta
- **WHEN** a conexão é iniciada em Conta ou o contexto de retorno é inválido
- **THEN** a aplicação usa destino interno permitido, preserva retorno existente de Conta e rejeita redirecionamento externo sem alterar os callbacks OAuth autorizados.
