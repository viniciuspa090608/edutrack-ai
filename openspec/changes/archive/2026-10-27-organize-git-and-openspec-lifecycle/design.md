# Design

## Context

Ver proposal.md para a motivação. Baseline em 27/10/2026: master em 5acb1ba, referência local origin/master em 86c3414, nenhum remoto/upstream, working tree inicialmente limpo. OpenSpec lista 35 mudanças completas e refine-auth-desktop-layout com 20/23 tarefas. Checkboxes são indicação de progresso, não prova independente de validação. AGENTS.md e operations.apply.guidance atualmente proíbem archive automático; serão atualizados de forma coerente.

## Goals / Non-Goals

**Goals:** conclusão reproduzível, rastreável e retomável; um único commit final por apply; archive automático somente da mudança identificada; backlog reconciliado sem perder evolução de requisitos; diagnóstico fiel da publicação.

**Non-Goals:** alterar produto ou dependências de runtime, limpar branches por exclusão, trocar master por main sem necessidade, publicar automaticamente, modificar skills geradas ou criar hooks globais.

## Decisions

### 1. Preservar histórico e identificar o remoto

Registrar status, refs, worktrees e tracking antes do apply. Solicitar a URL somente se não houver fonte confiável no ambiente. Validar acesso e refs com consulta ao servidor; não escolher repositório pelo nome. Fazer fetch após confirmar a URL e comparar ancestralidade, commits exclusivos e branch padrão. Configurar origin e upstream apenas para branches comprovadamente correspondentes; divergência exige relatório e plano de integração sem reset ou force-push. Não remover a referência origin/master antiga como forma de esconder a inconsistência. Se a URL faltar, concluir trabalho local independente e manter a tarefa remota explicitamente bloqueada; não declarar toda a mudança concluída.

Manter master local. Novos applies usam codex/<nome-da-mudança>, quando não houver branch de trabalho adequada. Documentar integração sem squash/rebase que duplique ou descarte o commit da mudança, e publicação separada mediante solicitação. Não criar develop ou branches vazias.

### 2. Auditar o backlog antes de mover

Produzir inventário versionado com mudança, commit(s) associados, evidência de validação, dependências, capacidades afetadas e decisão. Processar mudanças em ordem topológica, usando histórico para ordenar revisões da mesma capacidade. Comparar deltas com specs atuais e preservar requisitos/cenários posteriores; não executar archive em lote apenas pela ordem alfabética ou pelo total de checkboxes.

Antes de cada sync, ler instruções specs da mudança e usar o fluxo de merge do OpenSpec. Capacidade ausente com MODIFIED sem base é bloqueio a investigar. Verificar semanticamente o resultado antes do archive. Conflitos não resolvidos permanecem ativos com motivo no inventário. refine-auth-desktop-layout não será concluída ficticiamente; registrar quais pendências são históricas e quais exigem apply separado. Os arquivos do backlog entram no commit de organização desta mudança, sem alterar seus commits antigos nem criar novos commits de implementação para cada mudança antiga.

### 3. Conclusão pelo fluxo do apply, sem hook genérico

Disponibilizar comando local pnpm openspec:finish --change <nome>, com modo de inspeção e precondições documentadas. O agente continua responsável por interpretar e sincronizar deltas através dos workflows OpenSpec; o comando não faz merge textual cego nem considera orientação YAML uma automação executável. Integrar a sequência em AGENTS.md, operations.apply/ archive e README. O comando executa verificações determinísticas e a etapa de archive usando a CLI disponível; consultar contratos reais da CLI no apply antes de escolher flags.

Sequência:

1. Capturar baseline e manifesto de paths/hunks próprios. Recusar staged alheio, nome inválido, mudança ambígua, tarefas incompletas, falha de validação, destino existente ou lock de outra conclusão. Executar checks obrigatórios e registrar resultados reais, inclusive banco isolado.
2. Preparar análise de sync e resolver conflitos antes do commit. Registrar tasks finais de implementação e revisão; a etapa de archive é pós-condição externa, sem checkbox circular que bloqueie a si mesma.
3. Criar exatamente um commit de implementação com tasks finais, formato permitido e diff staged revisado/check aprovado. Registrar hash inicial, pai e manifesto em journal local ignorado pelo Git, sem segredos. Sem diff novo, não criar commit vazio; archive ainda pode ocorrer quando houver commit de conclusão comprovado e elegível.
4. Confirmar que HEAD permanece no commit criado por esta execução e que ele não foi publicado. Se o remoto for desconhecido, permitir somente commit cuja criação nesta execução e ausência de publicação sejam garantidas; retomada de commit antigo sem evidência de propriedade/publicação é bloqueada para amend.
5. Executar sync autorizado das specs e verificar equivalência, depois arquivar a mudança identificada em archive/YYYY-MM-DD-<nome>, usando data local America/Sao_Paulo. A autorização desta política cobre sync e archive sem nova confirmação em casos regulares; casos incompletos/conflitantes interrompem o fluxo.
6. Adicionar somente movimentos e specs próprios; revisar staged e executar git diff --cached --check; usar amend --no-edit apenas no commit desta execução ainda não publicado. O hash muda: informar somente o hash final como resultado, com arquivos e caminho do archive. Nenhum commit histórico ou publicado é alterado.
7. Verificar ausência da mudança ativa, presença íntegra do archive e inclusão de todos os paths próprios no commit final; preservar alterações preexistentes. Remover lock e finalizar journal.

Alternativa rejeitada: hook post-commit irrestrito, pois dispara em commits comuns e pode causar recursão. Alternativa rejeitada: segundo commit por archive novo, pois rompe a convenção de um commit final por mudança. O amend é explícito, restrito e anterior à publicação.

### 4. Falhas e retomada

Journal guarda fase, identidade do commit e paths, permitindo diferenciar commit criado, sync aplicado, archive movido e amend pendente. Não fazer reset/clean automático nem desfazer trabalho alheio. Falha antes do commit mantém mudança ativa e sem commit de conclusão; falha posterior informa que a conclusão está pendente e retoma a fase segura sem criar outro commit. HEAD alterado, commit publicado, arquivo modificado por terceiros ou destino incompatível interrompe a retomada. Uma execução sobre archive já concluído verifica resultado e termina sem novo diff/commit. Não usar --no-verify nem ignorar falhas de hooks. Testar em repositórios temporários, incluindo bare remoto local para publicação.

## Risks / Trade-offs

- Deltas sobrepostos podem ressuscitar requisitos antigos → inventário, ordem por dependência e revisão de cenários ao sincronizar.
- Falha após o commit ou movimento → journal e retomada por fase, sem segundo commit ou rollback destrutivo.
- Amend altera hash → restrição ao commit novo não publicado e reporte do hash final.
- Remoto indisponível → tarefas locais independentes continuam, publicação não é presumida e tarefa remota permanece pendente.
- Archive não é push → documentação separa histórico local, arquivo OpenSpec e publicação no servidor.

## Migration Plan

Inventariar e comparar o Git; resolver remoto quando disponível; auditar backlog; implementar/testar comando; alinhar instruções; sincronizar/arquivar somente backlog elegível; executar checks de qualidade; concluir e autoarquivar esta própria mudança pelo novo fluxo. Reverter a organização por mudança Git revisada, sem apagar histórico. Não restaurar archives por cópia em massa; usar inventário para preservar specs posteriores.
