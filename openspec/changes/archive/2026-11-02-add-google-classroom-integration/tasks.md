# Tasks

Escopo revisado por instrução explícita do usuário: manter importação Classroom e aprimoramentos existentes; excluir PDFs/arquivos, notas por IA e chat. Tarefas de geração e diagnóstico do provedor deixam de integrar o aceite; não são marcadas como realizadas.

## 1. Contratos e persistência

- [x] 1.1 Registrar estado Git e preservar alterações da execução anterior na branch codex/add-google-classroom-integration.
- [x] 1.2 Validar DTOs de conexão, seleção, importação, progresso, conflito e proveniência sem credenciais.
- [x] 1.3 Migrar onboarding, conexões, tentativas, seleções, jobs/itens e origens/recibos, com índices e MySQL real isolado.
- [x] 1.4 Validar chave independente e OAuth; integração sem configuração permite uso manual.

## 2. OAuth e cliente Google

- [x] 2.1 Separar consentimento de login, com state, nonce, PKCE, sessão/navegador, expiração e proteção contra replay.
- [x] 2.2 Criptografar tokens, validar identidade/escopos, refresh, invalid_grant e falhas temporárias sem vazamento.
- [x] 2.3 Ler turmas/atividades com paginação, limites e tentativas finitas para 429/5xx; autorização adicional de professor separada.
- [x] 2.4 Desconectar localmente antes de revogar; preservar dados, limpar seleção na troca de identidade e impedir commits da conexão anterior.

## 3. Importação dos produtores

- [x] 3.1 Exigir associação própria ou planejamento válido de matéria, sem prazo/horas inventados.
- [x] 3.2 Importar tarefas por contrato público com título, descrição suportada, links e prazo original/fuso, sem truncamento.
- [x] 3.3 Garantir origem única, transação, recibos e retry sem duplicação/crash entre commit e resultado.
- [x] 3.4 Preservar edição manual, status/subtarefas/prioridade e resolver conflitos com revisão concorrente.
- [x] 3.5 Preservar exclusões locais e exigir restauração explícita; não excluir ao desmarcar/desconectar.
- [x] 3.6 Aplicar matriz de módulos e revalidar capacidade/conexão antes de acesso e commit, sem eventos indevidos.

## 4. Jobs e interface

- [x] 4.1 Implementar endpoints autenticados com requestId, operação ativa única, isolamento e paginação.
- [x] 4.2 Processar jobs manuais com lease, heartbeat, checkpoint e retomada limitada.
- [x] 4.3 Exibir vazio/concluído/parcial/falhou, contagens confirmadas, motivos por item e retry explícito.
- [x] 4.4 Persistir onboarding e oferecer conectar/agora não; falhas não bloqueiam conta ou fluxos manuais.
- [x] 4.5 Integrar perfil, seleção, importação, resultado, reconexão/desconexão e proveniência.

## 5. Remoção aprovada de arquivos/IA

- [x] 5.1 Remover extrator/PDF.js, serviços/rotas/contratos/UI e tabelas novas de notas, limites de PDF e documentação de geração.
- [x] 5.2 Não solicitar materiais/Drive, inclusive ao reconectar grants antigos; preservar somente links de anexos.
- [x] 5.3 Restaurar catálogo/transporte de IA anterior; preservar aprimoramentos de roadmaps/flashcards e deixar chat fora do escopo.
- [x] 5.4 Verificar importação com IA ligada sem chamadas ao provedor/Drive e rejeição das rotas/consentimento removidos.

## 6. Validação e conclusão

- [x] 6.1 Confirmar evidências reais de OAuth, importação/reimportação e revogação no escopo remanescente e revisão final de teclado/320 px/estados.
- [x] 6.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build, com MySQL real isolado e regressões dos aprimoramentos existentes.
- [x] 6.3 Preparar quatro snapshots semânticos preservando specs atuais e manifesto explícito; revisar staged, segredos e git diff --cached --check.
- [x] 6.4 Confirmar prontidão para conclusão: todas as tarefas aplicáveis verificadas e refs reais consultadas, sem alterações alheias no manifesto.

## Procedimento operacional após o checklist

Executar automaticamente `pnpm openspec:finish --change add-google-classroom-integration --manifest .openspec-local/add-google-classroom-integration-manifest.json --message "[feat] integrar Google Classroom para importar matérias e tarefas"`. O fluxo cria commit único, aplica snapshots e arquiva/amenda o próprio commit local, sem push/tag. Conferir hash final e arquivos. Em falha posterior ao commit, retomar journal sem outro commit. Este procedimento é posterior ao checklist porque o comando recusa tarefas incompletas.
