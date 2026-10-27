# Design

## Context

Ver [proposal.md](proposal.md) e a [spec](specs/roadmap-step-regeneration/spec.md). Matérias e geração inicial estão implementadas. `subject_roadmap_steps` possui UUID interno, recriado em toda edição; o DTO expõe somente título e descrição. Não existe conclusão nem revisão. A ampliação autorizada estabelece essa base, usando o módulo de matérias para persistência e seu serviço público para integração da IA. MySQL usa migrations versionadas e `synchronize: false`.

## Goals / Non-Goals

**Goals:** tornar a substituição do plano uma operação explícita, reversível e concorrente com segurança; manter a IA restrita à proposta de passos pendentes; preservar o progresso atual mesmo após restauração.

**Non-Goals:** criar o primeiro roadmap de uma matéria, replanejar passos concluídos, gerar tarefas ou alterar associações com Pomodoro. A edição manual existente continua sendo responsabilidade do módulo de matérias.

## Decisions

### 0. Base autorizada de identidade e progresso

Expor o UUID existente e `completed` booleano de cada passo, inicialmente falso. Acrescentar `revision` ao roadmap, inicialmente 1. Criação manual e geração inicial continuam recebendo texto sem identidade ou conclusão; a API cria os IDs. PATCH manual recebe conteúdo com IDs opcionais para passos novos e `baseRevision` obrigatório; conserva IDs ativos e recusa IDs desconhecidos, duplicatas e alteração do prefixo protegido. Conclusão/reabertura usa `PATCH /subjects/:subjectId/roadmaps/:roadmapId/steps/:stepId` com `completed` e `baseRevision`, cria revisão manual e invalida prévias anteriores. A web oferece checkbox de progresso e protege conteúdo/ordem do prefixo no editor manual. A reabertura é uma decisão explícita de progresso, sem efeito de IA.

A ordem é comparada como sequência plana de passos, cada um carregando título/descrição do bloco. A prévia mantém esse contexto e a confirmação recompõe grupos consecutivos, dividindo grupos maiores que 20 passos, com até 20 blocos e 400 passos. Passos sugeridos usam o contexto do bloco da âncora. Blocos sem passos deixam de compor a nova sequência; os snapshots guardam integralmente a organização anterior. Essa representação permite mover entre blocos sem descartar conteúdo do trecho preservado.

Rotas adicionais: POST `.../step-regenerations`, POST `.../revision-confirmations`, GET `.../revisions`, GET `.../revisions/:revision`, POST `.../restoration-previews`. Prévia contém revisão base, sequência, quantidade preservada, origem, revisão histórica de origem, avisos, comprovante e chave de idempotência. Confirmação exige `confirm: true`, revisão base, chave, comprovante e sequência final. O comprovante de 30 minutos assina conta, matéria, roadmap, origem, revisão base e hash do prefixo. Usa chave derivada com domínio próprio de `EMAIL_HMAC_KEY`, disponível mesmo sem IA para restauração. A IA usa o mesmo adaptador limitado da geração inicial, com schema de sufixo de até 400 passos e contexto autorizado, sem credenciais no cliente.

Uma migration adiciona conclusão e revisão ativa e cria snapshots JSON imutáveis, únicos por roadmap/revisão e por chave de confirmação. Backfill preserva IDs e conteúdo atuais como revisão 1; a origem é `ia` quando há identificador de geração anterior, ou `manual` nos demais casos. Snapshots são gravados apenas em transações confirmadas; o ponteiro ativo e as tabelas de conteúdo são atualizados juntos. Leituras e escritas filtram conta e matéria. A confirmação bloqueia a matéria/roadmap, resolve repetição pela chave antes do conflito de revisão, e devolve o mesmo snapshot confirmado. Restauração seleciona apenas passos históricos pendentes, remove IDs já preservados e recusa títulos duplicados com explicação.

### 1. Limite de regeneração e identidade dos passos

O limite editável começa após o último passo concluído na ordem ativa. Essa regra preserva qualquer conclusão, inclusive quando houver passos pendentes antes dela. O cliente permite mover somente passos pendentes dentro desse trecho. Depois do movimento, envia ao servidor o identificador do passo movido, a nova ordem pendente e a revisão base. O servidor reconstrói o prefixo protegido a partir do roadmap atual, verifica as identidades e a posição de inserção, e usa o prefixo até o passo movido como âncora. Somente o sufixo posterior é enviado à IA para replanejamento, junto com objetivo e contexto autorizado da matéria. O passo movido permanece, com identidade e conteúdo originais.

Alternativa considerada: regenerar a partir do início ou permitir mover passos concluídos. Isso poderia apagar progresso ou alterar a sequência já estudada.

### 2. Prévia temporária e confirmação explícita

A API terá operações autenticadas para gerar uma prévia, confirmar a prévia, listar e consultar revisões, e preparar/confirmar uma restauração. A prévia retorna a sequência candidata, o prefixo imutável, a revisão base e avisos de validação. Ela fica no estado da interface e não vira uma versão persistida. Na confirmação, o cliente envia a sequência final editada e a revisão base; a API não confia no conteúdo do cliente sem nova validação. Erro, cancelamento ou fechamento descartam a prévia sem alterar dados. O envio de confirmação terá chave de idempotência para que uma repetição da mesma ação não crie duas revisões.

Alternativa considerada: gravar a saída da IA imediatamente ou persistir cada rascunho. Ambas criariam versões ativas não aprovadas ou histórico de tentativas descartadas.

### 3. Versões confirmadas e concorrência

Uma migration adicionará armazenamento imutável de snapshots por roadmap, com número de revisão, passos ordenados, estados de conclusão, data e origem (`manual`, `ia`, `restauracao`) e referência à revisão de origem quando houver restauração. O roadmap terá um único ponteiro ou número de revisão ativa; a consulta principal lê somente essa versão. Antes da primeira substituição, a API registra um snapshot da versão até então ativa. Toda confirmação posterior registra a nova versão, preservando as anteriores enquanto o roadmap existir. A operação inteira usa transação MySQL com bloqueio da linha do roadmap e comparação da revisão base; divergência retorna conflito e exige nova prévia. A exclusão do roadmap remove seus snapshots na mesma política de exclusão da matéria.

O serviço de matérias precisará criar uma nova revisão e snapshot também em edições manuais confirmadas, para invalidar prévias abertas e manter o histórico coerente; se a implementação anterior ainda não versionar mudanças manuais, essa integração será feita neste apply. IDs estáveis permitem preservar o estado atual dos passos concluídos. A API filtra roadmap e revisões pelo usuário em todas as leituras e escritas.

Alternativa considerada: sobrescrever os passos ativos sem snapshots ou armazenar só a versão imediatamente anterior. Isso não permitiria recuperar planos mais antigos. Manter todas as versões confirmadas aumenta o uso de armazenamento; listagem paginada e exclusão em cascata limitam o custo operacional.

### 4. Restauração como nova confirmação

Selecionar uma revisão histórica produz prévia: o prefixo atual até o último passo concluído permanece intacto; do snapshot escolhido vêm os passos posteriores ainda não concluídos, mantendo conteúdo e ordem daquela revisão e removendo IDs já presentes no prefixo. O servidor valida a composição e a pessoa pode editar o sufixo antes de confirmar. Uma revisão histórica com conteúdo incompatível gera erro explicativo em vez de substituir silenciosamente o progresso. A confirmação cria nova revisão ativa com origem `restauracao`, sem apagar a versão histórica nem a ativa anterior.

Alternativa considerada: apontar a revisão ativa diretamente para um snapshot antigo. Isso poderia reverter conclusões recentes e impedir que o histórico mostre a restauração como uma nova decisão.

### 5. Validação da IA e da edição

O schema de resposta da IA exige lista limitada de passos com título e descrição válidos. O servidor normaliza títulos por Unicode, espaços e comparação sem distinção de maiúsculas, rejeita IDs repetidos e títulos normalizados iguais em toda a sequência, e impede alteração do prefixo protegido. O pedido à IA solicita que evite repetir conceitos do prefixo ou do restante da matéria. Como equivalência semântica não é determinística, a prévia destaca possíveis semelhanças para revisão humana. O usuário não pode confirmar duplicatas objetivas mesmo após edição. Falha ou resposta inválida permite nova tentativa, sem efeito no roadmap ativo.

Alternativa considerada: confiar apenas na instrução enviada ao modelo. A saída do provedor e as edições do cliente precisam da mesma validação de fronteira.

### 6. Interface e disponibilidade

A página da matéria exibirá controles de mover para cima/baixo operáveis por teclado no trecho pendente, prévia com indicação de partes preservadas e sugeridas, edição inline, confirmação e cancelamento. O histórico será paginado e permitirá examinar uma versão antes de restaurar. Ações de IA aparecem somente quando módulo de matérias e preferência de IA estiverem ativos; edição manual e consulta ao histórico não dependem da disponibilidade do provedor de IA. Os estados de loading, erro, vazio e sucesso serão explícitos, com foco visível, sem rolagem horizontal a 320 px e sem transições obrigatórias para quem prefere movimento reduzido.

## Risks / Trade-offs

- [Mudanças concorrentes deixam a prévia obsoleta] → comparação de revisão e resposta de conflito, com instrução para gerar nova prévia.
- [A IA sugere repetição conceitual com título diferente] → contexto no pedido, destaque de semelhanças e revisão obrigatória antes de confirmar; duplicatas por identidade ou título normalizado são bloqueadas.
- [Histórico cresce com o uso] → snapshots somente de versões confirmadas, paginação e remoção junto com o roadmap; não haverá expiração automática que impeça recuperação.
- [Identidade e progresso ausentes na base entregue] → expor IDs existentes, adicionar conclusão inicialmente falsa e atualizar o editor manual neste apply autorizado.

## Migration Plan

1. Após a implementação de matérias e geração inicial, adicionar migration de revisões/snapshots e adaptar o serviço de matérias para manter revisão atualizada em edições confirmadas.
2. Introduzir leitura de histórico e confirmação transacional, depois geração de prévia e restauração, preservando roadmaps existentes como revisão inicial na primeira substituição ou por backfill seguro.
3. Publicar a interface quando API e contratos estiverem disponíveis; testar concorrência, isolamento por usuário, restauração e MySQL real em banco de teste isolado.
4. Em rollback, desabilitar as novas ações na web e API, mantendo os dados versionados para nova implantação; não descartar snapshots automaticamente.
