# Spec Delta

## Purpose

Definir uma identidade visual consistente, acessível e responsiva para os fluxos reais de Perfil/Conta do EduTrack, preservando dados, preferências, contratos e segurança existentes.

## ADDED Requirements

### Requirement: Organização visual completa da conta

A área `/conta` SHALL apresentar resumo de identidade e grupos de perfil, preferências, aparência e segurança/conta com hierarquia e navegação interna coerentes com os módulos renovados do EduTrack. Todos os formulários, subfluxos e estados existentes SHALL seguir o mesmo padrão mesmo sem equivalente no Stitch. A navegação SHALL preservar drafts e estados intermediários, expor apenas destinos reais e não criar seções vazias.

#### Scenario: Navegar durante uma edição
- **WHEN** a pessoa navega entre grupos com nome em edição ou troca de e-mail em andamento
- **THEN** encontra o grupo indicado sem perder os dados em edição, a etapa de identidade ou o estado de reenvio.

### Requirement: Referência visual subordinada aos recursos reais

A interface SHALL usar somente dados reais da conta e controles suportados. O Stitch SHALL orientar apresentação, sem introduzir dados estáticos, campos acadêmicos, telefone, username, notificações, 2FA, dispositivos, planos, integrações, exclusão de conta ou botões sem ação. A atualização SHALL preservar endpoints, formatos, autenticação, armazenamento e validações existentes.

#### Scenario: Protótipo contém dados sem suporte
- **WHEN** o design mostra semestre, matrícula, telefone, plano ou configurações inexistentes
- **THEN** a área usa o espaço visual para o conteúdo real da conta e não mostra campos ou ações fictícias.

### Requirement: Perfil e foto com apresentação coerente

A área SHALL destacar avatar/fallback, nome, e-mail, verificação e meios de entrada reais. Edição de nome e seleção/preview/salvamento/remoção de foto SHALL preservar ações, limites e transporte atuais, com feedback do servidor. A foto SHALL continuar JPEG, PNG ou WebP estático de até 2 MiB, 64–4096 pixels por lado e até 16 milhões de pixels; o design SHALL NOT adotar os 5 MB do Stitch.

#### Scenario: Preview e upload
- **WHEN** a pessoa seleciona uma foto válida e depois salva
- **THEN** a interface distingue preview de foto confirmada e só informa salvamento após a API confirmar.

#### Scenario: Falha ou arquivo inválido
- **WHEN** o nome ou foto é inválido, ou a API rejeita a atualização
- **THEN** a interface anuncia a falha, mantém os dados confirmados e permite corrigir ou tentar novamente sem indicar sucesso.

#### Scenario: Remover foto
- **WHEN** a API confirma remoção da foto
- **THEN** a mesma área exibe o fallback e confirma a remoção com a identidade visual atualizada.

### Requirement: Preferências e aparência sem novos contratos

Os controles de tarefas, matérias, flashcards e IA SHALL refletir os booleanos persistidos e manter ao menos um módulo de estudo ativo. O fuso SHALL preservar valor IANA, sugestão explícita, persistência atual e aplicação somente a novas atividades. A área SHALL disponibilizar claro/escuro pelo mecanismo de tema existente, sem novos valores ou persistência de conta.

#### Scenario: Último módulo ativo
- **WHEN** a pessoa tenta desativar o último módulo de estudo, inclusive com IA ativa
- **THEN** a interface mantém a regra atual e comunica a recusa sem confirmar uma preferência inexistente.

#### Scenario: Salvar fuso
- **WHEN** a pessoa escolhe usar a sugestão do navegador e salva o fuso
- **THEN** a sugestão só persiste após ação explícita e confirmação da API, sem alterar datas antigas.

#### Scenario: Mudar aparência
- **WHEN** a pessoa alterna claro/escuro
- **THEN** todas as interfaces da conta atualizam pelo mecanismo existente e a escolha segue a persistência atual do tema.

### Requirement: Segurança e ações de conta visualmente integradas

Troca de e-mail, prova de identidade local/Google, código, espera/reenvio, troca de senha local, orientação de recuperação Google, vínculo Google e logout SHALL receber apresentação consistente com Perfil/Conta sem mudar etapas, restrições, disponibilidade, chamadas, sessão ou redirecionamentos. A UI SHALL manter senha atual/nova e política de 12–128 caracteres, sem simular sucesso ou oferecer senha local a conta exclusiva Google. Logout SHALL preservar a ação e tratamento de falha atuais, sem introduzir confirmação obrigatória nova.

#### Scenario: Troca de e-mail em etapas
- **WHEN** a pessoa prova identidade e pede troca de e-mail
- **THEN** os formulários de endereço/código, limites e cooldown seguem o novo padrão, preservando e-mail atual até confirmação e reentrada após sucesso.

#### Scenario: Prova expirada ou código recusado
- **WHEN** a API exige nova prova de identidade ou recusa o código
- **THEN** a interface mostra o erro real e a etapa adequada sem apresentar o novo e-mail como salvo.

#### Scenario: Senha local e conta Google exclusiva
- **WHEN** a pessoa abre Segurança
- **THEN** vê os campos reais de senha local apenas se houver credencial local; conta exclusiva Google mantém orientação de gerenciamento/recuperação externa.

#### Scenario: Vínculo Google
- **WHEN** o vínculo termina com sucesso, falha ou conflito
- **THEN** a área mostra feedback correspondente com o mesmo padrão visual e conserva a identidade da conta e comportamento OAuth existentes.

#### Scenario: Sair da conta
- **WHEN** a pessoa usa a ação de logout
- **THEN** a interface mostra submissão e mantém chamada/redirecionamento atuais; em falha, mostra erro e permite nova tentativa.

### Requirement: Feedback acessível em ambos os temas e tamanhos

Toda a área SHALL usar superfícies, textos, bordas, controles e feedback legíveis em claro/escuro, incluindo hover, focus, selected e disabled. SHALL oferecer rótulos, foco visível, teclado, anúncios de loading/erro/sucesso e respeito a movimento reduzido. SHALL manter os bloqueios reais durante submissão e nunca comunicar sucesso antes da API. De 320 px a desktop, navegação, textos longos, avatar, formulários e eventuais overlays SHALL caber sem overflow horizontal do layout; mobile SHALL adaptar a navegação lateral.

#### Scenario: Falha no carregamento
- **WHEN** perfil, preferências, fuso ou sessão não podem ser carregados
- **THEN** os estados reais de loading/erro/retry seguem a mesma identidade visual sem dados de preenchimento fictícios ou conteúdo privado antes da verificação.

#### Scenario: Mobile e tema escuro
- **WHEN** a pessoa abre todos os grupos em 320 px com tema escuro e usa teclado
- **THEN** textos e controles permanecem legíveis e alcançáveis, foco e feedback são perceptíveis e o layout não exige rolagem horizontal.

#### Scenario: Operação em andamento
- **WHEN** uma ação está aguardando resposta
- **THEN** o botão e os controles refletem loading/disabled conforme o bloqueio existente e a confirmação visual só aparece após resposta bem-sucedida.
