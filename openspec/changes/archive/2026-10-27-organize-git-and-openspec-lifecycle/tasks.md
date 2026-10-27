# Tasks

## 1. Baseline e vínculo remoto

- [x] 1.1 Registrar Git status, HEAD, branches, upstreams, remotos e worktrees antes de editar; verificar manifesto de alterações preexistentes e preservar esta proposta sem misturar arquivos alheios.
- [x] 1.2 Identificar URL confiável do repositório, configurar origin e consultar branches reais; verificar acesso, ancestralidade e comparação local/remoto após fetch. Sem URL/acesso, registrar bloqueio desta tarefa e continuar tarefas independentes sem declarar conclusão global.
- [x] 1.3 Configurar upstream compatível e documentar branch principal, branches codex/<mudança>, integração e publicação explícita; verificar git branch -vv e comparação com refs reais, sem push, exclusões ou renomeação desnecessária.

## 2. Inventário OpenSpec

- [x] 2.1 Auditar as 36 mudanças preexistentes e gerar inventário com commits, evidências, dependências, capacidades e decisão; verificar contagens contra openspec list --json e histórico Git, distinguindo checkboxes de validação comprovada.
- [x] 2.2 Reconciliar o registro de refine-auth-desktop-layout com o histórico, mantendo pendências sem evidência ativas; verificar relatório das três tarefas e separar eventual implementação pendente para apply próprio, sem inventar conclusão.
- [x] 2.3 Analisar deltas históricos e produzir ordem de sync/archive e mapa de conflitos; verificar dependências e revisões sucessivas da mesma capacidade, sem modificar specs principais nesta etapa.

## 3. Fluxo de conclusão automática

- [x] 3.1 Confirmar contratos da CLI instalada e implementar pnpm openspec:finish com --change explícito, inspeção, manifesto e precondições; verificar em repositório temporário que nome inválido, staged alheio, falha de qualidade, tasks incompletas e destino existente bloqueiam mutação.
- [x] 3.2 Integrar análise/sync pelo agente e archive determinístico após commit, incorporando somente paths próprios via amend do commit recém-criado não publicado; verificar em fixture uma mudança com deltas e outra skip_specs, com um único commit final, tasks arquivado e specs sincronizadas.
- [x] 3.3 Implementar journal local ignorado, lock e retomada por fase; injetar falhas após commit, sync, movimento e antes de amend e verificar retomada sem duplicação, perda de arquivos ou segundo commit.
- [x] 3.4 Testar idempotência e limites Git em repositórios temporários, incluindo bare remoto local; verificar recusa de amend de commit publicado/HEAD trocado, preservação de alterações preexistentes, ausência de push e nenhuma criação de commit vazio.
- [x] 3.5 Alinhar AGENTS.md, openspec/config.yaml e README ao fluxo commit → sync → archive → amend, incluindo recuperação e autorização automática regular; verificar ausência da proibição antiga, ausência de hooks globais e execução documentada do comando em fixture.

## 4. Organização do backlog

- [x] 4.1 Sincronizar os deltas elegíveis em ordem auditada, seguindo instruções specs de cada mudança e merge semântico; verificar requisitos e cenários finais sem regressão de revisões posteriores e registrar conflitos preservados.
- [x] 4.2 Arquivar somente mudanças históricas com conclusão comprovada e sync verificado; verificar integridade dos arquivos, data correta, inventário atualizado e permanência ativa de pendências justificadas, sem recriar commits históricos.
- [x] 4.3 Atualizar README com estado atual, operação Git e diferença entre commit, archive e publicação; verificar comandos existentes e coerência com o inventário e git status.

## 5. Validação e preparação da conclusão

- [x] 5.1 Executar testes do fluxo e pnpm lint, pnpm typecheck, pnpm test e pnpm build sequencialmente, com MySQL real isolado; verificar aprovação e registrar resultados sem suprimir falhas de configuração.
- [x] 5.2 Validar esta proposta e specs finais com OpenSpec, revisar paths próprios e preparar tasks finais; verificar git diff --check, ausência de segredos/artefatos locais e nenhuma tarefa bloqueada marcada como concluída.
- [x] 5.3 Preparar manifesto final e invocação do novo fluxo para esta própria mudança, com mensagem [update] organizar versionamento e ciclo de mudanças OpenSpec; verificar inspeção do comando e diff staged/check antes de marcar a preparação concluída.

Pós-condição externa às checkboxes de implementação: executar o fluxo preparado, verificar o único commit final com archive desta própria mudança incluído e informar hash, arquivos, caminho e estado remoto. Se commit/archive/amend falhar, reportar conclusão pendente e retomar pelo journal; não declarar sucesso apenas porque as checkboxes estão completas.
