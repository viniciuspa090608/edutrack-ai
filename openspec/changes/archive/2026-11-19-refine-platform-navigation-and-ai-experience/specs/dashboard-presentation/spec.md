## MODIFIED Requirements

### Requirement: Pomodoro vivo no resumo da Home
Com sessão aberta o card Pomodoro SHALL mostrar somente o cronômetro MM:ss no resumo de uma sessão disponível, mantendo cabeçalho, contagem de sessões e ação contextual: Iniciar pomodoro quando o tempo confirmado estiver zerado e Abrir pomodoro nos demais estados. O resumo normal SHALL dispensar controles de sessão, texto de status e rolagem interna. Durante RUNNING SHALL atualizar o tempo sem recarga; PAUSED SHALL manter o tempo parado e BETWEEN_BLOCKS SHALL manter o tempo sem iniciar novo bloco. Ao atingir zero SHALL limitar a contagem e reconciliar com o servidor sem duplicar conclusões. Retorno à Home, foco e visibilidade SHALL atualizar a sessão; falha SHALL ser identificada sem simular tempo confirmado ou iniciar outra sessão.

#### Scenario: Sessão em andamento
- **WHEN** a pessoa inicia Pomodoro e volta à Home
- **THEN** o card mostra a sessão existente e a contagem avança com o mesmo significado do módulo.

#### Scenario: Pausa e retomada
- **WHEN** a sessão é pausada ou retomada e a Home reconcilia seu estado
- **THEN** o cronômetro para ou volta a contar a partir do estado confirmado.

#### Scenario: Limite do bloco e indisponibilidade
- **WHEN** a contagem chega a zero e a consulta de reconciliação falha
- **THEN** não aparece tempo negativo, conclusão duplicada ou novo bloco automático, e a indisponibilidade permite tentar novamente.

#### Scenario: Resumo com sessão disponível
- **WHEN** a Home tem uma sessão de Pomodoro disponível
- **THEN** o corpo apresenta apenas o tempo, sem rolagem interna, e o rodapé oferece Iniciar pomodoro no zero confirmado ou Abrir pomodoro com tempo positivo.

#### Scenario: Resumo zerado
- **WHEN** a Home apresenta 00:00 com estado reconciliado
- **THEN** a ação exibe Iniciar pomodoro no lugar de Abrir pomodoro, encaminha ao fluxo real e não inicia sessão ou bloco automaticamente. Se a sessão ainda estiver aberta, seu estado SHALL ser respeitado sem criar duplicata.

#### Scenario: Reconciliação pendente ou falha
- **WHEN** a contagem local chega a zero sem confirmação do servidor
- **THEN** a interface reconcilia e mantém loading ou erro recuperável, sem oferecer criação duplicada com base apenas na projeção local.

### Requirement: Centralização vertical da ação inicial de Pomodoro
O card Pomodoro da Home SHALL apresentar Iniciar Pomodoro próximo ao texto introdutório, em área compacta com espaçamento legível, sem expandir espaço vazio para centralizar o botão. SHALL preservar cabeçalho, contagem de sessões e ação contextual Iniciar pomodoro quando zerado ou Abrir pomodoro nos demais estados.

#### Scenario: Pomodoro disponível para iniciar
- **WHEN** o card exibe a ação Iniciar Pomodoro
- **THEN** texto e botão formam um grupo compacto e permanecem legíveis em telas estreitas.
