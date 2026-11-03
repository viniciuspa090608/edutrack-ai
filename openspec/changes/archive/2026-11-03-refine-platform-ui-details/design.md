# Design

## Context

Ver proposal.md para motivação. DashboardPage usa toLocaleString pt-BR sem opções de precisão e renderiza ícone, descrição e valor em sequência. ProfilePage possui âncoras estáticas cuja ordem diverge do conteúdo; o fuso aparece entre preferências e aparência e pertence ao grupo Preferências. Pomodoro usa grid de duas colunas com align-items: start e totais em grid independente. AuthLayout possui animação de chegada opcional e navigation-motion.ts já oferece finalização com timeout e movimento reduzido. O link de recuperação em AccessPage é uma âncora sem o mecanismo de navegação pública usado no retorno à landing.

packages/ui já contém Select baseado em radix-ui e NativeSelect; RadioGroup ainda não existe. Há usos nativos em TasksPage, SubjectsPage, SubjectSelect, RoadmapsSection, RoutinesPage, PomodoroPage, ClassroomSection, AISettingsSection, FlashcardAIFlow, ImportFlow e ReviewQueue. ClassroomSection possui fluxos conectados e de importação além do estado desconectado mostrado na imagem.

O Git estava limpo na inspeção inicial. Existe a mudança refine-auth-desktop-layout com tarefas de conclusão pendentes; isso requer revisão da sobreposição antes do apply, sem alterar seus artefatos.

## Goals / Non-Goals

**Goals:** reutilizar primitivas compartilhadas, tokens e navegação existentes; tornar layout dependente do espaço disponível e manter comportamento acessível.

**Non-Goals:** alterações de API, contratos, armazenamento, regras de seleção, segurança de recuperação ou funcionamento da integração Classroom. Nenhuma implementação faz parte do propose.

## Decisions

1. **Select existente como base.** Migrar consumidores explicitamente para Select/Trigger/Content/Item com value/onValueChange tipados. Não tentar estilizar o popup do sistema operacional via CSS nem substituir globalmente a implementação de NativeSelect com uma API incompatível. Valores vazios de domínio precisam de um sentinela interno não conflitante, traduzido de volta antes de handlers/payloads; SelectItem não aceita string vazia. Preservar name, validação, label, required, disabled, defaults e reset quando usados. Conferir portais e foco nos FormModal. Auditar inventário até não restar seletor nativo visível no escopo da aplicação.
2. **RadioGroup compartilhado.** Adicionar componente no padrão shadcn/ui usando radix-ui já instalado, seguindo normalização/imports do pacote e tokens atuais; não acrescentar biblioteca paralela. Agrupar rótulos de modo de IA e associar ids. O grupo de ações usa flex com gap; Salvar cresce e Recarregar usa width: fit-content, sem flex-grow. Em largura insuficiente permite quebra.
3. **Navegação de conta por um catálogo ordenado.** Usar a sequência real Perfil, Preferências (incluindo fuso), Aparência, Segurança, IA, Integrações e Conta, respeitando renderização condicional. Gerar menu a partir dessa sequência e observar seções com IntersectionObserver. Escolher a última seção cujo início ultrapassou a linha de referência abaixo do cabeçalho, ou a primeira visível antes disso; no fim da rolagem selecionar a última seção visível. Resolver empates por ordem do documento. Recalcular após mudanças de altura e limpar listeners/observers. Usar classe de ativo e aria-current=location; hover é visual, não evento disparado. Scroll passivo não altera foco nem hash; ativação explícita de âncora mantém navegação acessível e rascunhos. CSS sticky/scroll-margin mantém destino descoberto.
4. **Composição local em CSS.** Preferências em grid de três colunas com quebra responsiva. ClassroomSection fica dentro de Card com título/logo e conteúdo integral, sem criar card externo em ProfilePage que duplique superfícies. Usar asset local fiel do Classroom de origem oficial documentada; não reutilizar o G de login. Obter e revisar o asset durante apply. Dashboard usa descrição com muted-foreground e linha flex de ícone/valor; data usa opções explícitas de dia/mês/ano/hora/minuto, 24 horas e separador determinístico, preservando o fuso local hoje usado na linha. Não aplicar essa simplificação ao período/fuso do gráfico semanal.
5. **Altura elástica do Pomodoro.** Alterar alinhamento do grid para stretch e dividir a coluna lateral em duas faixas flexíveis, mantendo gap e min-width: 0. Não usar altura fixa ou medição JS. Em uma coluna restaurar altura natural. Conferir tanto preparação quanto estados de sessão com conteúdo maior.
6. **Transição de acesso.** Reutilizar mecanismos existentes de navegação/saída e chegada de autenticação, garantindo uma única navegação, fallback de término e foco no título do destino. Não aplicar animação global a cada alteração de campo ou etapa interna. Links inferiores em wrapper flex com gap e wrap. Preferência por movimento reduzido evita espera visual. Preservar rotas, retorno permitido e regras de recuperação. Consultar os artefatos da mudança de autenticação pendente para preservar suas restrições de altura e feedback.

## Risks / Trade-offs

- [Select customizado altera semântica de testes e formulários] → validar interação via roles/teclado, payloads, opção vazia, reset e campos obrigatórios; não manter assertions específicas de option nativo.
- [Portais de Select em modal] → conferir sobreposição, Escape, foco e rolagem nas superfícies reais.
- [Scrollspy oscila em seções curtas ou próximas ao rodapé] → regra determinística por posição/ordem e caso explícito de fim da página.
- [CSS compartilhado de autenticação sobrepõe trabalho pendente] → revisar diff e preservar restrições e arquivos preexistentes; não finalizar outra mudança.
- [Alinhamento desktop causa espaços artificiais mobile] → regras limitadas ao layout de duas colunas e QA de 320 px a desktop.

## Migration Plan

Implementar componentes compartilhados, migrar seletores, aplicar ajustes locais e navegação, executar regressões e QA visual em ambos os temas. Sem migração de dados. Reversão por commit caso necessária, preservando contratos. Ao finalizar o apply usar o fluxo openspec:finish do projeto com manifesto explícito e snapshots semanticamente revisados; não publicar no remoto.
