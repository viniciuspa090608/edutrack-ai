## ADDED Requirements

### Requirement: Continuidade da navegação autenticada
A navegação entre destinos privados SHALL atualizar apenas o conteúdo necessário, mantendo shell, header e sidebar montados, sem recarga do documento nem novo estado global de verificação causado apenas pela troca de rota. SHALL preservar expansão e rolagem da sidebar quando aplicáveis e atualizar destino ativo, inclusive em voltar/avançar. SHALL preservar links reais, clique modificado, parâmetros, hashes, gates e acesso direto seguro; o menu Mais SHALL fechar após selecionar um destino mobile.

#### Scenario: Troca de aba e histórico
- **WHEN** a pessoa alterna entre destinos privados e usa voltar/avançar
- **THEN** sidebar e header permanecem, o estado e scroll aplicáveis são conservados e somente o destino corrente aparece ativo.

#### Scenario: Entrada direta e sessão expirada
- **WHEN** uma rota privada é aberta diretamente ou uma requisição detecta sessão expirada
- **THEN** a validação e o redirecionamento existentes protegem o conteúdo sem exposição indevida de dados.

### Requirement: Movimento coordenado na área autenticada
Ao trocar de destino interno, a web SHALL executar `fadeIn` apenas no conteúdo principal, uma vez por navegação efetiva, sem reiniciar por renderizações, tema ou consultas. Sair pelo shell ou Conta SHALL iniciar a chamada real de logout independentemente de `backOutLeft` no conteúdo autenticado, bloquear duplicatas e redirecionar para `/acesso` após sucesso e término ou fallback limitado da animação. Falhas SHALL restaurar conteúdo utilizável e apresentar erro recuperável. Interrupção, cancelamento ou ausência de animação SHALL NOT impedir a chamada de encerramento nem prender a navegação. Movimento reduzido SHALL desativar ou reduzir movimento sem atrasos artificiais.

#### Scenario: Troca de conteúdo
- **WHEN** a pessoa navega para outra aba e depois o conteúdo recebe novos dados
- **THEN** somente a troca de aba produz uma entrada fadeIn e o shell não é animado novamente.

#### Scenario: Logout interrompido
- **WHEN** a pessoa clica Sair e a animação é cancelada ou não emite evento de término
- **THEN** uma única chamada real de logout prossegue e seu sucesso leva a acesso pelo fallback limitado.

#### Scenario: Falha ao sair
- **WHEN** o servidor recusa ou falha ao encerrar a sessão
- **THEN** a interface reaparece operável com erro visível e nova tentativa, sem simular logout.

#### Scenario: Movimento reduzido
- **WHEN** a preferência de movimento reduzido está ativa ou muda durante a transição
- **THEN** a navegação e o logout continuam sem depender de eventos de animação e sem movimento amplo.

## MODIFIED Requirements

### Requirement: Estados e páginas preservados

O shell SHALL respeitar os gates e estados atuais de verificação, sessão válida/ausente/expirada, preferências indisponíveis e módulo desativado. SHALL NOT renderizar conteúdo privado antes da validação, considerar falha como coleção vazia ou habilitar módulos por falta de preferências. SHALL preservar a lógica existente de carregamento e erro. As alterações em páginas internas, landing e autenticação pública SHALL limitar-se aos requisitos explícitos desta mudança de continuidade, movimento e apresentação dos cadastros, mantendo os demais comportamentos.

#### Scenario: Preferências ainda indisponíveis
- **WHEN** a sessão é válida e as preferências não estão disponíveis, por carregamento ou falha
- **THEN** os módulos condicionais continuam omitidos e os destinos incondicionais e a Conta continuam acessíveis, mantendo os estados existentes sem simular sucesso ou vazio.

#### Scenario: Sessão em verificação ou negada
- **WHEN** a verificação está pendente ou a sessão é ausente/expirada
- **THEN** os estados, retry ou redirecionamento atuais são preservados sem exposição antecipada do shell e conteúdo privado.

### Requirement: Barra inferior mobile e menu Mais

Abaixo de 1024 px, o shell SHALL substituir a sidebar por barra inferior com Início, Tarefas, Matérias, Flashcards e Mais, removendo e redistribuindo os itens de módulos desativados sem espaços vazios. Mais SHALL agrupar somente Pomodoro, Rotinas, Estatísticas, Progresso, Conta e Sair. SHALL ter abertura/fechamento acessíveis, Escape, gestão de foco e retorno ao acionador ao fechar sem navegar; ao selecionar destino, o foco SHALL seguir para o conteúdo correspondente; SHALL fechar ou deixar de existir ao passar para desktop, sem overlay ou bloqueio de scroll residual.

#### Scenario: Módulos parcialmente habilitados
- **WHEN** somente Matérias está habilitado
- **THEN** a barra apresenta Início, Matérias e Mais distribuídos na largura disponível, e os demais destinos existentes continuam em Mais.

#### Scenario: Menu aberto e mudança de largura
- **WHEN** a pessoa abre Mais por teclado e muda a viewport para desktop
- **THEN** o menu mobile deixa de capturar foco e scroll, e a navegação desktop permanece operável.
