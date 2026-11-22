# Design

## Context

Ver proposal.md para motivação. AssistantPage mantém três sugestões filtradas por módulo. O catálogo compartilhado contém sete itens, e studyProgressSchema exige length(7); a projeção da API e o mapa de ícones usam o enum de códigos. UnifiedReportPrint reutiliza StudyProgressContent em modo de impressão, não um PDF estático independente.

OnboardingGate já monta ClassroomSection, também usado em Conta. O componente salva seleção, inicia operações e consulta andamento a cada dois segundos. classroom.routes.ts redireciona todo callback a /conta?classroom=...#account-integrations. Isso é uma diferença observada relevante, mas ainda não comprova a causa completa do relato de importação falhar em conta nova.

## Goals / Non-Goals

**Goals:** manter uma implementação de importação para as duas entradas, atualizar contratos e projeção juntos e compartilhar o catálogo na tela e impressão.

**Non-Goals:** reformular cadastro de identidade, solicitar novos escopos, alterar limites de descrições importadas, criar mecanismo novo de recompensas ou gerar arquivo PDF estático separado.

## Decisions

1. **Conquistas propostas:** FOURTEEN_DAY_STREAK (“Quatorze dias seguidos”, 14 datas consecutivas) e HUNDRED_REVIEWS (“Revisão dedicada”, 100 avaliações). São escolhas desta proposta, pois o usuário não definiu nomes ou critérios. Reutilizam maior sequência e contador de avaliações já derivados de eventos válidos; evitam instrumentar novos eventos. Preservar os sete códigos, critérios e concessões existentes. Reprocessar o histórico rastreado pelo mecanismo atual para reconhecer marcos já atingidos, usando o primeiro evento elegível e concessão única. Conferir persistência dos códigos antes de decidir se é necessária migration versionada.

2. **Contrato e apresentação:** atualizar enum, catálogo, tamanho da coleção, projeção e mapas de apresentação juntos. Adotar cores e ícones coerentes com o sistema existente. Relatório usa a mesma fonte de dados e mantém listagem de obtidas em duas colunas; não substituir essa regra por nove cards bloqueados no PDF.

3. **Sugestões com comportamento real:** ajustar texto, categoria e descrição do card de tarefas; adicionar card de ajuda para toda conta elegível. Inspecionar a seleção de contexto e orientação do provedor para que a nova pergunta não herde filtro exclusivo da semana e para ensinar apenas fluxos existentes dos módulos habilitados. Usar orientação curada do produto no caminho atual do assistente, sem ampliar ferramentas ou executar operações por pedir ajuda. Uma simples troca visual não valida essa resposta.

4. **Andamento e toast no componente compartilhado:** usar fases, processados e totais da operação existente, com barra indeterminada quando necessário. Processamento 100% não implica sucesso: resultado terminal determina texto e severidade. Notificar transição ativa→terminal uma vez por operação no acompanhamento, sem toast para resultado terminal carregado inicialmente. Não depender do toast para acesso a erros. Respostas tardias após desconexão continuam descartadas e nenhuma identidade antiga deve reaparecer.

5. **Retorno OAuth ligado à tentativa:** reproduzir com conta nova e contrastar o caminho de Conta, verificando persistência de preferências, passo inicial, retorno e primeira operação. Representar origem por enum interno onboarding/account vinculado à tentativa autenticada, nunca URL livre; tentativa sem contexto válido usa retorno seguro de Conta. O callback HTTP autorizado permanece o mesmo. Retomar onboarding com conexão e preferências recarregadas, sem concluir etapa nem iniciar importação automaticamente. Corrigir eventual falha adicional revelada pela reprodução dentro desse fluxo, mantendo ClassroomSection compartilhado.

## Risks / Trade-offs

- [Causa ainda não reproduzida] → testar retorno OAuth e criação inicial de destinos com conta realmente vazia; o redirecionamento fixo é evidência, não diagnóstico definitivo.
- [Contrato rejeita novo catálogo] → atualizar validações e consumidores na mesma entrega; testar nove itens e preservação de códigos antigos.
- [Concessões retroativas incorretas] → usar somente histórico rastreado já válido e testar limiares, datas e repetição, sem inferir atividade de objetos atuais.
- [Toast duplicado ou dados antigos após desconexão] → controlar transição pelo ID da operação e ciclo da conexão; testar polling repetido e respostas tardias.
- [PDF perde conteúdo] → renderizar prévia com nove obtidas e revisar paginação, duas colunas e totais.

## Migration Plan

Entregar contratos, API e web compatíveis na mesma mudança. Se o armazenamento restringir códigos, adicionar migration versionada antes de executar a nova projeção, mantendo synchronize false. Validar com MySQL isolado. Preservar concessões existentes e não apagar histórico em rollback; coordenar rollback dos consumidores que validam tamanho fixo. Manter API_PORT=3001 e API_PUBLIC_ORIGIN=http://localhost:3001 no ambiente padrão, callbacks localhost autorizados e HTTPS derivado da origem pública em produção.
