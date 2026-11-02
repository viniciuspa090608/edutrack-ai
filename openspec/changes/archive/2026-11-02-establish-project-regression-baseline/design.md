# Design

## Context

Ver `proposal.md` para motivação. Já existem testes Vitest de contratos, componentes React/jsdom e integração HTTP/MySQL para a maioria dos módulos, além de testes Node do fluxo OpenSpec. Não há motivo para substituir essa infraestrutura. API e web limitam Vitest a dois workers; a API usa timeout de 20 segundos. `.github/workflows/quality.yml` provisiona MySQL 8.4 nativo e executa os checks obrigatórios. A geração atual é OpenAI global; roadmaps e flashcards possuem recibos assinados e preferência independente de IA.

Foi observado em `config/env.ts` que qualquer um de `AI_API_KEY`, `AI_MODEL` ou `AI_RECEIPT_KEY` exige os outros dois. A chave de recibo isolada no ambiente local é uma configuração parcial, não evidência de que o parser esteja defeituoso. Esta mudança não antecipa o novo contrato de ambiente da proposta de provedores.

## Goals / Non-Goals

**Goals:** completar cobertura de riscos atuais, obter uma execução verificável e corrigir somente desvios comprovados dos requisitos existentes. Produzir referências estáveis de testes que sirvam antes e depois da mudança de IA.

**Non-Goals:** cobertura de 100% por número, criação de testes triviais que espelham implementação, framework E2E novo, execução de APIs comerciais, correção irrestrita de todo o backlog, novos provedores ou alteração de regras de autenticação/IA para acomodar fixtures.

## Decisions

### 1. Matriz vinculada ao código existente

Entregar `validation/regression-matrix.md` e `validation/baseline-results.md` dentro desta mudança, que seguirão para o archive. Cada linha registra fluxo, spec/cenário vigente, arquivos e nomes de testes, tipo de validação, estados cobertos e resultado/lacuna. Usar suites existentes como `auth.http`, `profile.http`, `tasks.http`, `subjects.http`, `routines.http`, `pomodoro.http`, `flashcards.http`, `imports.http`, `reviews.http`, `analytics.http`, `study-progress.http`, `dashboard.http`, `demo` e os componentes correspondentes. Os nomes são pontos de partida observados, não prova de cobertura: ler assertions e preencher lacunas concretas durante apply. Não criar segunda suíte paralela duplicando os mesmos cenários.

Separar níveis: contratos verificam limites de entrada/saída; HTTP real verifica autorização, persistência e transações; componentes verificam estados e ações visíveis. jsdom não demonstra layout real de 320 px; validar visualmente páginas alteradas quando correções afetarem layout e registrar esse limite. Não adicionar navegador automatizado como requisito desta baseline.

### 2. Baseline antes de correções

Registrar Git, versões não secretas, comandos e resultados antes de editar. Executar os quatro checks mesmo que um falhe, respeitando dependências de build e evitando instâncias simultâneas da suíte MySQL. Classificar falhas: infraestrutura/configuração, teste/fixture ou defeito contra spec atual. Registrar diagnóstico sem dumps de ambiente ou corpos com credenciais. Dependência não disponível deixa etapa bloqueada e exige resolver a infraestrutura; nunca declarar pass por ausência de execução.

Criar reprodução focada antes de cada correção de produto, registrar falha, corrigir o menor trecho e verificar cenário afetado. Corrigir testes somente se estiverem contrários ao requisito ou usarem fixture inválida; não alterar expectativa apenas para aceitar o resultado atual. Incidentes que exigem nova regra de produto são documentados como fora do escopo, sem impedir a baseline se não houver defeito atual crítico. A entrega não pode conter falha conhecida dos checks ou lacuna crítica da matriz.

### 3. Ambiente de teste independente e seguro

Usar configuração sintética de teste e injeção de fronteiras existentes. Credenciais de MySQL podem vir do ambiente privado, mas modelos/segredos de provedores e recibos dos testes são sintéticos. Não sobrescrever `.env`, apagar a chave de recibo existente ou cadastrar chaves de IA reais para executar testes. Validar `DB_NAME != TEST_DB_NAME`, nomes aleatórios limitados ao prefixo de teste e cleanup em finally/afterAll. Conferir antes de qualquer cleanup que o destino é banco temporário próprio; nunca resetar o banco de desenvolvimento. Manter limite de workers e tempos existentes, corrigindo causa de instabilidade.

Para a configuração parcial local conhecida, documentar a exigência atual do trio e usar fixture de teste completa ou inteiramente ausente. O parser deve continuar rejeitando estado parcial; separar a futura migração de ambiente desta baseline. Um diagnóstico local de configuração não imprime valores e não modifica segredos sem necessidade concreta autorizada.

### 4. Matriz específica de riscos da IA

Nos três fluxos, cobrir preferência desativada, propriedade alheia sem fetch, sucesso com validação local, resposta inválida e excessiva, recusa/erro externo, timeout e ausência de gravação antes da confirmação. Cobrir confirmação repetida e recibos adulterados/vencidos onde o contrato prevê, progresso preservado na regeneração e independência dos fluxos manuais. Usar `aiFetch`/request injetado no app/adaptador para simular HTTP; manter serviços reais e MySQL real nas integrações. Testar também o acoplamento atual do trio de ambiente e ausência de segredos nas mensagens. O objetivo é proteger comportamento observável, sem fixar em todos os testes o nome da classe OpenAI que a próxima mudança substituirá.

### 5. Integração contínua e relatório

Manter os comandos raiz existentes como entrada única. Se uma suíte mantida não for alcançada, ajustar descoberta/scripts e comprovar sua execução e falha propagada com verificação controlada e revertida. Ajustar CI somente quando necessário para a mesma suíte com lockfile congelado, MySQL nativo e variáveis sintéticas. Não afirmar que o CI remoto passou quando só os comandos locais foram executados; execução remota depende de publicação explicitamente autorizada. Relatório inclui comandos locais, resultados e inspeção do workflow, separando evidência efetivamente executada de revisão estática.

### 6. Ordem entre mudanças

Concluir e arquivar `establish-project-regression-baseline` antes do apply de `add-account-ai-provider-settings`. Preservar os arquivos da proposta de IA que já estavam não rastreados no Git inicial; não incluí-los no manifesto desta mudança. No apply posterior, reler baseline e revalidar proposta de IA contra eventuais correções, sem implementar comportamento futuro agora. Manter testes de paridade de negócio após adaptar o contrato de ambiente na mudança seguinte; documentar expectativas deliberadamente substituídas pela spec posterior.

## Risks / Trade-offs

- A suíte existente é ampla → priorizar lacunas por risco e reutilizar testes; não confundir quantidade de arquivos com evidência de cobertura.
- Relógio e concorrência causam instabilidade → alinhar relógio, fixtures e lifecycle sem retries ou ampliação de timeout.
- Muitos defeitos surgem → corrigir apenas desvios reproduzidos dos requisitos atuais; mudança permanece incompleta se há falha crítica pendente.
- Dados de produção/desenvolvimento podem ser atingidos por cleanup incorreto → bancos temporários com validação explícita e testes negativos das guardas aplicáveis.
- Cobertura não garante ausência total de regressão → registrar limites reais, especialmente serviços externos simulados e layout não coberto por jsdom.

## Migration Plan

Não há migration de produto planejada. Mudanças de código são correções mínimas demonstradas por regressão. Reversão pode reverter o commit único, preservando dados e `.env`; não usar reset de banco. Após checks aprovados, preparar snapshots semânticos de `quality-commands` e manifesto próprio e executar o fluxo local `pnpm openspec:finish`, sem tag ou push. Se checks falharem, registrar trabalho pendente e não criar commit de conclusão.
