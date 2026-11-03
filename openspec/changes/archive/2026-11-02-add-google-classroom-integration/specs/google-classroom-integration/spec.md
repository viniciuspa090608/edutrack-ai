## Purpose

Permitir conectar Google Classroom opcionalmente e importar turmas e atividades sob controle do usuário, com rastreabilidade, isolamento e proteção dos dados locais.

## ADDED Requirements

### Requirement: Consentimento independente e mínimo
O sistema SHALL exigir sessão Edutrack e consentimento OAuth específico para Classroom, separado do login Google. SHALL validar a identidade Google autorizada, os escopos efetivamente concedidos e o vínculo da tentativa à sessão. SHALL solicitar somente leitura de turmas e atividades para importação; o fluxo SHALL NOT solicitar escopos de materiais ou Drive nem baixar arquivos. Cancelamento, escopo recusado, restrição institucional e credencial expirada SHALL produzir estado explicativo e opção de reconectar, sem impedir uso manual nem criar outra conta Edutrack.

#### Scenario: Login Google sem Classroom
- **WHEN** uma pessoa autenticada com Google abre a integração sem consentimento Classroom
- **THEN** a conexão permanece desconectada e nenhum dado Classroom é lido.

#### Scenario: Consentimento incompleto
- **WHEN** o Google retorna autorização sem um escopo necessário
- **THEN** a funcionalidade afetada fica indisponível com motivo e reconexão, sem aparentar conexão suficiente.

### Requirement: Seleção explícita e módulos independentes
O sistema SHALL listar turmas acessíveis de forma paginada e permitir selecionar e alterar apenas as próprias turmas autorizadas, sem importar turmas não selecionadas. Matérias habilitadas SHALL permitir associar cada turma a uma matéria própria existente ou criar uma após revisão dos dados obrigatórios. Tarefas habilitadas SHALL permitir importar atividades; com matérias desligadas, SHALL criar tarefas sem vínculo, preservando a origem. Com tarefas desligadas, SHALL importar somente matérias; com ambos desligados, SHALL explicar a indisponibilidade sem ativar módulos. Preferências SHALL ser verificadas também durante processamento.

#### Scenario: Somente tarefas habilitadas
- **WHEN** a pessoa importa atividades de duas turmas selecionadas com matérias desligadas
- **THEN** recebe tarefas sem matéria com identificação e link da origem e nenhuma matéria é criada ou alterada.

#### Scenario: Módulo desativado durante operação
- **WHEN** o usuário desativa tarefas enquanto uma importação está em execução
- **THEN** itens ainda não confirmados desse módulo são ignorados com motivo, sem novas escritas no módulo desativado.

### Requirement: Execução manual observável e retomável
Importações SHALL iniciar somente por ação explícita. O sistema SHALL apresentar fases, quantidades processadas e totais quando conhecidos, sem percentuais fictícios. Operações e resultados SHALL sobreviver à recarga. O resultado SHALL distinguir concluída, parcialmente concluída e falhou; informar matérias e tarefas adicionadas, atualizadas, inalteradas, ignoradas e com conflito ou erro, com identificação e motivo seguro por item. Concluída SHALL significar todos os itens elegíveis tratados sem pendências; parcial SHALL significar resultados úteis e pendências; falhou SHALL significar impossibilidade de processar ou ausência de resultado útil diante de erros. Lista vazia sem erro SHALL ser sucesso sem adições. SHALL oferecer nova tentativa para falhas recuperáveis sem desfazer sucessos.

#### Scenario: Falha de uma turma
- **WHEN** uma turma é importada e outra retorna acesso negado
- **THEN** o resultado é parcial, mostra as contagens confirmadas e o motivo da turma não importada e permite tentar novamente.

#### Scenario: Recarregar durante execução
- **WHEN** a pessoa recarrega ou sai do onboarding durante uma importação solicitada
- **THEN** pode continuar usando a conta e consultar o andamento e resultado no perfil sem disparar outra importação.

### Requirement: Idempotência e preservação manual
A identidade de origem SHALL considerar usuário Edutrack, conta Google, turma e atividade. Repetições e solicitações concorrentes SHALL NOT criar duplicatas. Atualizações remotas SHALL atualizar somente campos ainda iguais ao último valor importado; diferenças em campos editados localmente SHALL preservar o valor local e apresentar conflito revisável com valores local e remoto. Status, subtarefas e progresso locais SHALL ser preservados. Exclusões locais SHALL NOT ser recriadas silenciosamente; sua restauração SHALL exigir ação explícita. Remoção remota, desmarcar turma e desconectar SHALL NOT apagar conteúdo local.

#### Scenario: Alteração local concorrente
- **WHEN** um prazo local é editado após a leitura da importação e antes da confirmação
- **THEN** a importação preserva a edição por controle de concorrência e informa conflito em vez de sobrescrever.

#### Scenario: Repetição após sucesso parcial
- **WHEN** o usuário repete uma operação parcialmente concluída
- **THEN** registros já importados não são duplicados e os itens recuperáveis podem ser processados.

### Requirement: Gestão da conexão no perfil
Em Perfil → Configurações → Integrações → Google Classroom, acessível em `/conta`, o usuário SHALL poder conectar, ver conta Google e estado da conexão, consultar última importação e operação ativa, ajustar turmas, iniciar importação, reconectar e desconectar. Desconectar SHALL invalidar credenciais locais imediatamente e impedir novas chamadas e confirmações pendentes da conexão anterior; SHALL tentar revogar a autorização remota e informar falha de revogação sem restaurar a conexão local. Dados já importados SHALL permanecer. Reconectar a outra conta Google SHALL exigir seleção nova e não reutilizar associações da conta anterior.

#### Scenario: Desconexão durante execução
- **WHEN** a pessoa desconecta com uma operação ativa
- **THEN** o trabalho não confirmado é interrompido, resultados confirmados permanecem e nenhuma nova gravação usa a conexão antiga.

### Requirement: Isolamento e experiência acessível
Toda operação, seleção, conflito e resultado SHALL pertencer ao usuário autenticado; IDs alheios SHALL retornar não encontrado. Credenciais SHALL NOT aparecer em respostas ou logs. A interface SHALL distinguir carregamento, vazio, sucesso, parcial e erro, anunciar andamento sem roubar foco, funcionar por teclado e desde 320 px e respeitar movimento reduzido.

#### Scenario: Resultado de outra conta
- **WHEN** uma pessoa solicita por ID uma operação pertencente a outra conta
- **THEN** recebe não encontrado sem conteúdo, contagens ou identidade Google da outra conta.

#### Scenario: Seleção em tela estreita
- **WHEN** a pessoa seleciona turmas e consulta erros por teclado em 320 px
- **THEN** consegue concluir o fluxo com foco visível e mensagens acessíveis sem rolagem horizontal causada pelo layout.

### Requirement: Importação independente de IA e arquivos
A integração SHALL importar somente metadados de turmas/atividades e links HTTPS de origem/anexos, sem download de PDFs/arquivos, extração, geração de notas ou chamadas ao provedor de IA. Ligar IA SHALL NOT alterar essa regra. Os aprimoramentos existentes de roadmaps e flashcards SHALL permanecer independentes; chat SHALL ficar fora desta mudança.

#### Scenario: Importar com IA habilitada
- **WHEN** a pessoa importa turmas com IA habilitada e o provedor de IA indisponível
- **THEN** matérias/tarefas elegíveis são processadas sem chamar IA ou Drive e a integração não oferece geração de notas.
